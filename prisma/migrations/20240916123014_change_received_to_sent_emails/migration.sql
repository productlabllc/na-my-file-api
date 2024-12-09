/*
  Warnings:

  - You are about to drop the `ReceivedEmailNotification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReceivedEmailNotification" DROP CONSTRAINT "ReceivedEmailNotification_ClientUserId_fkey";

-- DropTable
DROP TABLE "ReceivedEmailNotification";

-- CreateTable
CREATE TABLE "SentEmailNotification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "NotificationSessionType" TEXT,
    "NotificationRecipientType" TEXT,
    "ClientUserId" UUID,
    "SessionStart" TIMESTAMP(3),
    "SessionEnd" TIMESTAMP(3),

    CONSTRAINT "SentEmailNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SentEmailNotification" ADD CONSTRAINT "SentEmailNotification_ClientUserId_fkey" FOREIGN KEY ("ClientUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
