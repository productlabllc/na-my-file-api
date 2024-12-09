/*
  Warnings:

  - You are about to drop the column `NotificationSessionType` on the `EmailNotification` table. All the data in the column will be lost.
  - You are about to drop the column `NotificationSessionType` on the `SentEmailNotification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmailNotification" DROP COLUMN "NotificationSessionType",
ADD COLUMN     "NotificationCadence" TEXT;

-- AlterTable
ALTER TABLE "SentEmailNotification" DROP COLUMN "NotificationSessionType",
ADD COLUMN     "NotificationCadence" TEXT;
