-- Make email nullable so users can register with phone only
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
