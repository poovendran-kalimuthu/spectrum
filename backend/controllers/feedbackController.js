import Feedback from '../models/Feedback.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
export const submitFeedback = async (req, res) => {
  try {
    const { 
      eventId, 
      eventRating, 
      siteRating, 
      eventComments, 
      siteComments, 
      suggestions,
      overallSatisfaction,
      recommendation,
      preferredNextEvent
    } = req.body;

    const feedback = await Feedback.create({
      user: req.user._id,
      event: eventId || null,
      eventRating,
      siteRating,
      eventComments,
      siteComments,
      suggestions,
      overallSatisfaction,
      recommendation,
      preferredNextEvent
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all feedbacks (for Admin)
// @route   GET /api/feedback
// @access  Private/Admin
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'name email registerNumber department year section')
      .populate('event', 'title')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.status(200).json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get user's registered events for feedback
// @route   GET /api/feedback/user-events
// @access  Private
export const getUserRegisteredEvents = async (req, res) => {
  try {
    // Find all registrations where the user is the leader or a member with "Registered" status
    const registrations = await Registration.find({
      $or: [
        { teamLeader: req.user._id },
        { 'members.user': req.user._id, 'members.status': 'Registered' }
      ]
    }).populate('event', 'title');

    // Extract unique events
    const events = [...new Map(registrations.map(reg => [reg.event._id.toString(), reg.event])).values()];

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
