import { NextResponse } from "next/server";
import { isSupabaseConfigured, validateRuntimeEnv, env } from "@/lib/env";

export async function GET() {
  if (process.env.SHOWCASE_MODE === "true") {
    return NextResponse.json({
      ok: true,
      mode: "showcase",
      deploymentEnv: env.deploymentEnv,
      dataBackend: env.dataBackend,
      supabaseConfigured: false,
      integrationsConnected: false
    });
  }

  const validation = validateRuntimeEnv();

  return NextResponse.json(
    {
      ok: validation.ok,
      deploymentEnv: env.deploymentEnv,
      dataBackend: env.dataBackend,
      supabaseConfigured: isSupabaseConfigured(),
      integrationsConnected: validation.ok,
      missing: validation.ok ? [] : validation.issues
    },
    { status: validation.ok ? 200 : 503 }
  );
}
