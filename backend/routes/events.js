import express from 'express';
import { getPublishedEvents, getEventDetails, registerForEvent, getEligibleUsers, addTeammate, removeTeammate, updateTeamName, getEventWinners } from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPublishedEvents);
router.get('/data/users', protect, getEligibleUsers);
router.get('/:id', protect, getEventDetails);
router.get('/:id/winners', protect, getEventWinners);
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/teammates', protect, addTeammate);
router.post('/:id/teammates/remove', protect, removeTeammate);
router.put('/:id/teamName', protect, updateTeamName);

export default router;
