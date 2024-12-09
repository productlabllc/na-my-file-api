-- AlterTable
ALTER TABLE "EmailNotification" ADD COLUMN     "RecepientUserId" UUID;

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_RecepientUserId_fkey" FOREIGN KEY ("RecepientUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
