-- AlterTable
ALTER TABLE "EmailNotification" ADD COLUMN     "Status" TEXT DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SentEmailNotification" ADD COLUMN     "EmailNotificationId" UUID;

-- AddForeignKey
ALTER TABLE "SentEmailNotification" ADD CONSTRAINT "SentEmailNotification_EmailNotificationId_fkey" FOREIGN KEY ("EmailNotificationId") REFERENCES "EmailNotification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
