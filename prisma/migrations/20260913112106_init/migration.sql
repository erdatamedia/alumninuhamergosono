-- CreateTable
CREATE TABLE "Alumni" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nia" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "noWhatsapp" TEXT NOT NULL,
    "alamat" TEXT,
    "angkatanMasuk" INTEGER,
    "angkatanLulus" INTEGER,
    "dataVerifiedAt" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'MIGRATED_HISTORICAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PartisipasiHaul" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alumniId" TEXT NOT NULL,
    "tahunAcara" INTEGER NOT NULL,
    "tahlilAkbar" TEXT,
    "haul" TEXT,
    "menginap" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartisipasiHaul_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Alumni_nia_key" ON "Alumni"("nia");

-- CreateIndex
CREATE UNIQUE INDEX "Alumni_noWhatsapp_key" ON "Alumni"("noWhatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "PartisipasiHaul_alumniId_tahunAcara_key" ON "PartisipasiHaul"("alumniId", "tahunAcara");
