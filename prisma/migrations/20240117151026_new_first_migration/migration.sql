-- CreateTable
CREATE TABLE "Case" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Title" TEXT,
    "CaseType" TEXT,
    "PercentComplete" DECIMAL,
    "AgencyCaseIdentifier" TEXT,
    "CaseAttributes" JSONB,
    "Status" TEXT,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseApplicant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "CaseId" UUID,
    "UserFamilyMemberId" UUID,

    CONSTRAINT "CaseApplicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseCriterion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Status" TEXT,
    "LastModifiedByUserId" UUID,
    "LastModifiedAt" DATE,
    "CaseId" UUID,
    "WorkflowStageCriterionId" UUID,

    CONSTRAINT "CaseCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "NoteText" TEXT,
    "ParentNoteId" UUID,
    "AuthorUserId" UUID,
    "CreatedAt" DATE,
    "NoteAudienceScope" TEXT,
    "CaseId" UUID,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTeamAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" UUID,
    "CaseId" UUID,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "CaseRole" TEXT,

    CONSTRAINT "CaseTeamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserFileId" UUID,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "CreatedByUserId" UUID,
    "CaseId" UUID,

    CONSTRAINT "CaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformActivityLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ActivityType" TEXT,
    "ActivityValue" TEXT,
    "RelatedId" UUID,
    "CreatedAt" DATE,
    "ActivityGeneratedByUserId" UUID,
    "Metadata" JSON,

    CONSTRAINT "PlatformActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Name" TEXT,
    "Description" TEXT,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,

    CONSTRAINT "StakeholderGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderGroupRole" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "StakeholderGroupId" UUID,
    "Name" TEXT,
    "Description" TEXT,
    "CreatedAt" DATE,

    CONSTRAINT "StakeholderGroupRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedMediaAssetVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ContentType" TEXT,
    "SizeInBytes" INTEGER,
    "OriginalFilename" TEXT,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "CreatedByUserId" UUID,
    "LastModifiedByUserId" UUID,
    "UserFileId" UUID,

    CONSTRAINT "UploadedMediaAssetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "LegacyId" TEXT,
    "FirstName" TEXT,
    "LastName" TEXT,
    "IdpId" TEXT,
    "Email" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAttribute" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "AtttributeName" TEXT,
    "AttributeValue" TEXT,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "CreatedByUserId" UUID,
    "LastModifiedByUserId" UUID,

    CONSTRAINT "UserAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "LegacyId" TEXT,
    "ContentType" TEXT,
    "ActiveVersionId" UUID,
    "OriginalFilename" TEXT,
    "Title" TEXT,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "OwnerUserId" UUID,
    "CreatedByUserId" UUID,
    "LastModifiedByUserId" UUID,
    "UserFamilMemberId" UUID,

    CONSTRAINT "UserFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFamilyMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "UserId" UUID,
    "DOB" TIMESTAMP(3) NOT NULL,
    "Relationship" TEXT NOT NULL,

    CONSTRAINT "UserFamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_StakeholderGroupRole" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "StakeholderGroupRoleId" UUID,
    "UserId" UUID,

    CONSTRAINT "User_StakeholderGroupRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "Name" TEXT NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "StageName" TEXT,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "WorflowId" UUID,

    CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStageCriterion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CaseWorkflowStageId" UUID,
    "Name" TEXT,
    "CriterionFulfillmentType" TEXT,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,

    CONSTRAINT "WorkflowStageCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdxPlatformActivityLog" ON "PlatformActivityLog"("ActivityType", "RelatedId");

-- CreateIndex
CREATE INDEX "IdxUploadedMediaAssetVersion" ON "UploadedMediaAssetVersion"("ContentType");

-- CreateIndex
CREATE INDEX "Idx" ON "UserAttribute"("AtttributeName");

-- CreateIndex
CREATE INDEX "IdxUserFile" ON "UserFile"("ContentType");

-- AddForeignKey
ALTER TABLE "CaseApplicant" ADD CONSTRAINT "CaseApplicant_UserFamilyMemberId_fkey" FOREIGN KEY ("UserFamilyMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseApplicant" ADD CONSTRAINT "CaseApplicant_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseCriterion" ADD CONSTRAINT "CaseCriterion_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseCriterion" ADD CONSTRAINT "CaseCriterion_WorkflowStageCriterionId_fkey" FOREIGN KEY ("WorkflowStageCriterionId") REFERENCES "WorkflowStageCriterion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseCriterion" ADD CONSTRAINT "CaseCriterion_LastModifiedByUserId_fkey" FOREIGN KEY ("LastModifiedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_AuthorUserId_fkey" FOREIGN KEY ("AuthorUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_ParentNoteId_fkey" FOREIGN KEY ("ParentNoteId") REFERENCES "CaseNote"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseTeamAssignment" ADD CONSTRAINT "CaseTeamAssignment_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseTeamAssignment" ADD CONSTRAINT "CaseTeamAssignment_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_UserFileId_fkey" FOREIGN KEY ("UserFileId") REFERENCES "UserFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PlatformActivityLog" ADD CONSTRAINT "PlatformActivityLog_ActivityGeneratedByUserId_fkey" FOREIGN KEY ("ActivityGeneratedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StakeholderGroupRole" ADD CONSTRAINT "StakeholderGroupRole_StakeholderGroupId_fkey" FOREIGN KEY ("StakeholderGroupId") REFERENCES "StakeholderGroup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UploadedMediaAssetVersion" ADD CONSTRAINT "UploadedMediaAssetVersion_UserFileId_fkey" FOREIGN KEY ("UserFileId") REFERENCES "UserFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_CreatedByUserId_fkey" FOREIGN KEY ("CreatedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_LastModifiedByUserId_fkey" FOREIGN KEY ("LastModifiedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_UserFamilMemberId_fkey" FOREIGN KEY ("UserFamilMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_OwnerUserId_fkey" FOREIGN KEY ("OwnerUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFamilyMember" ADD CONSTRAINT "UserFamilyMember_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User_StakeholderGroupRole" ADD CONSTRAINT "User_StakeholderGroupRole_StakeholderGroupRoleId_fkey" FOREIGN KEY ("StakeholderGroupRoleId") REFERENCES "StakeholderGroupRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User_StakeholderGroupRole" ADD CONSTRAINT "User_StakeholderGroupRole_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_WorflowId_fkey" FOREIGN KEY ("WorflowId") REFERENCES "Workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorkflowStageCriterion" ADD CONSTRAINT "WorkflowStageCriterion_CaseWorkflowStageId_fkey" FOREIGN KEY ("CaseWorkflowStageId") REFERENCES "WorkflowStage"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
