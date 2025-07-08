/*
  Warnings:

  - A unique constraint covering the columns `[codeforcesHandle]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[leetcodeHandle]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codechefHandle]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[atcoderHandle]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_codeforcesHandle_key" ON "User"("codeforcesHandle");

-- CreateIndex
CREATE UNIQUE INDEX "User_leetcodeHandle_key" ON "User"("leetcodeHandle");

-- CreateIndex
CREATE UNIQUE INDEX "User_codechefHandle_key" ON "User"("codechefHandle");

-- CreateIndex
CREATE UNIQUE INDEX "User_atcoderHandle_key" ON "User"("atcoderHandle");
