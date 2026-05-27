-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "videoPath" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "topic" TEXT NOT NULL DEFAULT 'TUTIEN';
