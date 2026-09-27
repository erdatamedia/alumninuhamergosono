-- CreateTable
CREATE TABLE "DoorprizeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tahunAcara" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DoorprizeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoorprizeEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DoorprizeSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DoorprizeEntry_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DoorprizeSession_token_key" ON "DoorprizeSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "DoorprizeEntry_sessionId_alumniId_key" ON "DoorprizeEntry"("sessionId", "alumniId");
