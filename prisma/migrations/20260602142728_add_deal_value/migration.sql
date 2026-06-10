/*
  Warnings:

  - You are about to drop the `LeadNote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LeadNote" DROP CONSTRAINT "LeadNote_leadId_fkey";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "dealValue" DOUBLE PRECISION;

-- DropTable
DROP TABLE "LeadNote";
