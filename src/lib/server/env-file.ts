import { promises as fs } from "node:fs";
import path from "node:path";

// Updates (or appends) a KEY=value line in .env.local, preserving every other
// line untouched. Used only for ADMIN_PASSWORD_HASH, so a password change
// survives a restart on deployments that load env from this file (Next.js
// does, for `next start`). Returns false (without throwing) if the file
// doesn't exist — the caller still updates process.env for the running
// process; only persistence across a restart is lost in that case.
export async function setEnvLocalValue(key: string, value: string): Promise<boolean> {
  const file = path.join(process.cwd(), ".env.local");
  let contents: string;
  try {
    contents = await fs.readFile(file, "utf8");
  } catch {
    return false;
  }

  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const updated = pattern.test(contents) ? contents.replace(pattern, line) : `${contents.replace(/\n*$/, "\n")}${line}\n`;

  await fs.writeFile(file, updated, "utf8");
  return true;
}
