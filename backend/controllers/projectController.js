import ProjectSubmission from '../models/ProjectSubmission.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { getEventBySlugOrId } from './eventController.js';

// @desc    Get submission for the current team
// @route   GET /api/projects/my-submission/:eventId
// @access  Private (Team Leader)
export const getMySubmission = async (req, res) => {
  try {
    const event = await getEventBySlugOrId(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const registration = await Registration.findOne({
      event: event._id,
      teamLeader: req.user._id
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found or you are not the leader.' });
    }

    const submission = await ProjectSubmission.findOne({ registration: registration._id });
    res.json(submission || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update project submission
// @route   POST /api/projects/submit
// @access  Private (Team Leader)
export const submitProject = async (req, res) => {
  try {
    const { event: eventId, ...details } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    // Check if submission is open (Admin control)
    if (!event.isSubmissionOpen) {
      return res.status(403).json({ message: 'Project submission is currently closed by administration.' });
    }

    const registration = await Registration.findOne({
      event: eventId,
      teamLeader: req.user._id
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found or you are not the leader.' });
    }

    let submission = await ProjectSubmission.findOne({ registration: registration._id });

    if (submission) {
      // Update existing
      submission = await ProjectSubmission.findOneAndUpdate(
        { registration: registration._id },
        { ...details },
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      submission = await ProjectSubmission.create({
        registration: registration._id,
        event: eventId,
        ...details
      });
    }

    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all submissions for an event (Admin)
// @route   GET /api/projects/event/:eventId
// @access  Private (Admin)
export const getAllSubmissions = async (req, res) => {
  try {
    const event = await getEventBySlugOrId(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const submissions = await ProjectSubmission.find({ event: event._id })
      .populate({
        path: 'registration',
        populate: { path: 'teamLeader members.user', select: 'name registerNumber department' }
      });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle submission window (Admin)
// @route   PATCH /api/projects/toggle-submission/:eventId
// @access  Private (Admin)
export const toggleSubmissionControl = async (req, res) => {
  try {
    const { isOpen } = req.body;
    const event = await getEventBySlugOrId(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    event.isSubmissionOpen = isOpen;
    await event.save();

    res.json({ success: true, isSubmissionOpen: event.isSubmissionOpen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
