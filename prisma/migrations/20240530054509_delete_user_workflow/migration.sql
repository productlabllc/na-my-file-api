/*
  Warnings:

  - You are about to drop the `UserWorkflow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserWorkflow" DROP CONSTRAINT "UserWorkflow_UserId_fkey";

-- DropForeignKey
ALTER TABLE "UserWorkflow" DROP CONSTRAINT "UserWorkflow_WorkflowId_fkey";

-- DropTable
DROP TABLE "UserWorkflow";
