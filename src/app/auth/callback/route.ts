import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const authError = requestUrl.searchParams.has("error_description") || requestUrl.searchParams.has("error");

  if (authError) {
    return NextResponse.redirect(new URL("/portal?authError=callback_failed", request.url));
  }

  if (code) {
    const supabase = await createSupabaseSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/portal?authError=callback_failed", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

function sanitizeNextPath(next: string | null) {
  if (!next || next.length > 512 || !next.startsWith("/") || next.startsWith("//") || /[\r\n\\]/.test(next)) {
    return "/portal";
  }

  return next;
}
