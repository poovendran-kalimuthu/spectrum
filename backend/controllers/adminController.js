import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import Evaluator from '../models/Evaluator.js';
import Score from '../models/Score.js';
import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../utils/auditLogger.js';
import { getEventBySlugOrId } from './eventController.js';

// @desc    Get dashboard analytics (counts)
export const getAdminAnalytics = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const totalUsers = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        totalRegistrations,
        totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new event
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, teamSizeLimit, rounds, roundConfig, imageUrl, isPublished, isRegistrationOpen, isTeamChangeAllowed, numberOfWinners, eventType, parentEvent, category, macroCountLimit, resourcePerson, contactDetails, slug, noOfDays, dates } = req.body;
    
    const event = await Event.create({
      title,
      description,
      date,
      location: eventType === 'macro' ? '' : (location || ''),
      teamSizeLimit: teamSizeLimit || 4,
      rounds: rounds || 1,
      roundConfig: roundConfig || [],
      imageUrl: imageUrl || '',
      isPublished: isPublished || false,
      isRegistrationOpen: isRegistrationOpen !== undefined ? isRegistrationOpen : true,
      isTeamChangeAllowed: isTeamChangeAllowed !== undefined ? isTeamChangeAllowed : true,
      numberOfWinners: numberOfWinners || 3,
      eventType: eventType || 'micro',
      parentEvent: parentEvent || null,
      category: category || 'None',
      macroCountLimit: macroCountLimit || 0,
      resourcePerson: eventType === 'macro' ? '' : (resourcePerson || ''),
      contactDetails: eventType === 'macro' ? '' : (contactDetails || ''),
      slug,
      noOfDays: eventType === 'macro' ? (noOfDays || 1) : 1,
      dates: eventType === 'macro' ? (dates || []) : [],
      createdBy: req.user._id
    });
    
    await logAudit('CREATE_EVENT', `Created event: ${title}`, req.user._id, 'Event', event._id, req.body, req.ip, title);
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error in createEvent:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update an event 
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    if (req.body.parentEvent === '') {
      req.body.parentEvent = null;
    }
    
    Object.assign(event, req.body);
    
    if (event.eventType === 'macro') {
      event.location = '';
      event.resourcePerson = '';
      event.contactDetails = '';
    } else {
      event.noOfDays = 1;
      event.dates = [];
    }
    
    await event.save();
    
    await logAudit('UPDATE_EVENT', `Updated event: ${event.title}`, req.user._id, 'Event', event._id, req.body, req.ip, event.title);
    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Error in updateEvent:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all events (Admin view)
