// Import the fs module to interact with the file system
const fs = require('fs');

// Load environment variables from the .env file
require('dotenv').config();

// Controller to get all trips
const getAllTrips = (req, res) => {
  // Log the start of the trip retrieval process
  console.log('Fetching all trips...');

  // Get the file path from the environment variable
  const filePath = process.env.TRIPS_FILE_PATH;

  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Parse each line into a trip object
    const trips = lines.slice(1).map(line => {
      // Split each line by commas and trim extra spaces
      const [route_id, service_id, trip_id] = line.split(',').map(item => item.trim()); // Remove extra spaces
      return {
        // Parse and return the trip data
        route_id: parseInt(route_id),
        service_id: service_id,
        trip_id: trip_id
      };
    });

    // Send the trips as a JSON response
    res.json({ trips });
    
  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an empty array in case of an error
    res.json({ trips: [] });
  }
};

// Export the function to be used in the route handler
module.exports = {
  getAllTrips
};
