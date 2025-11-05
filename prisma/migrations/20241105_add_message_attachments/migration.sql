-- Add attachment fields to messages table
-- Migration: 20241105_add_message_attachments

-- Add attachment columns to messages table
ALTER TABLE "messages" ADD COLUMN "attachmentUrl" TEXT;
ALTER TABLE "messages" ADD COLUMN "attachmentName" TEXT;
ALTER TABLE "messages" ADD COLUMN "attachmentSize" INTEGER;
ALTER TABLE "messages" ADD COLUMN "attachmentType" TEXT;

-- Add index for attachmentType for better query performance
CREATE INDEX "messages_attachmentType_idx" ON "messages"("attachmentType");

-- Add comment to document the new fields
COMMENT ON COLUMN "messages"."attachmentUrl" IS 'URL del archivo adjunto en DigitalOcean Spaces';
COMMENT ON COLUMN "messages"."attachmentName" IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN "messages"."attachmentSize" IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN "messages"."attachmentType" IS 'Tipo MIME del archivo (image, pdf, document, etc.)';
