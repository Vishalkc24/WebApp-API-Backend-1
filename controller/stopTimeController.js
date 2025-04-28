const fs = require('fs');  // Use the regular fs module for streams
const readline = require('readline');
require('dotenv').config();

// Controller to get stop times for a specific trip_id
const getStopTimesByTripId = (req, res) => {
  console.log('Fetching stop times for trip_id:', req.params.trip_id);

  // Get the file path from the environment variable
  const filePath = process.env.STOP_TIMES_FILE_PATH;

  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Initialize an array to hold the stop times for the specific trip_id
    const stopTimes = [];

    // Loop through each line and parse it
    lines.slice(1).forEach(line => {
      const [trip_id, arrival_time, departure_time, stop_id, stop_sequence] = line.split(',').map(item => item.trim());

      // If the trip_id matches the requested trip_id, add the stop time record
      if (trip_id === req.params.trip_id) {
        stopTimes.push({
          arrival_time: arrival_time,
          departure_time: departure_time,
          stop_id: stop_id,
          stop_sequence: stop_sequence
        });
      }
    });

    // If no stop times were found for the trip_id, send an appropriate message
    if (stopTimes.length === 0) {
      return res.status(404).json({ error: `trip_id: ${req.params.trip_id} not found` });
    }

    // Send the stopTimes array as a JSON response
    res.json({ stopTimes });

  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an empty array if an error occurs
    res.json({ stopTimes: [] });
  }
};

// Cache for the routes, trips, and stop times data
let cachedRoutes = [];
let cachedTrips = [];
let cachedStopTimes = [];

// Read data files once at the start of the application (in memory cache)
const loadData = async () => {
  try {
    // Create a read stream for the files
    const routeStream = fs.createReadStream(process.env.ROUTES_FILE_PATH, 'utf8');
    const tripStream = fs.createReadStream(process.env.TRIPS_WITH_SHAPES_FILE_PATH, 'utf8');
    const stopTimesStream = fs.createReadStream(process.env.STOP_TIMES_FILE_PATH, 'utf8');

    // Use readline to process files line-by-line
    const rlRoute = readline.createInterface({
      input: routeStream,
      output: process.stdout,
      terminal: false
    });

    rlRoute.on('line', (line) => {
      if (line.trim() !== '') {
        const [route_id, route_desc, route_type] = line.split(',').map(item => item.trim());
        cachedRoutes.push({ route_id: parseInt(route_id), route_desc, route_type: parseInt(route_type) });
      }
    });

    const rlTrip = readline.createInterface({
      input: tripStream,
      output: process.stdout,
      terminal: false
    });

    rlTrip.on('line', (line) => {
      if (line.trim() !== '') {
        const [route_id, service_id, trip_id, shape_id] = line.split(',').map(item => item.trim());
        cachedTrips.push({ route_id: parseInt(route_id), service_id, trip_id, shape_id });
      }
    });

    const rlStopTimes = readline.createInterface({
      input: stopTimesStream,
      output: process.stdout,
      terminal: false
    });

    rlStopTimes.on('line', (line) => {
      if (line.trim() !== '') {
        const [trip_id, arrival_time, departure_time, stop_id, stop_sequence] = line.split(',').map(item => item.trim());
        cachedStopTimes.push({ trip_id, arrival_time, departure_time, stop_id, stop_sequence });
      }
    });

    // Wait until all files are read completely
    await Promise.all([new Promise((resolve) => rlRoute.on('close', resolve)),
                       new Promise((resolve) => rlTrip.on('close', resolve)),
                       new Promise((resolve) => rlStopTimes.on('close', resolve))]);

    console.log('Data loaded into cache successfully.');

  } catch (error) {
    console.error('Error loading data:', error);
  }
};

// Initial load of data when server starts
loadData();

// Controller to get route details, trips, and stop times by route_id
const getRouteTripsStopTimes = async (req, res) => {
  const routeID = parseInt(req.params.route_id);

  try {
    // Get the cached route
    const route = cachedRoutes.find(r => r.route_id === routeID);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Get the trips for this route
    const routeTrips = cachedTrips.filter(trip => trip.route_id === routeID);
    if (routeTrips.length === 0) {
      return res.status(404).json({ message: 'No trips found for this route' });
    }

    // Create a lookup table for stop times to avoid multiple iterations
    const stopTimesLookup = {};
    cachedStopTimes.forEach(stop => {
      if (!stopTimesLookup[stop.trip_id]) {
        stopTimesLookup[stop.trip_id] = [];
      }
      stopTimesLookup[stop.trip_id].push(stop);
    });

    // Prepare the stop times for each trip in parallel
    const stopTimes = await Promise.all(
      routeTrips.map(async (trip, index) => {
        const tripStopTimes = stopTimesLookup[trip.trip_id] || [];
        return {
          [`stopTimes_${index + 1}`]: tripStopTimes
        };
      })
    );

    // Combine route data, trips, and stop times into the response
    res.json({
      route,
      trips: routeTrips,
      ...stopTimes.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    });
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: 'Error processing the request' });
  }
};

module.exports = {
  getStopTimesByTripId,
  getRouteTripsStopTimes
};