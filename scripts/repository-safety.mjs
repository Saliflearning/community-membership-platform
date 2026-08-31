import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const scanHistory = process.argv.includes("--history");
const forbiddenTerms = [
  ["Bur", "kin"].join(""),
  ["Dias", "pora", " Hub"].join(""),
  ["dias", "pora-hub", "-usa"].join("")
];
const forbiddenPath = /(^|\/)(\.env(?!\.example$)|\.vercel|\.netlify)(\/|$)|\.(pem|p12|pfx|key)$/i;
const emailPattern = /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
const phonePattern = /(?<!\d)(?:\+?1[ .-]?)?\(?[2-9]\d{2}\)?[ .-]\d{3}[ .-]\d{4}(?!\d)/g;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  new RegExp(["AK", "IA", "[0-9A-Z]{16}"].join(""), "g"),
  new RegExp(["gh", "[pousr]", "_[A-Za-z0-9_]{20,}"].join(""), "g"),
  new RegExp(["(?:sk|rk)", "_live_", "[A-Za-z0-9]{16,}"].join(""), "g"),
  new RegExp(["AI", "za", "[0-9A-Za-z_-]{30,}"].join(""), "g"),
  /(?:API[_-]?KEY|SECRET|PASSWORD|TOKEN)\s*[:=]\s*["'][^"'\r\n]{8,}["']/gi
];

function allowedEmail(address) {
  if (address.toLowerCase() === "noreply@github.com") return true;

  const domain = address.split("@").at(-1)?.toLowerCase() ?? "";
  return (
    domain === "users.noreply.github.com" ||
    /(^|\.)example\.(com|org|net)$/.test(domain) ||
    domain.endsWith(".example") ||
    domain.endsWith(".test")
  );
}

function inspect(label, text, findings) {
  if (text.includes("\0")) return;

  for (const term of forbiddenTerms) {
    if (text.toLowerCase().includes(term.toLowerCase())) findings.push(`${label}: protected background term`);
  }

  for (const match of text.matchAll(emailPattern)) {
    if (!allowedEmail(match[0])) findings.push(`${label}: non-synthetic email address`);
  }

  if (phonePattern.test(text)) findings.push(`${label}: phone-number pattern`);
  phonePattern.lastIndex = 0;

  for (const pattern of secretPatterns) {
    if (pattern.test(text)) findings.push(`${label}: credential-like value`);
    pattern.lastIndex = 0;
  }
}

const findings = [];
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

for (const file of files) {
  const normalized = file.replaceAll("\\", "/");
  if (forbiddenPath.test(normalized)) findings.push(`${normalized}: forbidden tracked path`);
  inspect(normalized, readFileSync(file, "utf8"), findings);
}

if (scanHistory) {
  const history = execFileSync("git", ["log", "HEAD", "-p", "--no-ext-diff", "--format=fuller", "--", ".", ":!package-lock.json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  inspect("reachable Git history", history, findings);
}

if (findings.length) {
  console.error(`Repository safety failed with ${findings.length} finding(s):`);
  for (const finding of [...new Set(findings)]) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Repository safety passed for ${files.length} tracked files${scanHistory ? " and reachable history" : ""}.`);
