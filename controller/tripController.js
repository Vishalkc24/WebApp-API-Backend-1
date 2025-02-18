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

// Controller to get a trip by ID
const getTripByID = (req, res) => {
  const { trip_id } = req.params; // Get trip_id from route parameters

  // Log the trip ID being fetched
  console.log(`Fetching trip with ID: ${trip_id}`);

  // Get the file path from the environment variable
  const filePath = process.env.TRIPS_FILE_PATH;

  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Parse each line into a trip object
    const trips = lines.slice(1).map(line => {
      const [route_id, service_id, trip_id_in_file] = line.split(',').map(item => item.trim()); // Remove extra spaces
      return {
        route_id: parseInt(route_id),
        service_id: service_id,
        trip_id: trip_id_in_file
      };
    });

    // Find the trip with the matching trip_id
    const trip = trips.find(t => t.trip_id === trip_id);

    if (trip) {
      // If the trip is found, send it as a JSON response
      res.json({ trip });
    } else {
      // If no trip is found, return a not found message
      res.status(404).json({ message: 'Trip not found' });
    }

  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an error message in case of failure
    res.status(500).json({ message: 'Error reading file' });
  }
};

module.exports = {
  getAllTrips,
  getTripByID // Export the new function
};