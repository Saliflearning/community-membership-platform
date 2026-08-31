import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CommunityAssetRow = {
  code: string;
  official_name: string;
  logo_url: string | null;
};

export async function getSupabaseCommunityAssets(code: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("communities")
    .select("code, official_name, logo_url")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CommunityAssetRow | null;
}

export async function upsertSupabaseCommunityLogo(input: { code: string; officialName: string; logoUrl: string }) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("communities").upsert(
    {
      code: input.code,
      official_name: input.officialName,
      logo_url: input.logoUrl,
      active: true,
      updated_at: new Date().toISOString()
    },
    { onConflict: "code" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return input.logoUrl;
}
