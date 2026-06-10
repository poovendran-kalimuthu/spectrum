import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications, markAsRead, createNotification } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.post('/', protect, createNotification);

export default router;
