import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import crypto from 'crypto';
import { logAudit } from '../utils/auditLogger.js';
import { getEventBySlugOrId } from './eventController.js';

// @desc    Start an attendance session for a round
export const startAttendance = async (req, res) => {
  try {
    const { eventId, round } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Generate a fresh session token
    const sessionToken = crypto.randomBytes(16).toString('hex');
    
    event.activeAttendance = {
      round,
      sessionToken,
      createdAt: new Date()
    };
    await event.save();

    res.status(200).json({ success: true, activeAttendance: event.activeAttendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    End an attendance session
export const endAttendance = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.activeAttendance = { round: 0, sessionToken: '', createdAt: null };
    await event.save();

    res.status(200).json({ success: true, message: 'Attendance session ended' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Student Check-in via QR
export const checkIn = async (req, res) => {
  try {
    const { eventId, sessionToken } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event || !event.activeAttendance.sessionToken) {
      return res.status(400).json({ success: false, message: 'No active attendance session for this event' });
    }

    if (event.activeAttendance.sessionToken !== sessionToken) {
      return res.status(403).json({ success: false, message: 'Invalid or expired QR code' });
    }

    const roundNumber = event.activeAttendance.round;

    // Find user's registration for this event
    const registration = await Registration.findOne({ 
      event: eventId, 
      $or: [{ teamLeader: userId }, { 'members.user': userId }] 
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found for this user' });
    }

    // --- QUALIFICATION CHECK ---
    // Strict Round Check: User MUST be in the respective round
    if (registration.currentRound !== roundNumber) {
      return res.status(403).json({ 
        success: false, 
        message: `Attendance is only for participants in Round ${roundNumber}. Your current round is ${registration.currentRound}.` 
      });
    }

    if (registration.isDisqualified) {
      return res.status(403).json({ success: false, message: 'Your team is disqualified' });
    }

    // Check if THIS SPECIFIC USER is already marked for this round
    const alreadyMarked = registration.attendance.some(a => a.round === roundNumber && a.user.toString() === userId.toString());
    if (alreadyMarked) {
      return res.status(200).json({ success: true, message: 'Your attendance is already marked for this round' });
    }

    registration.attendance.push({
      user: userId,
      round: roundNumber,
      status: 'Present',
      markedBy: 'QR',
      timestamp: new Date()
    });

    await registration.save();
    console.log(`[Attendance] User ${userId} successfully checked into Round ${roundNumber}`);
    res.status(200).json({ success: true, message: `Attendance marked for Round ${roundNumber}` });
  } catch (error) {
    console.error('[Attendance Error]', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Manual attendance marking (Admin)
export const manualMark = async (req, res) => {
  try {
    let { registrationId, userId, round, status } = req.body;
    const registration = await Registration.findById(registrationId);
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    // If no specific userId, default to teamLeader
    if (!userId) userId = registration.teamLeader;

    // Remove existing entry for this user + round if any
    registration.attendance = registration.attendance.filter(a => !(a.round === round && a.user.toString() === userId.toString()));

    if (status === 'Present') {
      registration.attendance.push({
        user: userId,
        round,
        status: 'Present',
        markedBy: 'Manual',
        timestamp: new Date()
      });
    }

    await registration.save();
    
    await logAudit('MARK_ATTENDANCE', `Manually marked attendance for user ${userId} in Round ${round}`, req.user._id, 'Registration', registrationId, { userId, round, status, registrationId }, req.ip, registration.teamName || String(registration._id));
    
    const updated = await Registration.findById(registrationId)
      .populate('teamLeader', 'name registerNumber department')
      .populate('members.user', 'name registerNumber');

    res.status(200).json({ success: true, registration: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark attendance for a student (Admin Scan)
export const markByAdminScan = async (req, res) => {
  try {
    const { registrationId, eventId } = req.body;
    const registration = await Registration.findById(registrationId);
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Use provided round or active attendance round
    const roundNum = parseInt(req.body.round) || event.activeAttendance?.round;
    
    if (!roundNum) {
      return res.status(400).json({ success: false, message: 'No active attendance round. Please start a session or specify a round.' });
    }

    // --- QUALIFICATION CHECK ---
    // Strict Round Check: Participant MUST be in the respective round
    if (registration.currentRound !== roundNum) {
      return res.status(403).json({ 
        success: false, 
        message: `Attendance is only for participants in Round ${roundNum}. This participant is in Round ${registration.currentRound}.` 
      });
    }

    if (registration.isDisqualified) {
      return res.status(403).json({ success: false, message: 'Participant is disqualified' });
    }

    const userId = registration.teamLeader; // Mark leader as present for the team

    // Check if already marked
    const isPresent = registration.attendance.some(a => a.round === roundNum && a.user.toString() === userId.toString());
    if (isPresent) {
      return res.status(200).json({ success: true, message: `Already marked as present for Round ${roundNum}` });
    }

    registration.attendance.push({
      user: userId,
      round: roundNum,
      status: 'Present',
      markedBy: 'Manual', // Or 'Admin Scan' if we add to enum
      timestamp: new Date()
    });

    await registration.save();
    
    await logAudit('ADMIN_SCAN_ATTENDANCE', `Admin scanned and marked attendance for ${registration.teamName || registration._id} in Round ${roundNum}`, req.user._id, 'Registration', registrationId, { userId, round: roundNum, eventId, registrationId }, req.ip, registration.teamName || String(registration._id));
    
    res.status(200).json({ success: true, message: `Checked in ${registration.teamName || 'team'} for Round ${roundNum}` });
  } catch (error) {
    console.error('[Admin Scan Error]', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get attendance report
export const getAttendanceReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await getEventBySlugOrId(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    const registrations = await Registration.find({ event: event._id })
      .populate('teamLeader', 'name registerNumber department')
      .populate('members.user', 'name registerNumber');

    res.status(200).json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
