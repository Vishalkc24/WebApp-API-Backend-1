const fs = require('fs');
require('dotenv').config();

// Controller to get stop times for a specific trip_id
const getStopTimesByTripId = (req, res) => {
  console.log('Fetching stop times for trip_id:', req.params.trip_id);
  
  // Get the file path from the environment variable
  const filePath = process.env.STOP_TIMES_FILE_PATH;
  
  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Initialize an array to hold the stop times for the specific trip_id
    const stopTimes = [];

    // Loop through each line and parse it
    lines.slice(1).forEach(line => {
      const [trip_id, arrival_time, departure_time, stop_id, stop_sequence] = line.split(',').map(item => item.trim());

      // If the trip_id matches the requested trip_id, add the stop time record
      if (trip_id === req.params.trip_id) {
        stopTimes.push({
          arrival_time: arrival_time,
          departure_time: departure_time,
          stop_id: stop_id,
          stop_sequence: stop_sequence
        });
      }
    });

    // If no stop times were found for the trip_id, send an appropriate message
    if (stopTimes.length === 0) {
      return res.status(404).json({ error: `trip_id: ${req.params.trip_id} not found` });
    }

    // Send the stopTimes array as a JSON response
    res.json({ stopTimes });

  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an empty array if an error occurs
    res.json({ stopTimes: [] });
  }
};

module.exports = {
  getStopTimesByTripId
};
