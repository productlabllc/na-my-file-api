-- CreateTable
CREATE TABLE "EmailNotification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "NotificationSessionType" TEXT,
    "NotificationRecipientType" TEXT,
    "CaseId" UUID,
    "OriginatorUserId" UUID,
    "NotificationData" JSONB,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "EmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivedEmailNotification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "NotificationSessionType" TEXT,
    "NotificationRecipientType" TEXT,
    "ClientUserId" UUID,
    "SessionStart" TIMESTAMP(3),
    "SessionEnd" TIMESTAMP(3),

    CONSTRAINT "ReceivedEmailNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_OriginatorUserId_fkey" FOREIGN KEY ("OriginatorUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReceivedEmailNotification" ADD CONSTRAINT "ReceivedEmailNotification_ClientUserId_fkey" FOREIGN KEY ("ClientUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
