import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadDocument, getDocuments, approveDocument, rejectDocument, addComment } from '../controllers/documentController.js';

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/upload', protect, upload.single('pdf'), uploadDocument);
router.get('/', protect, getDocuments);
router.patch('/:id/approve', protect, approveDocument);
router.patch('/:id/reject', protect, rejectDocument);
router.post('/:id/comments', protect, addComment);

export default router;
