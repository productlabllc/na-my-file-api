-- public."Case" definition

-- Drop table

-- DROP TABLE public."Case";

CREATE TABLE public."Case" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"Title" text NULL,
	"CaseType" text NULL,
	"PercentComplete" numeric NULL,
	"Status" text NULL,
	"CreatedAt" date NULL,
	"LastModifiedAt" date NULL,
	CONSTRAINT "Case_pkey" PRIMARY KEY (id)
);


-- public."StakeholderGroup" definition

-- Drop table

-- DROP TABLE public."StakeholderGroup";

CREATE TABLE public."StakeholderGroup" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"Name" text NULL,
	"Description" text NULL,
	"CreatedAt" date NULL,
	"LastModifiedAt" date NULL,
	CONSTRAINT "StakeholderGroup_pkey" PRIMARY KEY (id)
);


-- public."User" definition

-- Drop table

-- DROP TABLE public."User";

CREATE TABLE public."User" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"FirstName" text NULL,
	"LastName" text NULL,
	"IdpId" text NULL,
	"Email" text NULL,
	"LegacyId" text NULL,
	CONSTRAINT "User_pkey" PRIMARY KEY (id)
);


-- public."WorkflowStage" definition

-- Drop table

-- DROP TABLE public."WorkflowStage";

CREATE TABLE public."WorkflowStage" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"StageName" text NULL,
	CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY (id)
);


-- public."CaseApplicant" definition

-- Drop table

-- DROP TABLE public."CaseApplicant";

CREATE TABLE public."CaseApplicant" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"FirstName" text NULL,
	"LastName" text NULL,
	"ApplicantType" text NULL,
	"DOB" date NULL,
	"CreatedAt" date NULL,
	"CaseId" uuid NULL,
	CONSTRAINT "CaseApplicant_pkey" PRIMARY KEY (id),
	CONSTRAINT "CaseApplicant_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES public."Case"(id)
);


-- public."CaseNote" definition

-- Drop table

-- DROP TABLE public."CaseNote";

CREATE TABLE public."CaseNote" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"CaseId" uuid NULL,
	"NoteText" text NULL,
	"ParentNoteId" uuid NULL,
	"AuthorUserId" uuid NULL,
	"CreatedAt" date NULL,
	"NoteAudienceScope" text NULL,
	CONSTRAINT "CaseNote_pkey" PRIMARY KEY (id),
	CONSTRAINT "CaseNote_AuthorUserId_fkey" FOREIGN KEY ("AuthorUserId") REFERENCES public."User"(id),
	CONSTRAINT "CaseNote_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES public."Case"(id),
	CONSTRAINT "CaseNote_ParentNoteId_fkey" FOREIGN KEY ("ParentNoteId") REFERENCES public."CaseNote"(id)
);


-- public."CaseTeamAssignment" definition

-- Drop table

-- DROP TABLE public."CaseTeamAssignment";

CREATE TABLE public."CaseTeamAssignment" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"CaseId" uuid NULL,
	"UserId" uuid NULL,
	CONSTRAINT "CaseTeamAssignment_pkey" PRIMARY KEY (id),
	CONSTRAINT "CaseTeamAssignment_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES public."Case"(id),
	CONSTRAINT "CaseTeamAssignment_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"(id)
);


-- public."PlatformActivityLog" definition

-- Drop table

-- DROP TABLE public."PlatformActivityLog";

CREATE TABLE public."PlatformActivityLog" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"ActivityType" text NULL,
	"ActivityValue" text NULL,
	"RelatedId" uuid NULL,
	"CreatedAt" date NULL,
	"ActivityGeneratedByUserId" uuid NULL,
	"Metadata" json NULL,
	CONSTRAINT "PlatformActivityLog_pkey" PRIMARY KEY (id),
	CONSTRAINT "PlatformActivityLog_ActivityGeneratedByUserId_fkey" FOREIGN KEY ("ActivityGeneratedByUserId") REFERENCES public."User"(id)
);
CREATE INDEX "IdxPlatformActivityLog" ON public."PlatformActivityLog" USING btree ("ActivityType", "RelatedId");


-- public."StakeholderGroupRole" definition

-- Drop table

-- DROP TABLE public."StakeholderGroupRole";

CREATE TABLE public."StakeholderGroupRole" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"StakeholderGroupId" uuid NULL,
	"Name" text NULL,
	"Description" text NULL,
	"CreatedAt" date NULL,
	CONSTRAINT "StakeholderGroupRole_pkey" PRIMARY KEY (id),
	CONSTRAINT "StakeholderGroupRole_StakeholderGroupId_fkey" FOREIGN KEY ("StakeholderGroupId") REFERENCES public."StakeholderGroup"(id)
);


-- public."UserAttribute" definition

-- Drop table

-- DROP TABLE public."UserAttribute";

