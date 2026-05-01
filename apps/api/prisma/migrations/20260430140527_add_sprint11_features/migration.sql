/*
  Warnings:

  - Made the column `success_rows` on table `import_jobs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `failed_rows` on table `import_jobs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "import_jobs" ALTER COLUMN "success_rows" SET NOT NULL,
ALTER COLUMN "failed_rows" SET NOT NULL;
