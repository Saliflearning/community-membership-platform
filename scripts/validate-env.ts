import { validateRuntimeEnv } from "../src/lib/env";

const result = validateRuntimeEnv(process.env.NODE_ENV === "production" ? "production" : "staging");

if (!result.ok) {
  console.error("Missing required deployment environment variables:");
  for (const issue of result.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Environment configuration is deployment-ready.");
