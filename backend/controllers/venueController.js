import Venue from '../models/Venue.js';

// @desc    Get all venues
// @route   GET /api/venues
export const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, venues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new venue
// @route   POST /api/venues
export const createVenue = async (req, res) => {
  try {
    const { name, latitude, longitude, radius } = req.body;
    
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const venue = await Venue.create({
      name,
      latitude,
      longitude,
      radius: radius || 50,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, venue, message: 'Venue created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a venue
// @route   DELETE /api/venues/:id
export const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    await venue.deleteOne();
    res.status(200).json({ success: true, message: 'Venue removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
