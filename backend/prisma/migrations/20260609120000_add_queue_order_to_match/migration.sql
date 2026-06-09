-- Add queueOrder to Match for umpire queue system
-- Nullable integer — null means match is not in any queue.
-- When set, indicates the umpire's sequential position (1 = next, 2, 3, ...).
ALTER TABLE "Match" ADD COLUMN "queueOrder" INTEGER;
CREATE INDEX "Match_queueOrder_idx" ON "Match"("queueOrder");
