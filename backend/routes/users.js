import express from 'express';
import { getUserProfile, updateUserSettings } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/settings', protect, updateUserSettings);
router.get('/:id', protect, getUserProfile);

export default router;
