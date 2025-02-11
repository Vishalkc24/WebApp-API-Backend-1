// Import the fs module to interact with the file system
const fs = require('fs');

// Load environment variables from the .env file
require('dotenv').config();

// Controller to get all stops
const getAllStops = (req, res) => {
  // Log the start of the stop retrieval process
  console.log('Fetching all stops...');

  // Get the file path from the environment variable
  const filePath = process.env.ROUTES_FILE_PATH.replace('routes_wd.txt', 'stops_wd.txt');

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

// Export the function to be used in the route handler
module.exports = {
  getAllStops
};
