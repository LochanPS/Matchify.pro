import { z } from 'zod';

export const updateProfileSchema = z.object({
  // Name can only be set once (if empty)
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
  // Date of birth can only be set once (if empty)
  dateOfBirth: z.string().optional(),
  // Phone - accept any string, we'll clean it in the controller
  phone: z.string().optional(),
  city: z.string().max(50, 'City must be less than 50 characters').optional(),
  state: z.string().max(50, 'State must be less than 50 characters').optional(),
  country: z.string().max(50, 'Country must be less than 50 characters').optional(),
  gender: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(50, 'New password must be less than 50 characters')
});

// Validation for profile photo upload
export const profilePhotoSchema = z.object({
  mimetype: z.string().refine(
    (type) => type.startsWith('image/'),
    'File must be an image'
  ),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB')
});