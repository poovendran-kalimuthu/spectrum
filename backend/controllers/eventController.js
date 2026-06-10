import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Helper to find event by ID or slug
export const getEventBySlugOrId = async (idOrSlug) => {
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    const event = await Event.findById(idOrSlug);
    if (event) return event;
  }
  return await Event.findOne({ slug: idOrSlug });
};

// @desc    Get all published events for users
export const getPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({ isPublished: true }).sort('date');
    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get event details + user registration status
export const getEventDetails = async (req, res) => {
  try {
    const event = await getEventBySlugOrId(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Find the single shared registration document where the current user is a member
    const registration = await Registration.findOne({ event: event._id, 'members.user': req.user._id })
      .populate('teamLeader', 'name email profilePicture')
      .populate('members.user', 'name email registerNumber profilePicture');

    let isLeader = false;
    if (registration) {
       isLeader = registration.teamLeader._id.toString() === req.user._id.toString();
    }

    res.status(200).json({ success: true, event, registration, isLeader });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get event winners
export const getEventWinners = async (req, res) => {
  try {
    const event = await getEventBySlugOrId(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const winners = await Registration.find({ event: event._id, isWinner: true })
      .populate('teamLeader', 'name email profilePicture department')
      .populate('members.user', 'name email profilePicture department')
      .sort('winnerPosition'); // Sort by position if applicable

    res.status(200).json({ success: true, event, winners });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Register user and their team to event
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params; // Event ID or Slug
    const { teamName, members: memberIds } = req.body; // memberIds is array of user IDs (optional)

    const event = await getEventBySlugOrId(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (!event.isRegistrationOpen) return res.status(400).json({ success: false, message: 'Registrations are currently closed for this event.' });

    // Check if user is already registered for THIS event
    let exists = await Registration.findOne({ event: event._id, 'members.user': req.user._id });
    if (exists) return res.status(400).json({ success: false, message: 'Already registered for this event. You are in a team.' });

    // Session Conflict Check
    if (event.session && event.session !== 'none') {
      const allParticipantIds = [req.user._id, ...(memberIds || [])];
      
      // Find events in the same session
      const concurrentEvents = await Event.find({ session: event.session, _id: { $ne: event._id } }).select('_id title');
      const concurrentEventIds = concurrentEvents.map(e => e._id);

      if (concurrentEventIds.length > 0) {
        // Check if any participant is registered for these events
        const conflict = await Registration.findOne({
          event: { $in: concurrentEventIds },
          'members.user': { $in: allParticipantIds }
        }).populate('event', 'title').populate('members.user', 'name');

        if (conflict) {
          const conflictUser = conflict.members.find(m => allParticipantIds.some(id => id.toString() === m.user._id.toString()))?.user;
          return res.status(400).json({ 
            success: false, 
            message: `${conflictUser?.name || 'A team member'} is already registered for "${conflict.event.title}" in the same session.` 
          });
        }
      }
    }

    // Validate Team Size
    const totalMembers = (memberIds ? memberIds.length : 0) + 1; // +1 for the leader
    if (totalMembers !== event.teamSizeLimit) {
      return res.status(400).json({ 
        success: false, 
        message: `This event requires a full team of ${event.teamSizeLimit} members. You provided ${totalMembers}.` 
      });
    }

    // Prepare members array
    const members = [{ user: req.user._id, status: 'Registered' }];
    if (memberIds && memberIds.length > 0) {
      // Check if any teammate is already registered
      const alreadyRegistered = await Registration.findOne({ 
        event: event._id, 
        'members.user': { $in: memberIds } 
      });
      if (alreadyRegistered) {
        return res.status(400).json({ success: false, message: 'One or more of your teammates are already registered for this event.' });
      }
      
      memberIds.forEach(mId => {
        members.push({ user: mId, status: 'Registered' });
      });
    }

    const registration = await Registration.create({
      event: event._id,
      teamName: teamName || '',
      teamLeader: req.user._id,
      members,
      status: 'Registered'
    });

    res.status(201).json({ success: true, registration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all users for teammate selection (Name & Roll No)
export const getEligibleUsers = async (req, res) => {
  try {
    const { eventId } = req.query;
    
    // Fetch all users except current
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name registerNumber email profilePicture')
      .lean();

    if (eventId) {
      const event = await getEventBySlugOrId(eventId);
      if (event) {
        // 1. Find all registrations for this exact event
        const sameEventRegistrations = await Registration.find({ event: event._id });
        const sameEventRegisteredUserIds = new Set();
        sameEventRegistrations.forEach(reg => {
          reg.members.forEach(member => {
            sameEventRegisteredUserIds.add(member.user.toString());
          });
        });

        // 2. Find all registrations for other events in the same session
        const sameSessionRegisteredUserIds = new Map(); // user_id -> event title
        if (event.session && event.session !== 'none') {
           const concurrentEvents = await Event.find({ session: event.session, _id: { $ne: event._id } });
           if (concurrentEvents.length > 0) {
              const concurrentEventIds = concurrentEvents.map(e => e._id);
              const concurrentRegistrations = await Registration.find({ event: { $in: concurrentEventIds } }).populate('event', 'title');
              concurrentRegistrations.forEach(reg => {
                 reg.members.forEach(member => {
                    sameSessionRegisteredUserIds.set(member.user.toString(), reg.event.title);
                 });
              });
           }
        }

        // Mark users who are already registered
        users.forEach(user => {
          const uid = user._id.toString();
          if (sameEventRegisteredUserIds.has(uid)) {
            user.isAlreadyRegistered = true;
            user.registrationStatus = 'Already Registered for this Event';
          } else if (sameSessionRegisteredUserIds.has(uid)) {
            user.isAlreadyRegistered = true;
            user.registrationStatus = `Registered for "${sameSessionRegisteredUserIds.get(uid)}" (Same Session)`;
          }
        });
      }
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Add a teammate to an event directly to the shared document
export const addTeammate = async (req, res) => {
  try {
    const { id } = req.params; // Event ID or Slug
    const { teammateId } = req.body;

    const event = await getEventBySlugOrId(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.isTeamChangeAllowed) return res.status(400).json({ success: false, message: 'Team modifications are locked for this event.' });

    const teammateUser = await User.findById(teammateId);
    if (!teammateUser) return res.status(404).json({ success: false, message: 'Selected user does not exist' });

    // Fetch the caller's registration
    let mainReg = await Registration.findOne({ event: event._id, 'members.user': req.user._id });
    if (!mainReg) return res.status(400).json({ success: false, message: 'You must register first.' });

    // Security: Only the team leader can add teammates
    if (mainReg.teamLeader.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, message: 'Only the Team Leader can add members.' });
    }

    // Check team size bounds
    if (mainReg.members.length >= event.teamSizeLimit) {
       return res.status(400).json({ success: false, message: 'Team size limit reached.' });
    }

    // Is the user already in ANOTHER team?
    let teammateExists = await Registration.findOne({ event: event._id, 'members.user': teammateId });
    if (teammateExists) {
        return res.status(400).json({ success: false, message: 'User is already registered for this event (on your team or another team).' });
    }

    // Session Conflict Check for the Teammate
    if (event.session && event.session !== 'none') {
      const concurrentEvents = await Event.find({ session: event.session, _id: { $ne: event._id } }).select('_id title');
      if (concurrentEvents.length > 0) {
        const concurrentEventIds = concurrentEvents.map(e => e._id);
        const conflict = await Registration.findOne({
          event: { $in: concurrentEventIds },
          'members.user': teammateId
        }).populate('event', 'title');
        
        if (conflict) {
           return res.status(400).json({ 
             success: false, 
             message: `This teammate is already registered for "${conflict.event.title}" in the same session.` 
           });
        }
      }
    }

    // Add them to the shared team!
    mainReg.members.push({ user: teammateId, status: 'Registered' });
    await mainReg.save();

    res.status(200).json({ success: true, registration: await mainReg.populate('members.user', 'name email registerNumber prototypePicture') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove a teammate from an event team (Leader only)
export const removeTeammate = async (req, res) => {
  try {
    const { id } = req.params; // Event ID or Slug
    const { teammateId } = req.body;

    const event = await getEventBySlugOrId(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.isTeamChangeAllowed) return res.status(400).json({ success: false, message: 'Team modifications are locked for this event.' });

    let mainReg = await Registration.findOne({ event: event._id, 'members.user': req.user._id });
    if (!mainReg) return res.status(400).json({ success: false, message: 'Registration not found.' });

    // Security: Only the team leader can remove teammates
    if (mainReg.teamLeader.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, message: 'Only the Team Leader can remove members.' });
    }

    // You cannot remove yourself using this route
    if (teammateId === req.user._id.toString()) {
       return res.status(400).json({ success: false, message: 'You cannot remove yourself from your own team.' });
    }

    // Remove from members array
    mainReg.members = mainReg.members.filter(m => m.user.toString() !== teammateId);
    await mainReg.save();

    res.status(200).json({ success: true, registration: await mainReg.populate('members.user', 'name email registerNumber prototypePicture') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update team name
export const updateTeamName = async (req, res) => {
  try {
    const { id } = req.params; // Event ID or Slug
    const { teamName } = req.body;

    const event = await getEventBySlugOrId(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.isTeamChangeAllowed) return res.status(400).json({ success: false, message: 'Team modifications are locked for this event.' });

    let mainReg = await Registration.findOne({ event: event._id, 'members.user': req.user._id });
    if (!mainReg) return res.status(400).json({ success: false, message: 'Registration not found.' });

    // Security: Only the team leader can update the team name
    if (mainReg.teamLeader.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, message: 'Only the Team Leader can update the team name.' });
    }

    if (!teamName || teamName.trim() === '') {
       return res.status(400).json({ success: false, message: 'Team name cannot be empty.' });
    }

    mainReg.teamName = teamName.trim();
    await mainReg.save();

    res.status(200).json({ success: true, message: 'Team name updated successfully.', teamName: mainReg.teamName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