export const getAdminEvents = async (req, res) => {
  try {
    const events = await Event.find().sort('-createdAt').populate('createdBy', 'name');
    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    await logAudit('DELETE_EVENT', `Deleted event: ${event.title}`, req.user._id, 'Event', req.params.id, { eventId: req.params.id, eventTitle: event.title }, req.ip, event.title);
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all registrations for an event (Admin view)
export const getEventRegistrations = async (req, res) => {
  try {
    const event = await getEventBySlugOrId(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('teamLeader', 'name email registerNumber department year section mobile')
      .populate('members.user', 'name email registerNumber department year section mobile')
      .sort('createdAt');
    
    // Also fetch scores for this event to allow admin review
    const scores = await Score.find({ event: event._id })
      .populate('evaluator', 'name email')
      .sort('-submittedAt');

    res.status(200).json({ success: true, registrations, scores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Toggle shortlist status of one registration
export const toggleShortlist = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    
    const willShortlist = !reg.isShortlisted;
    if (willShortlist) {
      const event = await Event.findById(reg.event);
      if (event?.maxShortlisted > 0) {
        const currentShortlisted = await Registration.countDocuments({ event: reg.event, isShortlisted: true, isDisqualified: false });
        if (currentShortlisted >= event.maxShortlisted) {
          return res.status(400).json({ success: false, message: `Shortlist limit reached (Max ${event.maxShortlisted} teams).` });
        }
      }
    }

    reg.isShortlisted = willShortlist;
    await reg.save();
    
    await logAudit('TOGGLE_SHORTLIST', `${willShortlist ? 'Shortlisted' : 'Unshortlisted'} registration ${reg.teamName || reg._id}`, req.user._id, 'Registration', reg._id, { isShortlisted: willShortlist, registrationId: reg._id }, req.ip, reg.teamName || String(reg._id));
    res.status(200).json({ success: true, registration: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Bulk shortlist / unshortlist registrations
export const bulkShortlist = async (req, res) => {
  try {
    const { regIds, shortlist } = req.body;
    
    if (shortlist && regIds.length > 0) {
      const firstReg = await Registration.findById(regIds[0]);
      if (firstReg) {
        const event = await Event.findById(firstReg.event);
        if (event?.maxShortlisted > 0) {
          const currentShortlisted = await Registration.countDocuments({ event: firstReg.event, isShortlisted: true, isDisqualified: false, _id: { $nin: regIds } });
          if (currentShortlisted + regIds.length > event.maxShortlisted) {
            return res.status(400).json({ success: false, message: `Shortlisting these teams would exceed limit (Max ${event.maxShortlisted}, currently ${currentShortlisted} shortlisted).` });
          }
        }
      }
    }

    await Registration.updateMany({ _id: { $in: regIds } }, { isShortlisted: shortlist });
    
    await logAudit('BULK_SHORTLIST', `Bulk ${shortlist ? 'shortlisted' : 'unshortlisted'} ${regIds.length} registrations`, req.user._id, 'Registration', null, { regIds, isShortlisted: shortlist }, req.ip, `Bulk (${regIds.length} teams)`);
    res.status(200).json({ success: true, message: `${regIds.length} registration(s) updated.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// @desc    Update registration round
export const updateRegistrationRound = async (req, res) => {
  try {
    const { round } = req.body;
    const reg = await Registration.findById(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    
    // Validate Round Limit
    if (round > 0) {
      const event = await Event.findById(reg.event);
      const rCfg = event?.roundConfig?.find(r => r.roundNumber === round);
      if (rCfg?.maxAdvance > 0) {
        const currentInRound = await Registration.countDocuments({ event: reg.event, currentRound: round, _id: { $ne: reg._id } });
        if (currentInRound >= rCfg.maxAdvance) {
          return res.status(400).json({ success: false, message: `Round ${round} limit reached (Max ${rCfg.maxAdvance} participants).` });
        }
      }
    }

    reg.currentRound = round;
    await reg.save();
    
    await logAudit('UPDATE_ROUND', `Moved registration ${reg.teamName || reg._id} to Round ${round}`, req.user._id, 'Registration', reg._id, { round, registrationId: reg._id }, req.ip, reg.teamName || String(reg._id));
    res.status(200).json({ success: true, registration: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Bulk update registration round
export const bulkUpdateRound = async (req, res) => {
  try {
    const { regIds, round } = req.body;
    
    // Validate Round Limit
    if (round > 0 && regIds.length > 0) {
      const firstReg = await Registration.findById(regIds[0]);
      if (firstReg) {
        const event = await Event.findById(firstReg.event);
        const rCfg = event?.roundConfig?.find(r => r.roundNumber === round);
        if (rCfg?.maxAdvance > 0) {
           const currentInRound = await Registration.countDocuments({ event: firstReg.event, currentRound: round, _id: { $nin: regIds } });
           if (currentInRound + regIds.length > rCfg.maxAdvance) {
              return res.status(400).json({ success: false, message: `Moving ${regIds.length} teams would exceed Round ${round} limit (Max ${rCfg.maxAdvance}, currently ${currentInRound} slots occupied).` });
           }
        }
      }
    }

    await Registration.updateMany({ _id: { $in: regIds } }, { currentRound: round });
    
    await logAudit('BULK_UPDATE_ROUND', `Bulk moved ${regIds.length} registrations to Round ${round}`, req.user._id, 'Registration', null, { regIds, round }, req.ip, `Bulk (${regIds.length} teams)`);
    res.status(200).json({ success: true, message: `${regIds.length} registration(s) updated to Round ${round}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle disqualify status of one registration
export const toggleDisqualify = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    reg.isDisqualified = !reg.isDisqualified;
    await reg.save();
    
    await logAudit('TOGGLE_DISQUALIFY', `${reg.isDisqualified ? 'Disqualified' : 'Requalified'} registration ${reg.teamName || reg._id}`, req.user._id, 'Registration', reg._id, { isDisqualified: reg.isDisqualified, registrationId: reg._id }, req.ip, reg.teamName || String(reg._id));
    res.status(200).json({ success: true, registration: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Revert registration one round back
export const revertRound = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (reg.currentRound > 0) {
      reg.currentRound = reg.currentRound - 1;
    } else {
      // Revert shortlist status if already at round 0
      reg.isShortlisted = false;
    }
    await reg.save();
    
    await logAudit('REVERT_ROUND', `Reverted registration ${reg.teamName || reg._id} to Round ${reg.currentRound}`, req.user._id, 'Registration', reg._id, { round: reg.currentRound, isShortlisted: reg.isShortlisted, registrationId: reg._id }, req.ip, reg.teamName || String(reg._id));
    res.status(200).json({ success: true, registration: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle winner status of one registration
export const toggleWinner = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    
    const willBeWinner = !reg.isWinner;
    
    if (willBeWinner) {
      const event = await Event.findById(reg.event);
      if (event?.numberOfWinners > 0) {
        const currentWinners = await Registration.countDocuments({ event: reg.event, isWinner: true });
        if (currentWinners >= event.numberOfWinners) {
          return res.status(400).json({ success: false, message: `Winner limit reached (Max ${event.numberOfWinners}).` });
        }
      }
    }

    reg.isWinner = willBeWinner;
    await reg.save();
    
    await logAudit('TOGGLE_WINNER', `${willBeWinner ? 'Marked as Winner' : 'Removed Winner status for'} registration ${reg.teamName || reg._id}`, req.user._id, 'Registration', reg._id, { isWinner: willBeWinner, registrationId: reg._id }, req.ip, reg.teamName || String(reg._id));
    res.status(200).json({ success: true, registration: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Bulk select winners
export const bulkSelectWinners = async (req, res) => {
  try {
    const { regIds, isWinner, position } = req.body;
    
    if (isWinner && regIds.length > 0) {
      const firstReg = await Registration.findById(regIds[0]);
      if (firstReg) {
        const event = await Event.findById(firstReg.event);
        if (event?.numberOfWinners > 0) {
          const currentWinners = await Registration.countDocuments({ event: firstReg.event, isWinner: true, _id: { $nin: regIds } });
          if (currentWinners + regIds.length > event.numberOfWinners) {
            return res.status(400).json({ success: false, message: `Selecting these teams would exceed winner limit (Max ${event.numberOfWinners}, currently ${currentWinners} winners).` });
          }
        }
      }
    }

    const updateData = { isWinner };
    if (isWinner && position) {
      updateData.winnerPosition = position;
    } else if (!isWinner) {
      updateData.winnerPosition = '';
    }

    await Registration.updateMany({ _id: { $in: regIds } }, updateData);
    
    await logAudit('BULK_WINNERS', `Bulk ${isWinner ? 'marked as winners' : 'removed winner status for'} ${regIds.length} registrations`, req.user._id, 'Registration', null, { regIds, isWinner, position }, req.ip, `Bulk (${regIds.length} teams)`);
    res.status(200).json({ success: true, message: `${regIds.length} registration(s) updated.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/* =========================================
   EVALUATORS MANAGEMENT
   ========================================= */

// @desc    Get all evaluators
export const getEvaluators = async (req, res) => {
  try {
    const evaluators = await Evaluator.find()
      .populate('assignedRounds.event', 'title')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.status(200).json({ success: true, evaluators });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new evaluator
export const createEvaluator = async (req, res) => {
  try {
    const { name, email, phone, pin, assignedRounds } = req.body;
    
    const existing = await Evaluator.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Evaluator with this email already exists' });
    }

    const evaluator = await Evaluator.create({
      name,
      email,
      phone,
      pin, 
      assignedRounds: assignedRounds || [],
      createdBy: req.user._id
    });

    const populatedEvaluator = await Evaluator.findById(evaluator._id)
      .populate('assignedRounds.event', 'title')
      .populate('createdBy', 'name');

    await logAudit('CREATE_EVALUATOR', `Created evaluator: ${name}`, req.user._id, 'Evaluator', evaluator._id, { email, phone, assignedRounds }, req.ip, name);
    res.status(201).json({ success: true, evaluator: populatedEvaluator });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete an evaluator
export const deleteEvaluator = async (req, res) => {
  try {
    const evaluator = await Evaluator.findByIdAndDelete(req.params.id);
    if (!evaluator) {
      return res.status(404).json({ success: false, message: 'Evaluator not found' });
    }
    
    await logAudit('DELETE_EVALUATOR', `Deleted evaluator: ${evaluator.name}`, req.user._id, 'Evaluator', req.params.id, { evaluatorId: req.params.id, evaluatorName: evaluator.name }, req.ip, evaluator.name);
    res.status(200).json({ success: true, message: 'Evaluator deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* =========================================
   USER MANAGEMENT & AUDIT LOGS
   ========================================= */

// @desc    Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort('-createdAt')
      .select('-googleId')
      .populate('assignedMentor', 'name email department');
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all approved mentors (for student mentor-picker)
export const getMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', mentorStatus: 'approved' })
      .sort('name')
      .select('name email department year profilePicture');
    res.status(200).json({ success: true, mentors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get users with coordinator or admin role (for event coordinator picker)
export const getCoordinatorUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['superadmin', 'admin_t1', 'admin_t2'] } })
      .sort('name')
      .select('name email role profilePicture department');
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create a user manually
export const createUser = async (req, res) => {
  try {
    const { name, email, role, department, year, subRole, assignedMentor } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Determine effective role and mentor status
    const effectiveRole = subRole === 'mentor' ? 'mentor' : 'user';
    const mentorStatus = subRole === 'mentor' ? 'pending' : null;

    const user = await User.create({
      name,
      email,
      role: role && role !== 'user' ? role : effectiveRole,
      department,
      year,
      subRole: subRole || null,
      assignedMentor: (subRole === 'student' && assignedMentor) ? assignedMentor : null,
      mentorStatus,
      isProfileComplete: true
    });

    await logAudit('CREATE_USER', `Created new user: ${email} with role ${role || effectiveRole} (subRole: ${subRole || 'none'})`, req.user._id, 'User', user._id, { email, role, subRole, department, year }, req.ip, name || email);
    
    const populated = await User.findById(user._id).populate('assignedMentor', 'name email department');
    res.status(201).json({ success: true, user: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Approve or reject a mentor account (Super Admin only)
export const approveMentor = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use approved or rejected.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'mentor') return res.status(400).json({ success: false, message: 'User is not a mentor' });

    user.mentorStatus = status;
    await user.save();

    await logAudit(
      'MENTOR_APPROVAL',
      `${status === 'approved' ? 'Approved' : 'Rejected'} mentor: ${user.email}`,
      req.user._id, 'User', user._id,
      { mentorStatus: status },
      req.ip, user.name || user.email
    );

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort('-createdAt')
      .limit(200); // Limit to last 200 logs
      
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
// @desc    Delete a registration
export const deleteRegistration = async (req, res) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    
    // Also delete any scores associated with this registration if necessary
    await Score.deleteMany({ registration: req.params.regId });
    
    await logAudit('DELETE_REGISTRATION', `Deleted registration for event`, req.user._id, 'Registration', req.params.regId, { registrationId: req.params.regId }, req.ip, String(req.params.regId));
    res.status(200).json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    await logAudit('DELETE_USER', `Deleted user: ${user.name || user.email}`, req.user._id, 'User', req.params.id, { userId: req.params.id, email: user.email }, req.ip, user.name || user.email);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update a user (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, year, registerNumber, mobile, isProfileComplete, adminTeam, adminPosition, profilePicture, subRole, assignedMentor, mentorStatus } = req.body;
    
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Another user with this email already exists' });
      }
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousRole = user.role;
    
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (year !== undefined) user.year = year;
    if (registerNumber !== undefined) user.registerNumber = registerNumber;
    if (mobile !== undefined) user.mobile = mobile;
    if (isProfileComplete !== undefined) user.isProfileComplete = isProfileComplete;
    if (adminTeam !== undefined) user.adminTeam = adminTeam;
    if (adminPosition !== undefined) user.adminPosition = adminPosition;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (subRole !== undefined) user.subRole = subRole;
    if (assignedMentor !== undefined) user.assignedMentor = assignedMentor || null;
    if (mentorStatus !== undefined) user.mentorStatus = mentorStatus;

    await user.save();

    await logAudit(
      'UPDATE_USER',
      `Updated user: ${user.email} (Role changed from ${previousRole} to ${user.role})`,
      req.user._id,
      'User',
      user._id,
      { email: user.email, role: user.role, department: user.department, year: user.year },
      req.ip,
      user.name || user.email
    );

    const populated = await User.findById(user._id).populate('assignedMentor', 'name email department');
    res.status(200).json({ success: true, user: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Check and correct grammar using Gemini AI
export const aiCheckGrammar = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ success: false, message: 'Gemini API key is not configured' });
    }

    const systemPrompt = `You are a professional editor. Correct the grammar, spelling, typos, punctuation, and readability of the provided text.
Preserve the original markdown format, line breaks, bullet points, and structure. Do NOT add any introductory text, explanation, or meta-comments. Output ONLY the corrected text.

Text to correct:
${text}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1
          }
        })
      });

      const data = await response.json();
      const correctedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (correctedText && correctedText.trim() !== '') {
        return res.status(200).json({ success: true, text: correctedText.trim(), source: 'gemini' });
      } else {
        throw new Error(data.error?.message || 'Empty or invalid response from Gemini');
      }
    } catch (apiErr) {
      console.error("Gemini Grammar check failed:", apiErr.message);
      return res.status(502).json({ 
        success: false, 
        message: 'Gemini API is currently unreachable. Please try again later.' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Generate Google Meet Link via API
export const generateMeetLink = async (req, res) => {
  try {
    const { title, startDateTime, endDateTime } = req.body;
    
    // Check if Credentials exist
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      // Simulate meet link if credentials are not present (so the frontend works for now)
      const mockMeetCode = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
      
      return res.status(200).json({ 
        success: true, 
        meetLink: `https://meet.google.com/${mockMeetCode}`,
        message: 'Mock link generated. For real links, add GOOGLE_SERVICE_ACCOUNT_EMAIL to .env',
        eventId: 'mock_event_id'
      });
    }

    const { google } = await import('googleapis');
    
    // Format private key (replace literal \n with actual newlines)
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: title,
      start: {
        dateTime: startDateTime, // e.g., '2026-06-10T09:00:00-07:00'
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Kolkata',
      },
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1
    });

    const meetLink = response.data.hangoutLink;

    await logAudit('CREATE_MEET', `Generated Meet link for: ${title}`, req.user._id, 'Event', null, { meetLink }, req.ip, title);

    res.status(200).json({ success: true, meetLink, eventId: response.data.id });

  } catch (error) {
    console.error('Google Meet API Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Meet link via API', error: error.message });
  }
};
