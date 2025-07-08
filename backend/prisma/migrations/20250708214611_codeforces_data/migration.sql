-- CreateTable
CREATE TABLE "CodeforcesProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "country" TEXT,
    "city" TEXT,
    "organization" TEXT,
    "contribution" INTEGER,
    "rank" TEXT,
    "maxRank" TEXT,
    "rating" INTEGER,
    "maxRating" INTEGER,
    "friendOfCount" INTEGER,
    "registrationTimeSeconds" INTEGER,
    "submissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeforcesProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeforcesProfile_userId_key" ON "CodeforcesProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeforcesProfile_handle_key" ON "CodeforcesProfile"("handle");

-- AddForeignKey
ALTER TABLE "CodeforcesProfile" ADD CONSTRAINT "CodeforcesProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
