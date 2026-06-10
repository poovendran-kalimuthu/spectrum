import express from 'express';
import { loginEvaluator, logoutEvaluator, getMyAssignments, getRoundParticipants, submitScore } from '../controllers/evaluatorController.js';

const router = express.Router();

// Middleware to ensure evaluator is logged in
const protectEvaluator = (req, res, next) => {
  if (req.session && req.session.evaluatorId) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Not authorized as an evaluator' });
};

// Public
router.post('/login', loginEvaluator);
router.post('/logout', logoutEvaluator);

// Protected (Evaluator only)
router.use(protectEvaluator);
router.get('/assignments', getMyAssignments);
router.get('/assignments/:eventId/:roundNum/participants', getRoundParticipants);
router.post('/score', submitScore);

export default router;
