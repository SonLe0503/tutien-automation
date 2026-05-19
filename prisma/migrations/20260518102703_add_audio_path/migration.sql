-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "audioPath" TEXT;

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "bookSlug" DROP DEFAULT;
