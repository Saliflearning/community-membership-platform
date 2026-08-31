import { NextResponse } from "next/server";
import { isSupabaseConfigured, validateRuntimeEnv, env } from "@/lib/env";

export async function GET() {
  const validation = validateRuntimeEnv();

  return NextResponse.json(
    {
      ok: validation.ok,
      deploymentEnv: env.deploymentEnv,
      dataBackend: env.dataBackend,
      supabaseConfigured: isSupabaseConfigured(),
      missing: validation.ok ? [] : validation.issues
    },
    { status: validation.ok ? 200 : 503 }
  );
}
