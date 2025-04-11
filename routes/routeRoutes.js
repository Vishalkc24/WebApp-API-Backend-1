// Import Express framework to create routing system
const express = require('express');

// Create a new router instance to define routes
const router = express.Router();

// Import the routeController to handle the route logic
const routeController = require('../controller/routeController');

// Define the route to get all routes
// This route listens for GET requests on '/api/routes' and calls getAllRoutes function
router.get('/api/routes', routeController.getAllRoutes);

// Define the route to get a specific route by ID
router.get('/api/routes/:route_id', routeController.getRouteByID);

// Define the route to get polyline data by route_id from the database
router.get('/api/bmtc-polyline/:route_id', routeController.getBmtcPolylineByRouteID);

// Define the route to get polyline data by route_id from the database
router.get('/api/fetch-trip-stop-times/:route_id', routeController.getBmtcTripStopTimesByRouteID);

// Export the router to be used in the main application
module.exports = router;

