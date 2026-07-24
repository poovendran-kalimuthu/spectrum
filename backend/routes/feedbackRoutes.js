import express from 'express';
import { 
  submitFeedback, 
  getAllFeedbacks, 
  deleteFeedback, 
  getUserRegisteredEvents 
} from '../controllers/feedbackController.js';
import { 
  createTemplate,
  getAllTemplates,
  getTemplateById,
  deleteTemplate
} from '../controllers/feedbackTemplateController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Feedback Submissions ──
router.route('/')
  .post(protect, submitFeedback)
  .get(protect, adminProtect, getAllFeedbacks);

router.get('/user-events', protect, getUserRegisteredEvents);

router.delete('/:id', protect, adminProtect, deleteFeedback);

// ── Feedback Templates (Admin) ──
router.route('/templates')
  .post(protect, adminProtect, createTemplate)
  .get(protect, adminProtect, getAllTemplates);

router.route('/templates/:id')
  .get(protect, adminProtect, getTemplateById)
  .delete(protect, adminProtect, deleteTemplate);

export default router;
