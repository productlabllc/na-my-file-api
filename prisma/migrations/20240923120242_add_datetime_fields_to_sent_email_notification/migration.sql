-- AlterTable
ALTER TABLE "SentEmailNotification" ADD COLUMN     "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "DeletedAt" TIMESTAMPTZ(6),
ADD COLUMN     "LastModifiedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;
