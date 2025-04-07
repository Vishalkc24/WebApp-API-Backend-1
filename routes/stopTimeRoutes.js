// Import Express framework to create routing system
const express = require('express');

// Create a new router instance to define routes
const router = express.Router();

// Import the stopTimeController to handle the stop time logic
const stopTimeController = require('../controller/stopTimeController');

// Define the route to get stop times for a specific trip_id
router.get('/api/stop-times/:trip_id', stopTimeController.getStopTimesByTripId);  // This is a GET request

// Define the route to get route details, trips, and stop times by route_id
router.get('/api/routes/trips-stop-times/:route_id', stopTimeController.getRouteTripsStopTimes);

// Export the router to be used in the main application
module.exports = router;
