import express from 'express';
import { 
  submitFeedback, 
  getAllFeedbacks, 
  deleteFeedback, 
  getUserRegisteredEvents 
} from '../controllers/feedbackController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, submitFeedback)
  .get(protect, adminProtect, getAllFeedbacks);

router.get('/user-events', protect, getUserRegisteredEvents);

router.delete('/:id', protect, adminProtect, deleteFeedback);

export default router;
