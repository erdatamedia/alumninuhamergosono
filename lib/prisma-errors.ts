import { Prisma } from "@prisma/client";

/** True kalau error adalah pelanggaran unique constraint Prisma (P2002) pada field tertentu. */
export function isUniqueConstraintOn(err: unknown, field: string): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    Array.isArray((err.meta as { target?: unknown })?.target) &&
    (err.meta as { target: string[] }).target.includes(field)
  );
}
