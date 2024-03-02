-- AlterTable
ALTER TABLE "UploadedMediaAssetVersion" ADD COLUMN     "DeletedAt" DATE;

-- AlterTable
ALTER TABLE "UserFile" ADD COLUMN     "DeletedAt" DATE;
