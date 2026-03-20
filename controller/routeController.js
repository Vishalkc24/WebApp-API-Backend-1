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
      // New format: route_long_name,route_short_name,agency_id,route_type,route_id
      const [route_long_name, route_short_name, agency_id, route_type, route_id] = line.split(',').map(item => item.trim());

      return {
        // Keep existing fields for compatibility and expose new ones
        route_id: parseInt(route_id),
        route_type: parseInt(route_type),
        route_desc: route_long_name, // Backwards-compatible description
        route_long_name: route_long_name,
        route_short_name: route_short_name,
        agency_id: agency_id ? parseInt(agency_id) : null
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
      // New format: route_long_name,route_short_name,agency_id,route_type,route_id
      const [route_long_name, route_short_name, agency_id, route_type, route_id] = line.split(',').map(item => item.trim());
      return {
        route_id: parseInt(route_id),
        route_type: parseInt(route_type),
        route_desc: route_long_name,
        route_long_name: route_long_name,
        route_short_name: route_short_name,
        agency_id: agency_id ? parseInt(agency_id) : null
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
      'SELECT response FROM api_responses_bmtc_updated_new WHERE route_id = $1',
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
      'SELECT response FROM api_responses_bmtc_updated_new WHERE route_id = $1',
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

// Utility to read and parse the routes file into a map
const parseRoutesFile = (filePath) => {
  const routes = {};
  const data = fs.readFileSync(filePath, 'utf-8');
  const lines = data.split('\n');

  lines.forEach((line, index) => {
    // Skip header line or empty lines
    if (index === 0 || line.trim() === '') return;

    // New format: route_long_name,route_short_name,agency_id,route_type,route_id
    const [route_long_name, route_short_name, agency_id, route_type, route_id] = line.split(',').map(item => item.trim());
    if (route_id && route_long_name) {
      // Use long name as description for compatibility
      routes[parseInt(route_id)] = route_long_name;
    }
  });

  return routes;
};

const getRouteIDsByStopID = async (req, res) => {
  const stopID = parseInt(req.params.stop_id);

  if (isNaN(stopID)) {
    return res.status(400).json({ message: 'Invalid stop_id' });
  }

  const client = new Client({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();

    const query = `
      SELECT route_id 
      FROM api_responses_bmtc_updated_new 
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(response::jsonb->'stops_with_details') AS stop
        WHERE (stop->>'stop_id')::int = $1
      )
    `;

    const result = await client.query(query, [stopID]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No routes found for the given stop_id' });
    }

    // Parse the routes file and get the mapping of route_id to route_desc
    const routesFilePath = process.env.ROUTES_FILE_PATH;
    const routesMap = parseRoutesFile(routesFilePath);

    // Enhance the response with route_desc for each route_id
    const enhancedRoutes = result.rows.map(row => {
      const route_id = row.route_id;
      const route_desc = routesMap[route_id] || 'Unknown Route';
      return { route_id, route_desc };
    });

    res.json({
      stop_id: stopID,
      routes: enhancedRoutes
    });

  } catch (err) {
    console.error('Error retrieving routes by stop_id:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  } finally {
    try {
      await client.end();
    } catch (closeErr) {
      console.error('Error closing DB connection:', closeErr);
    }
  }
};



// Export the function to be used in the route handler
module.exports = {
  getAllRoutes,
  getRouteByID,
  getBmtcPolylineByRouteID,
  getBmtcTripStopTimesByRouteID,
  getRouteIDsByStopID
};