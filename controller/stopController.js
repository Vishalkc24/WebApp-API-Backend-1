// Import the fs module to interact with the file system
const fs = require('fs');

// Load environment variables from the .env file
require('dotenv').config();

// Controller to get all stops
const getAllStops = (req, res) => {
  // Log the start of the stop retrieval process
  console.log('Fetching all stops...');

  // Get the file path from the environment variable
  const filePath = process.env.STOPS_FILE_PATH;

  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Parse each line into a stop object
    const stops = lines.slice(1).map(line => {
      // Split each line by commas and trim extra spaces
      const [stop_id, stop_name, stop_lat, stop_lon, location_type] = line.split(',').map(item => item.trim()); // Remove extra spaces

      return {
        stop_id: parseInt(stop_id),            // Convert stop_id to an integer
        stop_name: stop_name,                  // Stop name is a string
        stop_lat: parseFloat(stop_lat),        // Convert stop_lat to float
        stop_lon: parseFloat(stop_lon),        // Convert stop_lon to float
        location_type: location_type || null   // Set location_type to null if it's missing
      };
    });

    // Send the stops as a JSON response
    res.json({ stops });
    
  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an empty array in case of an error
    res.json({ stops: [] });
  }
};

// Controller to get a stop by ID
const getStopByID = (req, res) => {
  const { stop_id } = req.params; // Get stop_id from route parameters

  // Log the stop ID being fetched
  console.log(`Fetching stop with ID: ${stop_id}`);

  // Get the file path from the environment variable
  const filePath = process.env.STOPS_FILE_PATH;

  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Parse each line into a stop object
    const stops = lines.slice(1).map(line => {
      const [stop_id_in_file, stop_name, stop_lat, stop_lon, location_type] = line.split(',').map(item => item.trim()); // Remove extra spaces
      return {
        stop_id: parseInt(stop_id_in_file),  // Convert stop_id to an integer
        stop_name: stop_name,                // Stop name is a string
        stop_lat: parseFloat(stop_lat),      // Convert stop_lat to float
        stop_lon: parseFloat(stop_lon),      // Convert stop_lon to float
        location_type: location_type || null // Set location_type to null if it's missing
      };
    });

    // Find the stop with the matching stop_id
    const stop = stops.find(s => s.stop_id === parseInt(stop_id));

    if (stop) {
      // If the stop is found, send it as a JSON response
      res.json({ stop });
    } else {
      // If no stop is found, return a not found message
      res.status(404).json({ message: 'Stop not found' });
    }

  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an error message in case of failure
    res.status(500).json({ message: 'Error reading file' });
  }
};

module.exports = {
  getAllStops,
  getStopByID // Export the new function
};
