import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// Stored as `scrypt:<saltHex>:<hashHex>` (no `$`, which .env files would expand).
// Generate one with: node scripts/hash-password.mjs '<password>'
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}
