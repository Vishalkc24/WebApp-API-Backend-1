// Import the fs module to interact with the file system
const fs = require('fs');

// Load environment variables from the .env file
require('dotenv').config();

// Controller to get all shapes
const getAllShapes = (req, res) => {
    // Log the start of the shape retrieval process
    console.log('Fetching all shapes...');
  
    // Get the file path for shapes from the environment variable
    const filePath = process.env.SHAPES_FILE_PATH;
  
    try {
      // Read the file data synchronously
      const data = fs.readFileSync(filePath, 'utf8');
  
      // Split the file content by newline and filter out empty lines (but not the header line)
      const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines
  
      // Parse each line into a shape object
      const shapes = lines.slice(1).map(line => {
        const [shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled] = line.split(',').map(item => item.trim());
        return {
          shape_id,
          shape_pt_lat: parseFloat(shape_pt_lat),
          shape_pt_lon: parseFloat(shape_pt_lon),
          shape_pt_sequence: parseInt(shape_pt_sequence),
          shape_dist_traveled: parseFloat(shape_dist_traveled)
        };
      });
  
      // Send the shapes as a JSON response
      res.json({ shapes });
      
    } catch (err) {
      // Log any error that occurs while reading the file
      console.error('Error reading file:', err);
  
      // Send an empty array in case of an error
      res.json({ shapes: [] });
    }
  };
  

// Controller to get shapes by shape_id
const getShapeById = (req, res) => {
  // Extract shape_id from the request parameters
  const { shape_id } = req.params;

  console.log(`Fetching shape data for shape_id: ${shape_id}`);

  // Get the file path for shapes from the environment variable
  const filePath = process.env.SHAPES_FILE_PATH;

  try {
    // Read the file data synchronously
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file content by newline and filter out empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');  // Remove empty lines

    // Filter the shapes data by the given shape_id
    const shape = lines.slice(1).map(line => {
      const [id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled] = line.split(',').map(item => item.trim());
      return {
        shape_id: id,
        shape_pt_lat: parseFloat(shape_pt_lat),
        shape_pt_lon: parseFloat(shape_pt_lon),
        shape_pt_sequence: parseInt(shape_pt_sequence),
        shape_dist_traveled: parseFloat(shape_dist_traveled)
      };
    }).filter(shape => shape.shape_id === shape_id);  // Filter by shape_id

    // If shape data is found, return it; otherwise, send an error message
    if (shape.length > 0) {
      res.json({ shape });
    } else {
      res.status(404).json({ message: `Shape with ID ${shape_id} not found.` });
    }
    
  } catch (err) {
    // Log any error that occurs while reading the file
    console.error('Error reading file:', err);

    // Send an error response
    res.status(500).json({ message: 'Error reading shapes data.' });
  }
};

module.exports = {
  getAllShapes,
  getShapeById
};
