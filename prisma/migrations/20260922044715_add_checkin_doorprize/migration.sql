-- AlterTable
ALTER TABLE "PartisipasiHaul" ADD COLUMN "checkedInAt" DATETIME;

-- CreateTable
CREATE TABLE "DoorprizeWinner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alumniId" TEXT NOT NULL,
    "tahunAcara" INTEGER NOT NULL,
    "namaHadiah" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoorprizeWinner_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DoorprizeWinner_tahunAcara_idx" ON "DoorprizeWinner"("tahunAcara");
