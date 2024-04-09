-- CreateTable
CREATE TABLE "Case" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Title" TEXT,
    "CaseType" TEXT,
    "PercentComplete" DECIMAL,
    "AgencyCaseIdentifier" TEXT,
    "CaseAttributes" JSONB,
    "Status" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseApplicant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "CaseId" UUID,
    "UserFamilyMemberId" UUID,
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CaseApplicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseCriterion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Status" TEXT,
    "LastModifiedByUserId" UUID,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "CaseId" UUID,
    "WorkflowStageCriterionId" UUID,
    "DeletedAt" TIMESTAMPTZ(6),
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "NoteText" TEXT,
    "ParentNoteId" UUID,
    "AuthorUserId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "NoteAudienceScope" TEXT,
    "CaseId" UUID,
    "DeletedAt" TIMESTAMPTZ(6),
    "LastModifiedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTeamAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" UUID,
    "CaseId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "CaseRole" TEXT,
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CaseTeamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserFileId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "CreatedByUserId" UUID,
    "CaseId" UUID,
    "DeletedAt" TIMESTAMPTZ(6),
    "Status" TEXT,

    CONSTRAINT "CaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformActivityLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ActivityType" TEXT,
    "ActivityValue" TEXT,
    "RelatedId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ActivityGeneratedByUserId" UUID,
    "Metadata" JSON,
    "LastModifiedAt" TIMESTAMPTZ(6),

    CONSTRAINT "PlatformActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Name" TEXT,
    "Description" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),

    CONSTRAINT "StakeholderGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderGroupRole" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "StakeholderGroupId" UUID,
    "Name" TEXT,
    "Description" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),

    CONSTRAINT "StakeholderGroupRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedMediaAssetVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ContentType" TEXT,
    "SizeInBytes" INTEGER,
    "OriginalFilename" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "CreatedByUserId" UUID,
    "LastModifiedByUserId" UUID,
    "UserFileId" UUID,
    "DeletedAt" TIMESTAMPTZ(6),

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
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),
    "LanguageId" UUID,
    "DOB" TIMESTAMPTZ(6),
    "PPAcceptedAt" TIMESTAMPTZ(6),
    "TOSAcceptedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAttribute" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "AtttributeName" TEXT,
    "AttributeValue" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "CreatedByUserId" UUID,
    "LastModifiedByUserId" UUID,

    CONSTRAINT "UserAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "DeletedAt" TIMESTAMPTZ(6),
    "ContentType" TEXT,
    "SizeInBytes" INTEGER,
    "Title" TEXT,
    "Status" TEXT,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "OriginalFilename" TEXT,

    CONSTRAINT "GeneratedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "LegacyId" TEXT,
    "ContentType" TEXT,
    "ActiveVersionId" UUID,
    "OriginalFilename" TEXT,
    "Title" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "OwnerUserId" UUID,
    "CreatedByUserId" UUID,
    "LastModifiedByUserId" UUID,
    "UserFamilyMemberId" UUID,
    "DeletedAt" TIMESTAMPTZ(6),
    "Status" TEXT,
    "GeneratedFileId" UUID,
    "PageNumber" INTEGER,

    CONSTRAINT "UserFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFamilyMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "UserId" UUID,
    "DOB" TIMESTAMPTZ(6) NOT NULL,
    "Relationship" TEXT NOT NULL,
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "UserFamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_StakeholderGroupRole" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "StakeholderGroupRoleId" UUID,
    "UserId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "DeletedAt" TIMESTAMPTZ(6),
    "LastModifiedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_StakeholderGroupRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "Name" TEXT,
    "Description" TEXT,
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "StageName" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),
    "WorkflowId" UUID,

    CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStageCriterion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CaseWorkflowStageId" UUID,
    "Name" TEXT,
    "CriterionFulfillmentType" TEXT,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "WorkflowStageCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWorkflow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" UUID,
    "WorkflowId" UUID,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "UserWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Name" TEXT NOT NULL,
    "Code" TEXT NOT NULL,
    "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "LastModifiedAt" TIMESTAMPTZ(6),
    "DeletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
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
ALTER TABLE "CaseApplicant" ADD CONSTRAINT "CaseApplicant_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseApplicant" ADD CONSTRAINT "CaseApplicant_UserFamilyMemberId_fkey" FOREIGN KEY ("UserFamilyMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseCriterion" ADD CONSTRAINT "CaseCriterion_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseCriterion" ADD CONSTRAINT "CaseCriterion_LastModifiedByUserId_fkey" FOREIGN KEY ("LastModifiedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseCriterion" ADD CONSTRAINT "CaseCriterion_WorkflowStageCriterionId_fkey" FOREIGN KEY ("WorkflowStageCriterionId") REFERENCES "WorkflowStageCriterion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

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
ALTER TABLE "User" ADD CONSTRAINT "User_LanguageId_fkey" FOREIGN KEY ("LanguageId") REFERENCES "Language"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_CreatedByUserId_fkey" FOREIGN KEY ("CreatedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_LastModifiedByUserId_fkey" FOREIGN KEY ("LastModifiedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_GeneratedFileId_fkey" FOREIGN KEY ("GeneratedFileId") REFERENCES "GeneratedFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_OwnerUserId_fkey" FOREIGN KEY ("OwnerUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_UserFamilyMemberId_fkey" FOREIGN KEY ("UserFamilyMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFamilyMember" ADD CONSTRAINT "UserFamilyMember_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User_StakeholderGroupRole" ADD CONSTRAINT "User_StakeholderGroupRole_StakeholderGroupRoleId_fkey" FOREIGN KEY ("StakeholderGroupRoleId") REFERENCES "StakeholderGroupRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User_StakeholderGroupRole" ADD CONSTRAINT "User_StakeholderGroupRole_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_WorkflowId_fkey" FOREIGN KEY ("WorkflowId") REFERENCES "Workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorkflowStageCriterion" ADD CONSTRAINT "WorkflowStageCriterion_CaseWorkflowStageId_fkey" FOREIGN KEY ("CaseWorkflowStageId") REFERENCES "WorkflowStage"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserWorkflow" ADD CONSTRAINT "UserWorkflow_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserWorkflow" ADD CONSTRAINT "UserWorkflow_WorkflowId_fkey" FOREIGN KEY ("WorkflowId") REFERENCES "Workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

