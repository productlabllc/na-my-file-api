/*
  Warnings:

  - You are about to drop the column `WorkflowStageId` on the `CaseCriterion` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CaseCriterion" DROP CONSTRAINT "CaseCriterion_WorkflowStageId_fkey";

-- AlterTable
ALTER TABLE "CaseCriterion" DROP COLUMN "WorkflowStageId";
