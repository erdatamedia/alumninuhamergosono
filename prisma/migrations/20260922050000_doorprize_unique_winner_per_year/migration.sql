-- DropIndex
DROP INDEX "DoorprizeWinner_tahunAcara_idx";

-- CreateIndex
CREATE UNIQUE INDEX "DoorprizeWinner_alumniId_tahunAcara_key" ON "DoorprizeWinner"("alumniId", "tahunAcara");
