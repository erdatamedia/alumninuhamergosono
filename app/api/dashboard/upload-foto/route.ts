import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "foto-profil");
const PUBLIC_PREFIX = "/uploads/foto-profil";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("foto");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File foto wajib diunggah." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format file harus JPEG, PNG, atau WebP." },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 2MB." }, { status: 400 });
  }

  const alumni = await prisma.alumni.findUnique({ where: { id: session.alumniId } });
  if (!alumni) {
    return NextResponse.json({ error: "Data alumni tidak ditemukan." }, { status: 404 });
  }

  let processed: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    processed = await sharp(inputBuffer)
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "File gambar tidak valid atau rusak." }, { status: 400 });
  }

  const filename = `${randomUUID()}.webp`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), processed);

  const newFotoUrl = `${PUBLIC_PREFIX}/${filename}`;

  await prisma.alumni.update({
    where: { id: alumni.id },
    data: { fotoUrl: newFotoUrl },
  });

  // Hapus foto lama setelah foto baru berhasil disimpan, supaya tidak menumpuk file yatim.
  if (alumni.fotoUrl && alumni.fotoUrl.startsWith(PUBLIC_PREFIX)) {
    const oldFilename = path.basename(alumni.fotoUrl);
    const oldPath = path.join(UPLOAD_DIR, oldFilename);
    await fs.unlink(oldPath).catch(() => {
      // abaikan bila file lama sudah tidak ada
    });
  }

  return NextResponse.json({ fotoUrl: newFotoUrl });
}
