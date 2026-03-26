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
      // New format: trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign
      const [trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign] = line.split(',').map(item => item.trim());

      // If the trip_id matches the requested trip_id, add the stop time record
      if (trip_id === req.params.trip_id) {
        stopTimes.push({
          arrival_time: arrival_time,
          departure_time: departure_time,
          stop_id: stop_id,
          stop_sequence: stop_sequence,
          stop_headsign: stop_headsign || null
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

// Helper to completely reset in-memory caches (kept for potential future use)
const resetCache = () => {
  cachedRoutes = [];
  cachedTrips = [];
  cachedStopTimes = [];
};

// Read data files (routes, trips, stop_times) into the in-memory cache
const loadRoutesAndTrips = async () => {
  try {
    // Create a read stream for the files
    const routeStream = fs.createReadStream(process.env.ROUTES_FILE_PATH, 'utf8');
    // Use the main trips file (TRIPS_FILE_PATH) so all trips like 5953
    // are available here for route->trips->stop_times joining.
    const tripStream = fs.createReadStream(process.env.TRIPS_FILE_PATH, 'utf8');
    const stopTimesStream = fs.createReadStream(process.env.STOP_TIMES_FILE_PATH, 'utf8');

    // Use readline to process files line-by-line
    const rlRoute = readline.createInterface({
      input: routeStream,
      output: process.stdout,
      terminal: false
    });

    rlRoute.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Skip header line
      if (trimmed.startsWith('route_long_name,route_short_name,agency_id,route_type,route_id')) {
        return;
      }

      // New format: route_long_name,route_short_name,agency_id,route_type,route_id
      const [route_long_name, route_short_name, agency_id, route_type, route_id] = trimmed.split(',').map(item => item.trim());
      cachedRoutes.push({
        route_id: parseInt(route_id),
        route_type: parseInt(route_type),
        route_desc: route_long_name,
        route_long_name,
        route_short_name,
        agency_id: agency_id ? parseInt(agency_id) : null
      });
    });

    const rlTrip = readline.createInterface({
      input: tripStream,
      output: process.stdout,
      terminal: false
    });

    rlTrip.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Skip header line
      if (trimmed.startsWith('route_id,service_id,trip_headsign,direction_id,shape_id,trip_id')) {
        return;
      }

      // New format: route_id,service_id,trip_headsign,direction_id,shape_id,trip_id
      const [route_id, service_id, trip_headsign, direction_id, shape_id, trip_id] = trimmed.split(',').map(item => item.trim());
      cachedTrips.push({
        route_id: parseInt(route_id),
        service_id,
        trip_headsign,
        direction_id: direction_id ? parseInt(direction_id) : null,
        shape_id,
        trip_id
      });
    });

    const rlStopTimes = readline.createInterface({
      input: stopTimesStream,
      output: process.stdout,
      terminal: false
    });

    rlStopTimes.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Skip header line
      if (trimmed.startsWith('trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign')) {
        return;
      }

      // New format: trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign
      const [trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign] = trimmed.split(',').map(item => item.trim());
      cachedStopTimes.push({ trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign: stop_headsign || null });
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
loadRoutesAndTrips();

// Controller to get route details, trips, and stop times by route_id
const getRouteTripsStopTimes = async (req, res) => {
  const routeID = String(req.params.route_id).trim();
  // console.log('Received route_id:', routeID);

  try {
    // Get the cached route and check the format
    const route = cachedRoutes.find(r => {
      const route_id = String(r.route_id).trim();
      // console.log(`Checking route in cachedRoutes: route_id = "${route_id}", expected route_id = "${routeID}"`);
      return route_id === routeID;
    });

    if (!route) {
      // console.log('Route not found:', routeID);
      return res.status(404).json({ message: 'Route not found' });
    }
    // console.log('Found route:', route);

    // Get the trips for this route
    const routeTrips = cachedTrips.filter(trip => {
      const tripRouteId = String(trip.route_id).trim();
      return tripRouteId === routeID;
    });

    if (routeTrips.length === 0) {
      // console.log('No trips found for route:', routeID);
      return res.status(404).json({ message: 'No trips found for this route' });
    }

    // Shape trips to match desired header format, but keep trip_id for automation
    const shapedTrips = routeTrips.map(trip => ({
      route_id: trip.route_id,
      service_id: trip.service_id,
      trip_headsign: trip.trip_headsign,
      direction_id: trip.direction_id,
      trip_id: trip.trip_id
    }));

    // Create lookup tables for stop times to avoid multiple iterations
    const stopTimesByTripId = {};
    const stopTimesByHeadSign = {};
    for (const stop of cachedStopTimes) {
      const tripID = String(stop.trip_id || '').trim();
      const headSign = String(stop.stop_headsign || '').trim();

      if (tripID) {
        if (!stopTimesByTripId[tripID]) {
          stopTimesByTripId[tripID] = [];
        }
        stopTimesByTripId[tripID].push(stop);
      }

      if (headSign) {
        if (!stopTimesByHeadSign[headSign]) {
          stopTimesByHeadSign[headSign] = [];
        }
        stopTimesByHeadSign[headSign].push(stop);
      }
    }
    // console.log('Stop times by trip_id keys (sample):', Object.keys(stopTimesByTripId).slice(0, 20));
    // console.log('Stop times by stop_headsign keys (sample):', Object.keys(stopTimesByHeadSign).slice(0, 20));

    // Prepare the stop times for each trip in parallel
    const stopTimes = await Promise.all(
      routeTrips.map(async (trip, index) => {
        const tripIdKey = String(trip.trip_id || '').trim();
        const headsignKey = String(trip.trip_headsign || '').trim();
        const routeShortNameKey = String(route.route_short_name || '').trim();
        const routeLongNameKey = String(route.route_long_name || '').trim();

        const candidateKeys = [tripIdKey, headsignKey, routeShortNameKey, routeLongNameKey].filter(Boolean);

        let tripStopTimes = [];
        for (const key of candidateKeys) {
          if (stopTimesByTripId[key] || stopTimesByHeadSign[key]) {
            tripStopTimes = stopTimesByTripId[key] || stopTimesByHeadSign[key];
            break;
          }
        }

        return {
          [`stopTimes_${index + 1}`]: tripStopTimes
        };
      })
    );

    // Combine route data, trips (with header formatting), and stop times into the response
    const response = {
      route,
      trips: shapedTrips,
      ...stopTimes.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    };

    res.json(response);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: 'Error processing the request' });
  }
};

module.exports = {
  getStopTimesByTripId,
  getRouteTripsStopTimes
};