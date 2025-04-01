// Log before initializing the Express app
console.log("Before Express app initialization");

// Import necessary modules
// Import Express framework
const express = require('express'); 
// Import the cors package
const cors = require('cors');

// Import dotenv to load environment variables
const dotenv = require('dotenv');  

const { Pool } = require('pg');

// Database connection configuration using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Import the routes from routeRoutes.js
const routeRoutes = require('./routes/routeRoutes');  

// Import the trips from tripRoutes.js
const tripRoutes = require('./routes/tripRoutes');  

// Import the stops from stopRoutes.js
const stopRoutes = require('./routes/stopRoutes'); 

// Import the stop times from stopRoutes.js
const stoptimeRoutes = require('./routes/stopTimeRoutes'); 

// Import the new route for shortest path calculation
const shortestPathRoutes = require('./routes/shortestPathRoutes');

// Import the shapes from shapeRoutes.js
const shapeRoutes = require('./routes/shapeRoutes');

// Initialize dotenv to load environment variables from .env file
dotenv.config();

// Log indicating the server is starting
console.log("Starting the server...");

// Initialize the Express app
const app = express();

// Enable CORS for all domains (this allows all cross-origin requests)
app.use(cors());

// Middleware to handle JSON requests
app.use(express.json());

// Use the imported routes in the app
app.use(routeRoutes);

// Use the imported trips in the app
app.use(tripRoutes);

// Use the imported stops in the app
app.use(stopRoutes);

// Use the imported stop times in the app
app.use(stoptimeRoutes);

// Use the new routes in the application
app.use(shortestPathRoutes);

// Use the imported shapes in the app
app.use(shapeRoutes);

// Define the port from environment variables or fallback to 3000
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Log after Express app has been initialized
console.log("After Express app initialization");


// 1st download osm map of bangalore region
  // all stops are covered in the map
  // then for every route, each route has 4 stops, a-b, b-c, c-d, d-e and save it in db
  // write api to get shortest path between the routes