/*
  Warnings:

  - Added the required column `bookSlug` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Story" ADD COLUMN "bookSlug" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 1;

-- Update existing rows: dùng slug làm bookSlug tạm
UPDATE "Story" SET "bookSlug" = "slug";
