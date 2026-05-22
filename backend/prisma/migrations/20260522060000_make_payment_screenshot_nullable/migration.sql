-- Make paymentScreenshot nullable to support UTR-only registrations
ALTER TABLE "PaymentVerification" ALTER COLUMN "paymentScreenshot" DROP NOT NULL;
