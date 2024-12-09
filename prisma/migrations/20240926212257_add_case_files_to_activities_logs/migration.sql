-- CreateTable
CREATE TABLE "ActivitiesCaseFiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CaseActivityId" UUID,
    "CaseFileId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ActivitiesCaseFiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActivitiesCaseFiles" ADD CONSTRAINT "ActivitiesCaseFiles_CaseActivityId_fkey" FOREIGN KEY ("CaseActivityId") REFERENCES "CaseActivityLog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ActivitiesCaseFiles" ADD CONSTRAINT "ActivitiesCaseFiles_CaseFileId_fkey" FOREIGN KEY ("CaseFileId") REFERENCES "CaseFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
