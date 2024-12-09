-- AlterTable
ALTER TABLE "CaseActivityLog" ADD COLUMN     "CreatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "DeletedAt" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "StakeholderGroup" ADD COLUMN     "DeletedAt" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "StakeholderGroupRole" ADD COLUMN     "DeletedAt" TIMESTAMPTZ(6);
