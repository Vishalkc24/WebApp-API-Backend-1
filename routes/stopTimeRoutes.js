// Import Express framework to create routing system
const express = require('express');

// Create a new router instance to define routes
const router = express.Router();

// Import the stopTimeController to handle the stop time logic
const stopTimeController = require('../controller/stopTimeController');

// Define the route to get stop times for a specific trip_id
router.get('/api/stop-times/:trip_id', stopTimeController.getStopTimesByTripId);  // This is a GET request

// Export the router to be used in the main application
module.exports = router;
