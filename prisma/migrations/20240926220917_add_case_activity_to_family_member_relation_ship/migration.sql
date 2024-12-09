/*
  Warnings:

  - You are about to drop the `ActivitiesCaseFiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivitiesCaseFiles" DROP CONSTRAINT "ActivitiesCaseFiles_CaseActivityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivitiesCaseFiles" DROP CONSTRAINT "ActivitiesCaseFiles_CaseFileId_fkey";

-- DropTable
DROP TABLE "ActivitiesCaseFiles";

-- CreateTable
CREATE TABLE "ActivityCaseFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CaseActivityId" UUID,
    "CaseFileId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ActivityCaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMemberCaseActivityLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CaseActivityId" UUID,
    "UserFamilyMemberId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "FamilyMemberCaseActivityLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActivityCaseFile" ADD CONSTRAINT "ActivityCaseFile_CaseActivityId_fkey" FOREIGN KEY ("CaseActivityId") REFERENCES "CaseActivityLog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ActivityCaseFile" ADD CONSTRAINT "ActivityCaseFile_CaseFileId_fkey" FOREIGN KEY ("CaseFileId") REFERENCES "CaseFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FamilyMemberCaseActivityLog" ADD CONSTRAINT "FamilyMemberCaseActivityLog_UserFamilyMemberId_fkey" FOREIGN KEY ("UserFamilyMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FamilyMemberCaseActivityLog" ADD CONSTRAINT "FamilyMemberCaseActivityLog_CaseActivityId_fkey" FOREIGN KEY ("CaseActivityId") REFERENCES "CaseActivityLog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
