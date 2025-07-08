-- CreateTable
CREATE TABLE "LeetCodeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "realName" TEXT,
    "ranking" INTEGER,
    "reputation" INTEGER,
    "attendedContestsCount" INTEGER,
    "rating" DOUBLE PRECISION,
    "globalRanking" INTEGER,
    "topPercentage" DOUBLE PRECISION,
    "acSubmissionNum" JSONB,
    "totalSubmissionNum" JSONB,
    "recentAcSubmissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeetCodeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeetCodeProfile_userId_key" ON "LeetCodeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeetCodeProfile_username_key" ON "LeetCodeProfile"("username");

-- AddForeignKey
ALTER TABLE "LeetCodeProfile" ADD CONSTRAINT "LeetCodeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
