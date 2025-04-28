// Import the fs module to interact with the file system
const fs = require('fs');

// Load environment variables from the .env file
require('dotenv').config();

const getAllRoutes = (req, res) => {
  console.log('Fetching all routes...');
  const filePath = process.env.ROUTES_FILE_PATH;

  try {
    // Read file data
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');

    // Parse each line into a route object
    const routes = lines.slice(1).map(line => {
      const [route_id, route_desc, route_type] = line.split(',').map(item => item.trim());
      return {
        route_id: route_id,  // Now store as string instead of parsing as integer
        route_desc: route_desc,
        route_type: parseInt(route_type)
      };
    });

    // Sort routes based on query parameter
    const { sort = 'asc' } = req.query;
    if (sort === 'asc') {
      routes.sort((a, b) => a.route_id.localeCompare(b.route_id));  // Sorting strings
    }

    res.json({ routes });
    
  } catch (err) {
    console.error('Error reading file:', err);
    res.json({ routes: [] });
  }
};

const getRouteByID = (req, res) => {
  const filePath = process.env.ROUTES_FILE_PATH;

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    const routes = lines.slice(1).map(line => {
      const [route_id, route_desc, route_type] = line.split(',').map(item => item.trim());
      return {
        route_id: route_id,  // Store as string
        route_desc: route_desc,
        route_type: parseInt(route_type)
      };
    });

    const routeID = req.params.route_id;  // Now route_id is a string
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


// Import the required PostgreSQL client
const { Client } = require('pg');

// Controller to get the polyline response for a specific route_id from the DB
const getBmtcPolylineByRouteID = async (req, res) => {
  const routeID = parseInt(req.params.route_id);

  // Check if the route_id is valid
  if (isNaN(routeID)) {
    return res.status(400).json({ message: 'Invalid route_id' });
  }

  // Create a new PostgreSQL client to connect to the database
  const client = new Client({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  // Connect to the database
  try {
    await client.connect();

    // Query the database to find the record with the specified route_id
    const result = await client.query(
      'SELECT response FROM api_responses WHERE route_id = $1',
      [routeID]
    );

    // If no matching record is found, return a 404 error
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Send the response data as JSON
    res.json({
      route_id: routeID,
      response: result.rows[0].response,
    });
  } catch (err) {
    console.error('Error retrieving polyline data:', err); // Log the full error for debugging
    // Check if the error is related to database connection
    if (err.message.includes('connection')) {
      return res.status(500).json({ message: 'Database connection error' });
    }
    // If it's another type of error, handle it here
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  } finally {
    // Always close the database connection after the query
    try {
      await client.end();
    } catch (closeErr) {
      console.error('Error closing the database connection:', closeErr); // Log error if closing the client fails
    }
  }
};

// Controller to get the polyline response for a specific route_id from the DB
const getBmtcTripStopTimesByRouteID = async (req, res) => {
  const routeID = parseInt(req.params.route_id);

  // Check if the route_id is valid
  if (isNaN(routeID)) {
    return res.status(400).json({ message: 'Invalid route_id' });
  }

  // Create a new PostgreSQL client to connect to the database
  const client = new Client({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  // Connect to the database
  try {
    await client.connect();

    // Query the database to find the record with the specified route_id
    const result = await client.query(
      'SELECT response FROM bmtc_api_responses WHERE route_id = $1',
      [routeID]
    );

    // If no matching record is found, return a 404 error
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Send the response data as JSON
    res.json(result.rows[0].response);

  } catch (err) {
    console.error('Error retrieving polyline data:', err); // Log the full error for debugging
    // Check if the error is related to database connection
    if (err.message.includes('connection')) {
      return res.status(500).json({ message: 'Database connection error' });
    }
    // If it's another type of error, handle it here
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  } finally {
    // Always close the database connection after the query
    try {
      await client.end();
    } catch (closeErr) {
      console.error('Error closing the database connection:', closeErr); // Log error if closing the client fails
    }
  }
};

// Export the function to be used in the route handler
module.exports = {
  getAllRoutes,
  getRouteByID,
  getBmtcPolylineByRouteID,
  getBmtcTripStopTimesByRouteID
};