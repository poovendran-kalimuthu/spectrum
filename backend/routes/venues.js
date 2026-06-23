import express from 'express';
import { getVenues, createVenue, deleteVenue } from '../controllers/venueController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getVenues)
  .post(protect, adminProtect, createVenue);

router.route('/:id')
  .delete(protect, adminProtect, deleteVenue);

export default router;