CREATE TABLE public."UserAttribute" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"AtttributeName" text NULL,
	"AttributeValue" text NULL,
	"CreatedAt" date NULL,
	"LastModifiedAt" date NULL,
	"CreatedByUserId" uuid NULL,
	"LastModifiedByUserId" uuid NULL,
	CONSTRAINT "UserAttribute_pkey" PRIMARY KEY (id),
	CONSTRAINT "UserAttribute_CreatedByUserId_fkey" FOREIGN KEY ("CreatedByUserId") REFERENCES public."User"(id),
	CONSTRAINT "UserAttribute_LastModifiedByUserId_fkey" FOREIGN KEY ("LastModifiedByUserId") REFERENCES public."User"(id)
);
CREATE INDEX "Idx" ON public."UserAttribute" USING btree ("AtttributeName");


-- public."UserFile" definition

-- Drop table

-- DROP TABLE public."UserFile";

CREATE TABLE public."UserFile" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"ContentType" text NULL,
	"ActiveVersionId" uuid NULL,
	"OriginalFilename" text NULL,
	"Title" text NULL,
	"CreatedAt" date NULL,
	"LastModifiedAt" date NULL,
	"OwnerUserId" uuid NULL,
	"CreatedByUserId" uuid NULL,
	"LastModifiedByUserId" uuid NULL,
	"LegacyId" text NULL,
	CONSTRAINT "UserFile_pkey" PRIMARY KEY (id),
	CONSTRAINT "UserFile_OwnerUserId_fkey" FOREIGN KEY ("OwnerUserId") REFERENCES public."User"(id)
);
CREATE INDEX "IdxUserFile" ON public."UserFile" USING btree ("ContentType");


-- public."User_StakeholderGroupRole" definition

-- Drop table

-- DROP TABLE public."User_StakeholderGroupRole";

CREATE TABLE public."User_StakeholderGroupRole" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"StakeholderGroupRoleId" uuid NULL,
	"UserId" uuid NULL,
	CONSTRAINT "User_StakeholderGroupRole_pkey" PRIMARY KEY (id),
	CONSTRAINT "User_StakeholderGroupRole_StakeholderGroupRoleId_fkey" FOREIGN KEY ("StakeholderGroupRoleId") REFERENCES public."StakeholderGroupRole"(id),
	CONSTRAINT "User_StakeholderGroupRole_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"(id)
);


-- public."WorkflowStageCriterion" definition

-- Drop table

-- DROP TABLE public."WorkflowStageCriterion";

CREATE TABLE public."WorkflowStageCriterion" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"CaseWorkflowStageId" uuid NULL,
	"Name" text NULL,
	"CriterionFulfillmentType" text NULL,
	CONSTRAINT "WorkflowStageCriterion_pkey" PRIMARY KEY (id),
	CONSTRAINT "WorkflowStageCriterion_CaseWorkflowStageId_fkey" FOREIGN KEY ("CaseWorkflowStageId") REFERENCES public."WorkflowStage"(id)
);


-- public."CaseCriterion" definition

-- Drop table

-- DROP TABLE public."CaseCriterion";

CREATE TABLE public."CaseCriterion" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"CaseId" uuid NULL,
	"WorkflowStageCriterionId" uuid NULL,
	"Status" text NULL,
	"LastModifiedAt" date NULL,
	"LastModifiedByUserId" uuid NULL,
	CONSTRAINT "CaseCriterion_pkey" PRIMARY KEY (id),
	CONSTRAINT "CaseCriterion_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES public."Case"(id),
	CONSTRAINT "CaseCriterion_LastModifiedByUserId_fkey" FOREIGN KEY ("LastModifiedByUserId") REFERENCES public."User"(id),
	CONSTRAINT "CaseCriterion_WorkflowStageCriterionId_fkey" FOREIGN KEY ("WorkflowStageCriterionId") REFERENCES public."WorkflowStageCriterion"(id)
);


-- public."CaseFile" definition

-- Drop table

-- DROP TABLE public."CaseFile";

CREATE TABLE public."CaseFile" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"UserFileId" uuid NULL,
	"CreatedAt" date NULL,
	"LastModifiedAt" date NULL,
	"CreatedByUserId" uuid NULL,
	"CaseId" uuid NULL,
	CONSTRAINT "CaseFile_pkey" PRIMARY KEY (id),
	CONSTRAINT "CaseFile_CaseId_fkey" FOREIGN KEY ("CaseId") REFERENCES public."Case"(id),
	CONSTRAINT "CaseFile_UserFileId_fkey" FOREIGN KEY ("UserFileId") REFERENCES public."UserFile"(id)
);


-- public."UploadedMediaAssetVersion" definition

-- Drop table

-- DROP TABLE public."UploadedMediaAssetVersion";

CREATE TABLE public."UploadedMediaAssetVersion" (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"ContentType" text NULL,
	"SizeInBytes" int4 NULL,
	"OriginalFilename" text NULL,
	"CreatedAt" date NULL,
	"LastModifiedAt" date NULL,
	"CreatedByUserId" uuid NULL,
	"LastModifiedByUserId" uuid NULL,
	"UserFileId" uuid NULL,
	CONSTRAINT "UploadedMediaAssetVersion_pkey" PRIMARY KEY (id),
	CONSTRAINT "UploadedMediaAssetVersion_UserFileId_fkey" FOREIGN KEY ("UserFileId") REFERENCES public."UserFile"(id)
);
CREATE INDEX "IdxUploadedMediaAssetVersion" ON public."UploadedMediaAssetVersion" USING btree ("ContentType");