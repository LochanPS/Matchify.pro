-- Add guestPartnerName to support doubles registration with partner name only (no Matchify ID required)
ALTER TABLE "Registration" ADD COLUMN "guestPartnerName" TEXT;
