// Import the fs module to interact with the file system
const fs = require('fs');

// Load environment variables from the .env file
require('dotenv').config();

// Controller to get all routes
const getAllRoutes = (req, res) => {
  // Log the start of the route retrieval process
  console.log('Fetching all routes...');

  // Get the file path from the environment variable
  const filePath = process.env.ROUTES_FILE_PATH;

  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Parse each line into a route object
    const routes = lines.slice(1).map(line => {
      // Split each line by commas and trim extra spaces
      const [route_id, route_desc, route_type] = line.split(',').map(item => item.trim()); // Remove extra spaces
      return {
        // Parse and return the route data
        route_id: parseInt(route_id),
        route_desc: route_desc,
        route_type: parseInt(route_type)
      };
    });

    // Get the sort query parameter from the request, default to 'asc'
    const { sort = 'asc' } = req.query;  // Default sort to 'asc'

    // Sort the routes in ascending order if 'asc' is passed as the sort order
    if (sort === 'asc') {
      routes.sort((a, b) => a.route_id - b.route_id);  // Ascending order
    }

    // Send the routes as a JSON response
    res.json({ routes });
    
  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an empty array in case of an error
    res.json({ routes: [] });
  }
};

// Controller to get a route by ID
const getRouteByID = (req, res) => {
  const filePath = process.env.ROUTES_FILE_PATH;

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    const routes = lines.slice(1).map(line => {
      const [route_id, route_desc, route_type] = line.split(',').map(item => item.trim());
      return {
        route_id: parseInt(route_id),
        route_desc: route_desc,
        route_type: parseInt(route_type)
      };
    });

    const routeID = parseInt(req.params.route_id);
    const route = routes.find(route => route.route_id === routeID);

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json(route);
  } catch (err) {
    console.error('Error reading file:', err);
    res.status(500).json({ message: 'Error retrieving the route' });
  }
};

// Export the function to be used in the route handler
module.exports = {
  getAllRoutes,
  getRouteByID
};
