// Usage: node scripts/hash-password.mjs '<password>'
// Prints the ADMIN_PASSWORD_HASH line to put in your .env file.
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs '<password>'");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await promisify(scrypt)(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
