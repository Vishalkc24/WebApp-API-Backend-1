// Import Express framework to create routing system
const express = require('express');

// Create a new router instance to define routes
const router = express.Router();

// Import the stopController to handle the stop logic
const stopController = require('../controller/stopController');

// Define the route to get all stops
router.get('/api/stops', stopController.getAllStops);  // This is a GET request

// Export the router to be used in the main application
module.exports = router;
