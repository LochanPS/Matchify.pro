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
  console.log('📊 Get payment settings request');
  try {
    const settings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    if (!settings) {
      console.log('❌ No payment settings found');
      return res.status(404).json({
        success: false,
        message: 'Payment settings not found. Please initialize payment settings.'
      });
    }

    console.log('✅ Payment settings found:', settings.id);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('❌ Error fetching payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment settings: ' + error.message
    });
  }
});

// Update payment settings
router.put('/', authenticate, requireAdmin, upload.single('qrCode'), async (req, res) => {
  console.log('💾 Update payment settings request received');
  console.log('   Body:', req.body);
  console.log('   File:', req.file ? 'Yes' : 'No');
  
  try {
    const { upiId, accountHolder } = req.body;
    const file = req.file;

    // Get current settings
    const currentSettings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    if (!currentSettings) {
      console.log('❌ No payment settings found in database');
      return res.status(404).json({
        success: false,
        message: 'Payment settings not found. Please initialize payment settings first.'
      });
    }

    console.log('✅ Current settings found:', currentSettings.id);

    let qrCodeUrl = currentSettings.qrCodeUrl;
    let qrCodePublicId = currentSettings.qrCodePublicId;

    // Upload new QR code if provided
    if (file) {
      console.log('📤 Uploading new QR code to Cloudinary...');
      
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.log('❌ Cloudinary not configured!');
        return res.status(500).json({
          success: false,
          message: 'Cloudinary is not configured. Please contact administrator.'
        });
      }

      try {
        // Delete old QR code from Cloudinary if exists
        if (currentSettings.qrCodePublicId) {
          try {
            console.log('🗑️  Deleting old QR code:', currentSettings.qrCodePublicId);
            await cloudinary.uploader.destroy(currentSettings.qrCodePublicId);
          } catch (error) {
            console.error('⚠️  Error deleting old QR code:', error.message);
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
              if (error) {
                console.error('❌ Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('✅ Cloudinary upload success:', result.secure_url);
                resolve(result);
              }
            }
          );
          uploadStream.end(file.buffer);
        });

        qrCodeUrl = uploadResult.secure_url;
        qrCodePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error('❌ Failed to upload to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload QR code. Please try again.'
        });
      }
    }

    // Update settings
    console.log('💾 Updating database...');
    const updatedSettings = await prisma.paymentSettings.update({
      where: { id: currentSettings.id },
      data: {
        upiId: upiId || currentSettings.upiId,
        accountHolder: accountHolder || currentSettings.accountHolder,
        qrCodeUrl,
        qrCodePublicId
      }
    });

    console.log('✅ Payment settings updated successfully');

    res.json({
      success: true,
      message: 'Payment settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('❌ Error updating payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment settings: ' + error.message
    });
  }
});

export default router;
