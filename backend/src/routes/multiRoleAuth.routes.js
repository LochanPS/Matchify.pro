import express from 'express';
import { register, login, addRole } from '../controllers/authController.js';
import { authenticate } from '../middleware/roleAuth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/add-role', authenticate, addRole);

export default router;