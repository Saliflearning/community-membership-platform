import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlatformConfig } from "@/types/domain";

const CONFIG_KEY = "active";

export async function getSupabasePlatformConfig(): Promise<PlatformConfig | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("platform_config").select("value").eq("key", CONFIG_KEY).maybeSingle();

  if (error) {
    if (isMissingPlatformConfigTable(error.message)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data?.value ? (data.value as PlatformConfig) : null;
}

export async function upsertSupabasePlatformConfig(config: PlatformConfig): Promise<PlatformConfig> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("platform_config").upsert(
    {
      key: CONFIG_KEY,
      value: config,
      updated_at: new Date().toISOString()
    },
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return config;
}

function isMissingPlatformConfigTable(message: string) {
  return message.includes("platform_config") && (message.includes("does not exist") || message.includes("schema cache"));
}
