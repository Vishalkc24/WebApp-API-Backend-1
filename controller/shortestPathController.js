// shortestPathController.js

const axios = require('axios');

// Function to get the stops for a specific route based on route ID
const getStopsForRoute = async (routeId) => {
  try {
    // Fetch all trips for the given route
    const tripsResponse = await axios.get(`http://localhost:3000/api/trips`);
    const trips = tripsResponse.data.trips;

    // Filter trips based on the provided routeId
    const routeTrips = trips.filter(trip => trip.route_id === parseInt(routeId));
    if (routeTrips.length === 0) {
      throw new Error(`No trips found for route_id: ${routeId}`);
    }

    // Get the trip_id for the first matching trip
    const tripId = routeTrips[0].trip_id;
    console.log(`Found trip_id: ${tripId} for route_id: ${routeId}`);

    // Fetch stop times for the specific trip_id
    const stopTimesResponse = await axios.get(`http://localhost:3000/api/stop-times/${tripId}`);
    const stopTimes = stopTimesResponse.data.stopTimes;

    if (!stopTimes || stopTimes.length === 0) {
      throw new Error(`No stop times found for trip_id: ${tripId}`);
    }

    // Fetch stop details for each stop_time
    const stops = await Promise.all(
      stopTimes.map(async (stopTime) => {
        const stopResponse = await axios.get(`http://localhost:3000/api/stops/${stopTime.stop_id}`);
        return stopResponse.data.stop;
      })
    );

    return stops; // Return the stops for the route
  } catch (error) {
    console.error(`Error fetching stops for route_id: ${routeId} - ${error.message}`);
    throw new Error('Error fetching stops for route');
  }
};

// Controller method to handle the shortest path request for a given route_id
const getShortestPathByRoute = async (req, res) => {
  const routeId = req.params.route_id;

  try {
    // Get the stops for the given route_id
    const stops = await getStopsForRoute(routeId);

    // Assuming shortest path calculation (could be something like using a graph algorithm)
    // Here we're just returning the stops for simplicity.
    // You could integrate a real algorithm here (e.g., Dijkstra or A*).
    res.json({ message: `Shortest path for route_id: ${routeId}`, stops });
  } catch (error) {
    console.error('Error calculating the shortest path:', error);
    res.status(500).json({ message: 'Error calculating the shortest path', error: error.message });
  }
};

// Export the controller methods
module.exports = {
  getShortestPathByRoute,
};
