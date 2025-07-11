-- CreateTable
CREATE TABLE "CodechefProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "country" TEXT,
    "institution" TEXT,
    "rank" INTEGER,
    "rating" INTEGER,
    "highestRating" INTEGER,
    "stars" INTEGER,
    "fullySolved" INTEGER,
    "partiallySolved" INTEGER,
    "contestHistory" JSONB,
    "recentSubmissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodechefProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodechefProfile_userId_key" ON "CodechefProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CodechefProfile_username_key" ON "CodechefProfile"("username");

-- AddForeignKey
ALTER TABLE "CodechefProfile" ADD CONSTRAINT "CodechefProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
