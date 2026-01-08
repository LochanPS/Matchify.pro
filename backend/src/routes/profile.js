import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  deleteProfilePhoto
} from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/photo', deleteProfilePhoto);
router.put('/password', changePassword);

export default router;