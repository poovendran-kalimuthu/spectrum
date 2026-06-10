import express from 'express';
import { 
  getMySubmission, 
  submitProject, 
  getAllSubmissions, 
  toggleSubmissionControl 
} from '../controllers/projectController.js';
import { protect, coordinatorProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Participant routes
router.get('/my-submission/:eventId', protect, getMySubmission);
router.post('/submit', protect, submitProject);

// Admin/Coordinator routes
router.get('/event/:eventId', coordinatorProtect, getAllSubmissions);
router.patch('/toggle-submission/:eventId', coordinatorProtect, toggleSubmissionControl);

export default router;
