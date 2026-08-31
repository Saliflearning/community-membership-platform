import { randomUUID } from "crypto";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { allowedPhotoTypes, detectPhotoType, maxStoredPhotoBytes } from "@/lib/uploads/photo";

export async function validateAndStoreMemberPhoto(file: File): Promise<string> {
  if (!allowedPhotoTypes.includes(file.type as (typeof allowedPhotoTypes)[number])) {
    throw new Error("Member photo must be JPG or PNG.");
  }

  if (file.size > maxStoredPhotoBytes) {
    throw new Error("Member photo must be compressed to 1.5 MB or smaller before upload.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedType = detectPhotoType(bytes);

  if (!detectedType || detectedType !== file.type) {
    throw new Error("Member photo content does not match its declared JPG or PNG type.");
  }

  if (env.dataBackend === "supabase" && isSupabaseConfigured()) {
    const extension = file.type === "image/png" ? "png" : "jpg";
    const path = `members/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(env.supabaseMemberPhotosBucket).upload(path, bytes, {
      contentType: file.type,
      upsert: false
    });

    if (error) {
      throw new Error(error.message);
    }

    return path;
  }

  return `data:${file.type};base64,${bytes.toString("base64")}`;
}
