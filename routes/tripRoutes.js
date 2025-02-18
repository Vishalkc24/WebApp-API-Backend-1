// Import Express framework to create routing system
const express = require('express');

// Create a new router instance to define routes
const router = express.Router();

// Import the tripController to handle the trip logic
const tripController = require('../controller/tripController');

// Define the route to get all trips
// This route listens for GET requests on '/api/trips' and calls getAllTrips function
router.get('/api/trips', tripController.getAllTrips);

// Define the route to get a specific trip by trip_id
router.get('/api/trips/:trip_id', tripController.getTripByID);

// Export the router to be used in the main application
module.exports = router;
