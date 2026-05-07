-- ========================================
-- ADD MATCHIFY CODE COLUMN TO USER TABLE
-- ========================================
-- This migration adds the matchifyCode column that is missing from production database
-- Run this SQL directly on your Supabase database if you prefer manual migration

-- Add matchifyCode column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "matchifyCode" TEXT;

-- Create unique index on matchifyCode
CREATE UNIQUE INDEX IF NOT EXISTS "User_matchifyCode_key" ON "User"("matchifyCode");

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'matchifyCode';

-- Show sample of User table structure
SELECT 
    id, 
    email, 
    name, 
    matchifyCode, 
    playerCode, 
    umpireCode,
    roles
FROM "User" 
LIMIT 5;
