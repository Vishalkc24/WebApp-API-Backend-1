// Import Express framework to create routing system
const express = require('express');

// Create a new router instance to define routes
const router = express.Router();

// Import the shapeController to handle the route logic
const shapeController = require('../controller/shapeController');

// Define the route to get all shapes
// This route listens for GET requests on '/api/shapes' and calls getAllShapes function
// router.get('/api/shapes', shapeController.getAllShapes);

// Define the route to get shape by shape_id
// This route listens for GET requests on '/api/shapes/:shape_id' and calls getShapeById function
router.get('/api/shapes/:shape_id', shapeController.getShapeById);

module.exports = router;
