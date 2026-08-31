import { randomUUID } from "crypto";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { detectPhotoType } from "@/lib/uploads/photo";

export async function storeGeneratedCardSvg(memberId: string, svg: string) {
  if (!(env.dataBackend === "supabase" && isSupabaseConfigured())) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  const path = `cards/${memberId}/${randomUUID()}.svg`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(env.supabaseCardsBucket).upload(path, Buffer.from(svg), {
    contentType: "image/svg+xml",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function storeCommunityLogo(communityCode: string, file: File) {
  const allowedTypes = ["image/png", "image/jpeg"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Community logo must be PNG or JPG.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Community logo must be 2 MB or smaller.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedType = detectPhotoType(bytes);
  if (!detectedType || detectedType !== file.type) {
    throw new Error("Community logo content does not match its declared PNG or JPG type.");
  }

  const extension = file.type === "image/png" ? "png" : "jpg";
  const path = `communities/${communityCode.toLowerCase()}/logo-${randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(env.supabaseCommunityAssetsBucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(env.supabaseCommunityAssetsBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createSignedStorageUrl(bucket: string, pathOrDataUrl?: string, expiresInSeconds = 3600) {
  if (!pathOrDataUrl || pathOrDataUrl.startsWith("data:") || pathOrDataUrl.startsWith("http")) {
    return pathOrDataUrl;
  }

  if (!(env.dataBackend === "supabase" && isSupabaseConfigured())) {
    return pathOrDataUrl;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pathOrDataUrl, expiresInSeconds);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function createStorageDataUrl(bucket: string, pathOrDataUrl?: string) {
  if (!pathOrDataUrl || pathOrDataUrl.startsWith("data:")) {
    return pathOrDataUrl;
  }

  if (pathOrDataUrl.startsWith("http")) {
    return pathOrDataUrl;
  }

  if (!(env.dataBackend === "supabase" && isSupabaseConfigured())) {
    return pathOrDataUrl;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(pathOrDataUrl);

  if (error) {
    throw new Error(error.message);
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || contentTypeFromPath(pathOrDataUrl);

  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

function contentTypeFromPath(path: string) {
  if (path.toLowerCase().endsWith(".png")) {
    return "image/png";
  }

  if (path.toLowerCase().endsWith(".svg")) {
    return "image/svg+xml";
  }

  return "image/jpeg";
}
