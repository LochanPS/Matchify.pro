import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cloudinary from '../config/cloudinary.js';
import { updateProfileSchema, changePasswordSchema, profilePhotoSchema } from '../validators/profile.validator.js';

const prisma = new PrismaClient();

// GET /profile - Fetch own profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        roles: true,
        profilePhoto: true,
        city: true,
        state: true,
        country: true,
        dateOfBirth: true,
        gender: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        walletBalance: true,
        isActive: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate additional stats
    const stats = {
      tournaments: user.tournamentsPlayed,
      matches: user.matchesWon + user.matchesLost,
      points: user.totalPoints,
      winRate: user.matchesWon + user.matchesLost > 0 
        ? Math.round((user.matchesWon / (user.matchesWon + user.matchesLost)) * 100) 
        : 0
    };

    // Parse roles for frontend
    const userRoles = user.roles ? user.roles.split(',') : ['PLAYER'];

    const profile = {
      ...user,
      role: userRoles[0], // Primary role for backward compatibility
      roles: userRoles,   // All roles array
      stats
    };

    res.json({
      message: 'Profile retrieved successfully',
      user: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// PUT /profile - Update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('Profile update request body:', req.body);

    // Validate input with Zod
    const validationResult = updateProfileSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const validatedData = validationResult.data;
    console.log('Validated data:', validatedData);

    // Get current user to check existing name and dateOfBirth
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, dateOfBirth: true }
    });

    // Check if trying to update name when it already exists
    if (validatedData.name && currentUser.name) {
      return res.status(400).json({ 
        error: 'Name cannot be changed once set. This is a permanent field.' 
      });
    }

    // Check if trying to update dateOfBirth when it already exists
    if (validatedData.dateOfBirth && currentUser.dateOfBirth) {
      return res.status(400).json({ 
        error: 'Date of Birth cannot be changed once set. This is a permanent field.' 
      });
    }

    // Check if phone already exists (if updating phone)
    if (validatedData.phone && validatedData.phone !== '') {
      // Clean phone number (remove +91 if present)
      const cleanPhone = validatedData.phone.replace(/^\+91/, '').replace(/\s/g, '');
      
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: cleanPhone,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Phone number is already in use by another user' });
      }
    }

    // Prepare update data - name and dateOfBirth can only be set if currently empty
    const updateData = {};
    if (validatedData.name && !currentUser.name) updateData.name = validatedData.name;
    if (validatedData.dateOfBirth && !currentUser.dateOfBirth) {
      updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
    }
    // Clean phone number before saving
    if (validatedData.phone !== undefined && validatedData.phone !== '') {
      updateData.phone = validatedData.phone.replace(/^\+91/, '').replace(/\s/g, '');
    }
    if (validatedData.city !== undefined) updateData.city = validatedData.city || null;
    if (validatedData.state !== undefined) updateData.state = validatedData.state || null;
    if (validatedData.country !== undefined) updateData.country = validatedData.country || null;
    if (validatedData.gender !== undefined && validatedData.gender !== '') updateData.gender = validatedData.gender;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        roles: true,
        profilePhoto: true,
        city: true,
        state: true,
        country: true,
        dateOfBirth: true,
        gender: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        walletBalance: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Parse roles for frontend
    const userRoles = updatedUser.roles ? updatedUser.roles.split(',') : ['PLAYER'];

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        role: userRoles[0],
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// POST /profile/photo - Upload profile photo
export const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file with Zod
    const fileValidation = profilePhotoSchema.safeParse({
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    if (!fileValidation.success) {
      return res.status(400).json({
        error: 'File validation failed',
        details: fileValidation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Get current user to delete old photo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true }
    });

    // Delete old photo from Cloudinary if exists
    if (user.profilePhoto) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.profilePhoto.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `matchify/profiles/${publicIdWithExtension.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.warn('Failed to delete old profile photo:', deleteError.message);
        // Continue with upload even if deletion fails
      }
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'matchify/profiles',
          public_id: `user_${userId}_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ],
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    // Update user with new photo URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: result.secure_url },
      select: {
        id: true,
        profilePhoto: true,
        name: true
      }
    });

    res.json({
      message: 'Profile photo updated successfully',
      profilePhoto: updatedUser.profilePhoto,
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ 
      error: 'Failed to upload profile photo',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// POST /profile/password - Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input with Zod
    const validationResult = changePasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// DELETE /profile/photo - Delete profile photo
export const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true }
    });

    if (!user.profilePhoto) {
      return res.status(400).json({ error: 'No profile photo to delete' });
    }

    // Delete photo from Cloudinary
    try {
      const urlParts = user.profilePhoto.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `matchify/profiles/${publicIdWithExtension.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (deleteError) {
      console.warn('Failed to delete photo from Cloudinary:', deleteError.message);
    }

    // Update user to remove photo URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
      select: {
        id: true,
        profilePhoto: true,
        name: true
      }
    });

    res.json({
      message: 'Profile photo deleted successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ 
      error: 'Failed to delete profile photo',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};