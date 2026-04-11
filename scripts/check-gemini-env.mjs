/**
 * Run from project root: node scripts/check-gemini-env.mjs
 * Logs whether .env files exist and if a GEMINI_API_KEY line is present (never prints the key).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

console.log("check-gemini-env: process.cwd() =", cwd);
console.log("check-gemini-env: script dir =", __dirname);

const files = [
  ".env.local",
  ".env",
  path.join(".next", ".env.local"),
  path.join(".next", ".env"),
];

for (const rel of files) {
  const abs = path.join(cwd, rel);
  const ex = existsSync(abs);
  console.log("\nFile:", rel);
  console.log("  absolute:", abs);
  console.log("  exists:", ex);
  if (!ex) continue;
  let content;
  try {
    content = readFileSync(abs, "utf8");
  } catch (e) {
    console.log("  read error:", e.message);
    continue;
  }
  const lines = content.split(/\r?\n/);
  const geminiLine = lines.find((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return false;
    return /^(?:export\s+)?GEMINI_API_KEY\s*=/.test(t);
  });
  console.log("  bytes:", Buffer.byteLength(content, "utf8"));
  console.log("  lines:", lines.length);
  console.log("  has GEMINI_API_KEY assignment line:", Boolean(geminiLine));
  if (geminiLine) {
    const afterEq = geminiLine.split("=").slice(1).join("=").trim();
    const unquoted = afterEq.replace(/^["']|["']$/g, "").trim();
    console.log("  value is non-empty (boolean only):", unquoted.length > 0);
  }
}
