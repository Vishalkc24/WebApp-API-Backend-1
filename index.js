// Log before initializing the Express app
console.log("Before Express app initialization");

// Import necessary modules
// Import Express framework
const express = require('express'); 
// Import the cors package
const cors = require('cors');

// Import dotenv to load environment variables
const dotenv = require('dotenv');  

// Import the routes from routeRoutes.js
const routeRoutes = require('./routes/routeRoutes');  

// Import the trips from tripRoutes.js
const tripRoutes = require('./routes/tripRoutes');  

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

// Define the port from environment variables or fallback to 3000
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Log after Express app has been initialized
console.log("After Express app initialization");
