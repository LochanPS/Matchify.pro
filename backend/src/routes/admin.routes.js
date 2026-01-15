import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  createInvite,
  listInvites,
  verifyInvite,
  acceptInvite,
  revokeInvite,
  deleteInvite
} from '../controllers/adminInvite.controller.js';
import { getInvitePublicDetails } from '../utils/inviteValidator.js';
import AdminController from '../controllers/admin.controller.js';

const router = express.Router();

// Admin invite routes (protected)
router.post('/invites', authenticate, createInvite);
router.get('/invites', authenticate, listInvites);
router.delete('/invites/:id/revoke', authenticate, revokeInvite);
router.delete('/invites/:id', authenticate, deleteInvite);

// Public invite routes (no auth required)
router.get('/invites/:token/verify', verifyInvite);
router.post('/invites/:token/accept', acceptInvite);

// Get invite details (public endpoint for invite page)
router.get('/invite/details/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await getInvitePublicDetails(token);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Get invite details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get invite details'
    });
  }
});

// User Management (Admin only)
router.get('/users', authenticate, requireAdmin, AdminController.getUsers);
router.get('/users/:id', authenticate, requireAdmin, AdminController.getUserDetails);
router.post('/users/:id/suspend', authenticate, requireAdmin, AdminController.suspendUser);
router.post('/users/:id/unsuspend', authenticate, requireAdmin, AdminController.unsuspendUser);
router.delete('/users/clear-all', authenticate, requireAdmin, AdminController.clearAllUsers);

// Tournament Management (Admin only)
router.get('/tournaments', authenticate, requireAdmin, AdminController.getTournaments);
router.delete('/tournaments/:id', authenticate, requireAdmin, AdminController.cancelTournament);

// Platform Stats (Admin only)
router.get('/stats', authenticate, requireAdmin, AdminController.getStats);

// Audit Logs (Admin only)
router.get('/audit-logs/export', authenticate, requireAdmin, AdminController.exportAuditLogs);
router.get('/audit-logs', authenticate, requireAdmin, AdminController.getAuditLogs);
router.get('/audit-logs/:entityType/:entityId', authenticate, requireAdmin, AdminController.getEntityAuditLogs);

export default router;
