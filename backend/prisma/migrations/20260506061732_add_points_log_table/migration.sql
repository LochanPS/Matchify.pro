-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alternateEmail" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "roles" TEXT NOT NULL DEFAULT 'PLAYER,UMPIRE,ORGANIZER',
    "playerCode" TEXT,
    "umpireCode" TEXT,
    "profilePhoto" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "tournamentsPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedUntil" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isVerifiedOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "isVerifiedPlayer" BOOLEAN NOT NULL DEFAULT false,
    "isVerifiedUmpire" BOOLEAN NOT NULL DEFAULT false,
    "tournamentsRegistered" INTEGER NOT NULL DEFAULT 0,
    "matchesUmpired" INTEGER NOT NULL DEFAULT 0,
    "availableForKYC" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchifyPoints" INTEGER NOT NULL DEFAULT 0,
    "tournamentsPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organization" TEXT,
    "tournamentsOrganized" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "savedUpiId" TEXT,
    "savedAccountHolder" TEXT,
    "savedPaymentQRUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UmpireProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchesUmpired" INTEGER NOT NULL DEFAULT 0,
    "certification" TEXT,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UmpireProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "paymentGateway" TEXT,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "registrationOpenDate" TEXT NOT NULL,
    "registrationCloseDate" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalCourts" INTEGER,
    "matchStartTime" TEXT,
    "matchEndTime" TEXT,
    "matchDuration" INTEGER,
    "shuttleType" TEXT,
    "shuttleBrand" TEXT,
    "totalRegistrations" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentQRUrl" TEXT,
    "paymentQRPublicId" TEXT,
    "upiId" TEXT,
    "accountHolderName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentUmpire" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "umpireId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentUmpire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentPoster" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentPoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "ageGroup" TEXT,
    "gender" TEXT NOT NULL,
    "entryFee" DOUBLE PRECISION NOT NULL,
    "maxParticipants" INTEGER,
    "tournamentFormat" TEXT NOT NULL DEFAULT 'KNOCKOUT',
    "scoringFormat" TEXT NOT NULL DEFAULT '21x3',
    "registrationCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "winnerId" TEXT,
    "runnerUpId" TEXT,
    "prizeWinner" DOUBLE PRECISION,
    "prizeRunnerUp" DOUBLE PRECISION,
    "prizeSemiFinalist" DOUBLE PRECISION,
    "prizeDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tournamentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "partnerId" TEXT,
    "partnerEmail" TEXT,
    "partnerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "amountTotal" DOUBLE PRECISION NOT NULL,
    "amountWallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountRazorpay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "paymentScreenshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "refundUpiId" TEXT,
    "refundQrCode" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "refundStatus" TEXT,
    "refundRequestedAt" TIMESTAMP(3),
    "refundProcessedAt" TIMESTAMP(3),
    "refundRejectionReason" TEXT,
    "refundPaymentScreenshot" TEXT,
    "refundPaymentScreenshotPublicId" TEXT,
    "isQuickAdded" BOOLEAN NOT NULL DEFAULT false,
    "quickAddedBy" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "guestGender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerToken" TEXT,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "bracketJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "roundNumber" INTEGER,
    "matchNumber" INTEGER NOT NULL,
    "matchIndex" INTEGER,
    "stage" TEXT,
    "groupIndex" INTEGER,
    "groupName" TEXT,
    "slot1Index" INTEGER,
    "slot2Index" INTEGER,
    "slotNumber" INTEGER,
    "courtNumber" INTEGER,
    "player1Id" TEXT,
    "player2Id" TEXT,
    "team1Player1Id" TEXT,
    "team1Player2Id" TEXT,
    "team2Player1Id" TEXT,
    "team2Player2Id" TEXT,
    "player1Seed" INTEGER,
    "player2Seed" INTEGER,
    "parentMatchId" TEXT,
    "childPosition" INTEGER,
    "winnerPosition" TEXT,
    "umpireId" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "winnerId" TEXT,
    "scoreJson" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreCorrectionRequest" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "umpireId" TEXT NOT NULL,
    "correctionType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "proposedScore" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "twilioSid" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT,
    "sports" TEXT NOT NULL,
    "sportDetails" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "photos" TEXT,
    "academyQrCode" TEXT,
    "paymentScreenshot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "blockedAt" TIMESTAMP(3),
    "blockedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deletionReason" TEXT,
    "rejectionReason" TEXT,
    "submittedBy" TEXT,
    "submittedByName" TEXT,
    "submittedByEmail" TEXT,
    "submittedByPhone" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_kyc" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "aadhaarImageUrl" TEXT NOT NULL,
    "aadhaarNumber" TEXT,
    "videoCallStartedAt" TIMESTAMP(3),
    "videoCallEndedAt" TIMESTAMP(3),
    "videoRoomUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "experience" TEXT,
    "preferredContact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "interviewScheduled" TIMESTAMP(3),
    "interviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "qrCodePublicId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_payments" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "totalCollected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRegistrations" INTEGER NOT NULL DEFAULT 0,
    "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "organizerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payout50Percent1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payout50Percent2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payout50Status1" TEXT NOT NULL DEFAULT 'pending',
    "payout50PaidAt1" TIMESTAMP(3),
    "payout50PaidBy1" TEXT,
    "payout50Notes1" TEXT,
    "payout50Status2" TEXT NOT NULL DEFAULT 'pending',
    "payout50PaidAt2" TIMESTAMP(3),
    "payout50PaidBy2" TEXT,
    "payout50Notes2" TEXT,
    "organizerUpiId" TEXT,
    "organizerAccountHolder" TEXT,
    "organizerBankDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_verifications" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentScreenshot" TEXT NOT NULL,
    "screenshotPublicId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "description" TEXT,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_playerCode_key" ON "User"("playerCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_umpireCode_key" ON "User"("umpireCode");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_roles_idx" ON "User"("roles");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_userId_key" ON "PlayerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerProfile_userId_key" ON "OrganizerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UmpireProfile_userId_key" ON "UmpireProfile"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_idx" ON "WalletTransaction"("status");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "Tournament_city_state_status_idx" ON "Tournament"("city", "state", "status");

-- CreateIndex
CREATE INDEX "Tournament_startDate_registrationCloseDate_idx" ON "Tournament"("startDate", "registrationCloseDate");

-- CreateIndex
CREATE INDEX "Tournament_organizerId_idx" ON "Tournament"("organizerId");

-- CreateIndex
CREATE INDEX "TournamentUmpire_tournamentId_idx" ON "TournamentUmpire"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentUmpire_umpireId_idx" ON "TournamentUmpire"("umpireId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentUmpire_tournamentId_umpireId_key" ON "TournamentUmpire"("tournamentId", "umpireId");

-- CreateIndex
CREATE INDEX "TournamentPoster_tournamentId_displayOrder_idx" ON "TournamentPoster"("tournamentId", "displayOrder");

-- CreateIndex
CREATE INDEX "Category_tournamentId_format_gender_idx" ON "Category"("tournamentId", "format", "gender");

-- CreateIndex
CREATE INDEX "Registration_userId_idx" ON "Registration"("userId");

-- CreateIndex
CREATE INDEX "Registration_tournamentId_idx" ON "Registration"("tournamentId");

-- CreateIndex
CREATE INDEX "Registration_categoryId_idx" ON "Registration"("categoryId");

-- CreateIndex
CREATE INDEX "Registration_partnerId_idx" ON "Registration"("partnerId");

-- CreateIndex
CREATE INDEX "Registration_guestEmail_idx" ON "Registration"("guestEmail");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Draw_tournamentId_idx" ON "Draw"("tournamentId");

-- CreateIndex
CREATE INDEX "Draw_categoryId_idx" ON "Draw"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Draw_tournamentId_categoryId_key" ON "Draw"("tournamentId", "categoryId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_categoryId_idx" ON "Match"("tournamentId", "categoryId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_round_idx" ON "Match"("tournamentId", "round");

-- CreateIndex
CREATE INDEX "Match_tournamentId_roundNumber_idx" ON "Match"("tournamentId", "roundNumber");

-- CreateIndex
CREATE INDEX "Match_parentMatchId_idx" ON "Match"("parentMatchId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_round_idx" ON "Match"("round");

-- CreateIndex
CREATE INDEX "Match_umpireId_idx" ON "Match"("umpireId");

-- CreateIndex
CREATE INDEX "Match_stage_idx" ON "Match"("stage");

-- CreateIndex
CREATE INDEX "Match_matchIndex_idx" ON "Match"("matchIndex");

-- CreateIndex
CREATE INDEX "Match_groupIndex_idx" ON "Match"("groupIndex");

-- CreateIndex
CREATE INDEX "ScoreCorrectionRequest_matchId_idx" ON "ScoreCorrectionRequest"("matchId");

-- CreateIndex
CREATE INDEX "ScoreCorrectionRequest_umpireId_idx" ON "ScoreCorrectionRequest"("umpireId");

-- CreateIndex
CREATE INDEX "ScoreCorrectionRequest_status_idx" ON "ScoreCorrectionRequest"("status");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "sms_logs_phoneNumber_createdAt_idx" ON "sms_logs"("phoneNumber", "createdAt");

-- CreateIndex
CREATE INDEX "sms_logs_status_createdAt_idx" ON "sms_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "academies_status_idx" ON "academies"("status");

-- CreateIndex
CREATE INDEX "academies_city_state_idx" ON "academies"("city", "state");

-- CreateIndex
CREATE INDEX "academies_createdAt_idx" ON "academies"("createdAt");

-- CreateIndex
CREATE INDEX "academies_isDeleted_idx" ON "academies"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_kyc_organizerId_key" ON "organizer_kyc"("organizerId");

-- CreateIndex
CREATE INDEX "organizer_kyc_organizerId_idx" ON "organizer_kyc"("organizerId");

-- CreateIndex
CREATE INDEX "organizer_kyc_status_idx" ON "organizer_kyc"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_requests_userId_key" ON "organizer_requests"("userId");

-- CreateIndex
CREATE INDEX "organizer_requests_userId_idx" ON "organizer_requests"("userId");

-- CreateIndex
CREATE INDEX "organizer_requests_status_idx" ON "organizer_requests"("status");

-- CreateIndex
CREATE INDEX "organizer_requests_createdAt_idx" ON "organizer_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_payments_tournamentId_key" ON "tournament_payments"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_payments_tournamentId_idx" ON "tournament_payments"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_payments_organizerId_idx" ON "tournament_payments"("organizerId");

-- CreateIndex
CREATE INDEX "tournament_payments_payout50Status1_idx" ON "tournament_payments"("payout50Status1");

-- CreateIndex
CREATE INDEX "tournament_payments_payout50Status2_idx" ON "tournament_payments"("payout50Status2");

-- CreateIndex
CREATE UNIQUE INDEX "payment_verifications_registrationId_key" ON "payment_verifications"("registrationId");

-- CreateIndex
CREATE INDEX "payment_verifications_registrationId_idx" ON "payment_verifications"("registrationId");

-- CreateIndex
CREATE INDEX "payment_verifications_tournamentId_idx" ON "payment_verifications"("tournamentId");

-- CreateIndex
CREATE INDEX "payment_verifications_userId_idx" ON "payment_verifications"("userId");

-- CreateIndex
CREATE INDEX "payment_verifications_status_idx" ON "payment_verifications"("status");

-- CreateIndex
CREATE INDEX "payment_verifications_submittedAt_idx" ON "payment_verifications"("submittedAt");

-- CreateIndex
CREATE INDEX "points_logs_userId_idx" ON "points_logs"("userId");

-- CreateIndex
CREATE INDEX "points_logs_tournamentId_idx" ON "points_logs"("tournamentId");

-- CreateIndex
CREATE INDEX "points_logs_categoryId_idx" ON "points_logs"("categoryId");

-- CreateIndex
CREATE INDEX "points_logs_earned_at_idx" ON "points_logs"("earned_at");

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerProfile" ADD CONSTRAINT "OrganizerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UmpireProfile" ADD CONSTRAINT "UmpireProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentUmpire" ADD CONSTRAINT "TournamentUmpire_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentUmpire" ADD CONSTRAINT "TournamentUmpire_umpireId_fkey" FOREIGN KEY ("umpireId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPoster" ADD CONSTRAINT "TournamentPoster_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_parentMatchId_fkey" FOREIGN KEY ("parentMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_umpireId_fkey" FOREIGN KEY ("umpireId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_kyc" ADD CONSTRAINT "organizer_kyc_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_kyc" ADD CONSTRAINT "organizer_kyc_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_requests" ADD CONSTRAINT "organizer_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_requests" ADD CONSTRAINT "organizer_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_payments" ADD CONSTRAINT "tournament_payments_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_verifications" ADD CONSTRAINT "payment_verifications_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_logs" ADD CONSTRAINT "points_logs_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_logs" ADD CONSTRAINT "points_logs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
