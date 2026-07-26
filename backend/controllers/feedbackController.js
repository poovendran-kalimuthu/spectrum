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
      preferredNextEvent,
      template,
      templateAnswers
    } = req.body;

    if (eventId) {
      const eventObj = await Event.findById(eventId);
      if (eventObj && eventObj.isFeedbackOpen === false) {
        return res.status(403).json({ success: false, message: 'Feedback submissions are closed for this event.' });
      }
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      event: eventId || null,
      eventRating,
      siteRating: siteRating || 5,
      eventComments,
      siteComments,
      suggestions,
      overallSatisfaction,
      recommendation,
      preferredNextEvent,
      template: template || null,
      templateAnswers: templateAnswers || {}
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
      .populate('template', 'title fields')
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
    }).populate({
      path: 'event',
      select: 'title feedbackTemplate isFeedbackOpen',
      populate: {
        path: 'feedbackTemplate'
      }
    });

    // Extract unique events (filtering out any null events)
    const validRegistrations = registrations.filter(reg => reg.event && reg.event._id);
    const registeredEvents = [...new Map(validRegistrations.map(reg => [reg.event._id.toString(), reg.event])).values()];

    // Also fetch all published events so users/admins can access feedback for any event
    const allEvents = await Event.find({ isPublished: true })
      .select('title feedbackTemplate isFeedbackOpen')
      .populate('feedbackTemplate');

    res.status(200).json({ 
      success: true, 
      data: registeredEvents,
      allEvents: allEvents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
