import bcrypt from "bcryptjs";
import crypto from "crypto";

export function generateOtpCode(): string {
  // 6-digit numeric code, cryptographically random.
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{2})/g, "*");
}
