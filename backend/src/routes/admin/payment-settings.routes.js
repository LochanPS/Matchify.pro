import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Path to store payment settings
const SETTINGS_FILE = path.join(__dirname, '../../../payment-settings.json');

// Helper function to read settings from file
const readSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading settings file:', error);
  }
  // Return default settings if file doesn't exist or error
  return {
    id: '1',
    upiId: 'matchify@upi',
    accountHolder: 'Matchify Pro',
    qrCodeUrl: '/uploads/payment-qr/default-qr.png',
    qrCodePublicId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper function to write settings to file
const writeSettings = (settings) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing settings file:', error);
    return false;
  }
};

// Get current payment settings (PUBLIC - for players to see QR code)
router.get('/public', async (req, res) => {
  try {
    const settings = readSettings();
    
    res.json({
      success: true,
      data: {
        upiId: settings.upiId,
        accountHolder: settings.accountHolder,
        qrCodeUrl: settings.qrCodeUrl,
        isActive: settings.isActive
      }
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
    const settings = readSettings();
    console.log('✅ Payment settings loaded from file');

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

    // Read current settings
    const currentSettings = readSettings();
    console.log('📖 Current settings:', currentSettings);

    let qrCodeUrl = currentSettings.qrCodeUrl;
    let qrCodePublicId = currentSettings.qrCodePublicId;

    // Upload new QR code if provided
    if (file) {
      console.log('📤 New QR code file uploaded, saving locally...');
      
      // For simplified schema, save to local uploads folder
      const uploadsDir = path.join(__dirname, '../../../uploads/payment-qr');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const filename = `qr-${Date.now()}.${file.mimetype.split('/')[1]}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Save file
      fs.writeFileSync(filepath, file.buffer);
      
      // Update URL to point to uploaded file
      qrCodeUrl = `/uploads/payment-qr/${filename}`;
      console.log('✅ QR code saved:', qrCodeUrl);
    }

    // Update settings
    const updatedSettings = {
      id: currentSettings.id,
      upiId: upiId || currentSettings.upiId,
      accountHolder: accountHolder || currentSettings.accountHolder,
      qrCodeUrl,
      qrCodePublicId,
      isActive: true,
      createdAt: currentSettings.createdAt,
      updatedAt: new Date().toISOString()
    };

    // Save to file
    const saved = writeSettings(updatedSettings);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save settings to file'
      });
    }

    console.log('✅ Payment settings updated successfully');
    console.log('   UPI ID:', updatedSettings.upiId);
    console.log('   Account Holder:', updatedSettings.accountHolder);

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
