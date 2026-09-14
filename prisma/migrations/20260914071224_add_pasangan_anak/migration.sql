-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PartisipasiHaul" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alumniId" TEXT NOT NULL,
    "tahunAcara" INTEGER NOT NULL,
    "tahlilAkbar" TEXT,
    "haul" TEXT,
    "menginap" TEXT,
    "membawaPasangan" BOOLEAN NOT NULL DEFAULT false,
    "jumlahAnak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartisipasiHaul_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PartisipasiHaul" ("alumniId", "createdAt", "haul", "id", "menginap", "tahlilAkbar", "tahunAcara") SELECT "alumniId", "createdAt", "haul", "id", "menginap", "tahlilAkbar", "tahunAcara" FROM "PartisipasiHaul";
DROP TABLE "PartisipasiHaul";
ALTER TABLE "new_PartisipasiHaul" RENAME TO "PartisipasiHaul";
CREATE UNIQUE INDEX "PartisipasiHaul_alumniId_tahunAcara_key" ON "PartisipasiHaul"("alumniId", "tahunAcara");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
