-- CreateTable
CREATE TABLE "CaseActivityLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ActivityType" TEXT,
    "ActivityValue" TEXT,
    "CaseId" UUID,
    "ActivityGeneratedByUserId" UUID,
    "ActivityAcknowledgedByUserId" UUID,
    "Metadata" JSON,
    "ActivityAcknowledged" BOOLEAN,
    "LastModifiedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CaseActivityLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CaseActivityLog" ADD CONSTRAINT "CaseActivityLog_ActivityAcknowledgedByUserId_fkey" FOREIGN KEY ("ActivityAcknowledgedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseActivityLog" ADD CONSTRAINT "CaseActivityLog_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseActivityLog" ADD CONSTRAINT "CaseActivityLog_ActivityGeneratedByUserId_fkey" FOREIGN KEY ("ActivityGeneratedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
