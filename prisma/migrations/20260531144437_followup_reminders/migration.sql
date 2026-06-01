-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT DEFAULT 'medium';
