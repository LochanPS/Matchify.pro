import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  getAllTournaments,
  getTournamentDetails,
  updateTournamentStatus,
  deleteTournament,
  getAllRegistrations,
  updateUserWallet
} from '../controllers/superAdmin.controller.js';

const router = express.Router();

// Middleware to check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Super admin only.' });
  }
  next();
};

// Apply super admin check to all routes
router.use(isSuperAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.post('/users/:userId/block', blockUser);
router.post('/users/:userId/unblock', unblockUser);
router.post('/users/:userId/wallet', updateUserWallet);

// Tournaments
router.get('/tournaments', getAllTournaments);
router.get('/tournaments/:tournamentId', getTournamentDetails);
router.patch('/tournaments/:tournamentId/status', updateTournamentStatus);
router.delete('/tournaments/:tournamentId', deleteTournament);

// Registrations
router.get('/registrations', getAllRegistrations);

export default router;
