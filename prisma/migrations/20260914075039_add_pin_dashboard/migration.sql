-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alumni" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nia" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "noWhatsapp" TEXT NOT NULL,
    "alamat" TEXT,
    "angkatanMasuk" INTEGER,
    "angkatanLulus" INTEGER,
    "dataVerifiedAt" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'MIGRATED_HISTORICAL',
    "pinHash" TEXT,
    "pinFailedAttempt" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Alumni" ("alamat", "angkatanLulus", "angkatanMasuk", "createdAt", "dataVerifiedAt", "id", "namaLengkap", "nia", "noWhatsapp", "source", "updatedAt") SELECT "alamat", "angkatanLulus", "angkatanMasuk", "createdAt", "dataVerifiedAt", "id", "namaLengkap", "nia", "noWhatsapp", "source", "updatedAt" FROM "Alumni";
DROP TABLE "Alumni";
ALTER TABLE "new_Alumni" RENAME TO "Alumni";
CREATE UNIQUE INDEX "Alumni_nia_key" ON "Alumni"("nia");
CREATE UNIQUE INDEX "Alumni_noWhatsapp_key" ON "Alumni"("noWhatsapp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
