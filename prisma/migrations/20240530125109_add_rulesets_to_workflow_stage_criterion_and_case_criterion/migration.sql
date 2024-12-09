-- AlterTable
ALTER TABLE "CaseCriterion" ADD COLUMN     "RuleSets" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "WorkflowStageCriterion" ADD COLUMN     "RuleSets" JSONB DEFAULT '{}';
