import Evaluator from '../models/Evaluator.js';
import Score from '../models/Score.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

// @desc    Evaluator Login
// @route   POST /api/evaluator/login
export const loginEvaluator = async (req, res) => {
  try {
    const { email, pin } = req.body;
    
    const evaluator = await Evaluator.findOne({ email });
    if (!evaluator) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await evaluator.matchPin(pin);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Assuming we use the same session store but under a different key
    req.session.evaluatorId = evaluator._id;

    res.status(200).json({
      success: true,
      evaluator: {
        _id: evaluator._id,
        name: evaluator.name,
        email: evaluator.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Evaluator Logout
// @route   POST /api/evaluator/logout
export const logoutEvaluator = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: 'Could not log out' });
    res.clearCookie('connect.sid'); // default name
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

// @desc    Get Evaluator's Assigned Rounds
// @route   GET /api/evaluator/assignments
export const getMyAssignments = async (req, res) => {
  try {
    const evaluatorId = req.session.evaluatorId;
    const evaluator = await Evaluator.findById(evaluatorId).populate('assignedRounds.event', 'title roundConfig');
    
    if (!evaluator) return res.status(404).json({ success: false, message: 'Evaluator not found' });

    // Format the data to send frontend only exactly what's needed
    const assignments = evaluator.assignedRounds.map(ar => {
      const event = ar.event;
      // Extract the round config for this specific assigned round
      const config = event.roundConfig?.find(rc => rc.roundNumber === ar.roundNumber);
      return {
        eventId: event._id,
        eventTitle: event.title,
        roundNumber: ar.roundNumber,
        roundName: config?.name || `Round ${ar.roundNumber}`,
        criteria: config?.criteria || []
      };
    });

    res.status(200).json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Participants for a specific event and round
// @route   GET /api/evaluator/assignments/:eventId/:roundNum/participants
export const getRoundParticipants = async (req, res) => {
  try {
    const { eventId, roundNum } = req.params;
    const num = parseInt(roundNum);

    // Verify evaluator is assigned to this
    const evaluator = await Evaluator.findById(req.session.evaluatorId);
    const isAssigned = evaluator.assignedRounds.some(ar => ar.event.toString() === eventId && ar.roundNumber === num);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not authorized for this round' });

    // Fetch active teams in exactly this round, not disqualified
    const registrations = await Registration.find({
      event: eventId,
      currentRound: num, // They must be in this round to be evaluated
      isDisqualified: false,
      isShortlisted: true // Must be shortlisted to be in rounds
    })
    .populate('teamLeader', 'name registerNumber email')
    .populate('members.user', 'name registerNumber');

    // Fetch scores already given by this evaluator for these teams
    const scores = await Score.find({
      evaluator: evaluator._id,
      event: eventId,
      roundNumber: num
    });

    res.status(200).json({ success: true, registrations, scores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit or update score for a team
// @route   POST /api/evaluator/score
export const submitScore = async (req, res) => {
  try {
    const { eventId, roundNumber, registrationId, scores, remarks } = req.body;
    const evaluatorId = req.session.evaluatorId;

    // Validate evaluator assignment
    const evaluator = await Evaluator.findById(evaluatorId);
    const isAssigned = evaluator.assignedRounds.some(ar => ar.event.toString() === eventId && ar.roundNumber === parseInt(roundNumber));
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not authorized for this round' });

    // Calculate total
    const totalScore = scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0);

    // Upsert the score
    const scoreDoc = await Score.findOneAndUpdate(
      { evaluator: evaluatorId, registration: registrationId, event: eventId, roundNumber },
      { scores, totalScore, remarks, submittedAt: Date.now() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, score: scoreDoc });
  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'Score already exists and could not be updated.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
