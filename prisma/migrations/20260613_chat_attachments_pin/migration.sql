-- Chat attachments + pinning
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "attachmentType" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "attachmentSize" INTEGER;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "attachmentMeta" JSONB;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "pinnedAt" TIMESTAMP(3);
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "pinnedById" TEXT;
CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_pinnedAt_idx" ON "ChatMessage" ("roomId", "pinnedAt");
