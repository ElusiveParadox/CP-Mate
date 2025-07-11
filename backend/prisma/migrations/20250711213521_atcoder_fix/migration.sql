/*
  Warnings:

  - The primary key for the `AtcoderProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "AtcoderProfile" DROP CONSTRAINT "AtcoderProfile_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "AtcoderProfile_pkey" PRIMARY KEY ("id");
