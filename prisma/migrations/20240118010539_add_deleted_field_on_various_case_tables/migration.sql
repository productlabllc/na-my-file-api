-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "DeletedAt" DATE;

-- AlterTable
ALTER TABLE "CaseApplicant" ADD COLUMN     "DeletedAt" DATE;

-- AlterTable
ALTER TABLE "CaseNote" ADD COLUMN     "DeletedAt" DATE,
ADD COLUMN     "LastModifiedAt" DATE;

-- AlterTable
ALTER TABLE "CaseTeamAssignment" ADD COLUMN     "DeletedAt" DATE;
