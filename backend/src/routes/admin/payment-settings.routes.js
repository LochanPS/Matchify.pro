import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get current payment settings (PUBLIC - for players to see QR code)
router.get('/public', async (req, res) => {
  try {
    const settings = await prisma.paymentSettings.findFirst({
      where: { isActive: true },
      select: {
        upiId: true,
        accountHolder: true,
        qrCodeUrl: true,
        isActive: true
      }
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Payment settings not found'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching public payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment settings'
    });
  }
});

// Get current payment settings (ADMIN ONLY)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Payment settings not found'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment settings'
    });
  }
});

// Update payment settings
router.put('/', authenticate, requireAdmin, upload.single('qrCode'), async (req, res) => {
  try {
    const { upiId, accountHolder } = req.body;
    const file = req.file;

    // Get current settings
    const currentSettings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    if (!currentSettings) {
      return res.status(404).json({
        success: false,
        message: 'Payment settings not found'
      });
    }

    let qrCodeUrl = currentSettings.qrCodeUrl;
    let qrCodePublicId = currentSettings.qrCodePublicId;

    // Upload new QR code if provided
    if (file) {
      // Delete old QR code from Cloudinary if exists
      if (currentSettings.qrCodePublicId) {
        try {
          await cloudinary.uploader.destroy(currentSettings.qrCodePublicId);
        } catch (error) {
          console.error('Error deleting old QR code:', error);
        }
      }

      // Upload new QR code
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'matchify/payment-qr',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      qrCodeUrl = uploadResult.secure_url;
      qrCodePublicId = uploadResult.public_id;
    }

    // Update settings
    const updatedSettings = await prisma.paymentSettings.update({
      where: { id: currentSettings.id },
      data: {
        upiId: upiId || currentSettings.upiId,
        accountHolder: accountHolder || currentSettings.accountHolder,
        qrCodeUrl,
        qrCodePublicId
      }
    });

    res.json({
      success: true,
      message: 'Payment settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment settings'
    });
  }
});

export default router;
