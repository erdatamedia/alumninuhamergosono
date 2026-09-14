import bcrypt from "bcryptjs";

export function isValidPinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/** Tolak PIN dengan pola sederhana: semua digit sama, atau urut naik/turun. */
export function isPinTooSimple(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  if ("0123456789".includes(pin)) return true;
  if ("9876543210".includes(pin)) return true;
  return false;
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
