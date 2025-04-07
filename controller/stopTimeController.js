const fs = require('fs');
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

// Controller to get route details, trips, and stop times by route_id
const getRouteTripsStopTimes = async (req, res) => {
  const routeID = parseInt(req.params.route_id);
  const routeFilePath = process.env.ROUTES_FILE_PATH;
  const tripsFilePath = process.env.TRIPS_WITH_SHAPES_FILE_PATH;
  const stopTimesFilePath = process.env.STOP_TIMES_FILE_PATH;

  try {
    // Fetch Route
    const routeData = fs.readFileSync(routeFilePath, 'utf8');
    const routeLines = routeData.split('\n').filter(line => line.trim() !== '');
    const routes = routeLines.slice(1).map(line => {
      const [route_id, route_desc, route_type] = line.split(',').map(item => item.trim());
      return { route_id: parseInt(route_id), route_desc, route_type: parseInt(route_type) };
    });

    const route = routes.find(route => route.route_id === routeID);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Fetch Trips
    const tripsData = fs.readFileSync(tripsFilePath, 'utf8');
    const tripLines = tripsData.split('\n').filter(line => line.trim() !== '');
    const trips = tripLines.slice(1).map(line => {
      const [route_id, service_id, trip_id, shape_id] = line.split(',').map(item => item.trim());
      return { route_id: parseInt(route_id), service_id, trip_id, shape_id };
    });

    const routeTrips = trips.filter(trip => trip.route_id === routeID);

    if (routeTrips.length === 0) {
      return res.status(404).json({ message: 'No trips found for this route' });
    }

    // Fetch Stop Times for each trip
    const stopTimes = {};
    for (let i = 0; i < routeTrips.length; i++) {
      const trip = routeTrips[i];
      const stopTimesData = fs.readFileSync(stopTimesFilePath, 'utf8');
      const stopTimesLines = stopTimesData.split('\n').filter(line => line.trim() !== '');
      const stopTimesForTrip = [];

      stopTimesLines.slice(1).forEach(line => {
        const [trip_id, arrival_time, departure_time, stop_id, stop_sequence] = line.split(',').map(item => item.trim());
        if (trip_id === trip.trip_id) {
          stopTimesForTrip.push({
            arrival_time,
            departure_time,
            stop_id,
            stop_sequence
          });
        }
      });

      if (stopTimesForTrip.length > 0) {
        stopTimes[`stopTimes_${i + 1}`] = stopTimesForTrip;
      }
    }

    // Combine route data, trips, and stop times into the response
    res.json({
      route,
      trips: routeTrips,
      ...stopTimes
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
