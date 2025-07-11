-- CreateTable
CREATE TABLE "AtcoderProfile" (
    "id" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT,
    "problemId" TEXT,
    "language" TEXT,
    "result" TEXT,
    "point" DOUBLE PRECISION,
    "executionTime" INTEGER,
    "codeLength" INTEGER,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "AtcoderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AtcoderProfile_userId_id_key" ON "AtcoderProfile"("userId", "id");

-- AddForeignKey
ALTER TABLE "AtcoderProfile" ADD CONSTRAINT "AtcoderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
