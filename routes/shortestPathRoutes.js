// shortestPathRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller
const shortestPathController = require('../controller/shortestPathController');

// Define the route to get the shortest path for a given route_id
router.get('/api/shortest-path/:route_id', shortestPathController.getShortestPathByRoute);

module.exports = router;
