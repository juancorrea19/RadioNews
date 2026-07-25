import { slugify } from "./news-admin";
import { createSupabaseAdminClient, isSupabaseConfigured } from "./supabase";
import {
  type UploadPurpose,
  fileExtension,
  resolveContentType,
  validateUploadMeta,
} from "../upload-limits";

const NEWS_BUCKET = "news-images";
const SITE_MEDIA_BUCKET = "site-media";
const DENUNCIAS_EVIDENCE_BUCKET = "denuncias-evidence";

function getAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no esta configurado todavia.");
  }
  return createSupabaseAdminClient();
}

function bucketForPurpose(purpose: UploadPurpose): string {
  switch (purpose) {
    case "news-image":
    case "news-video":
      return NEWS_BUCKET;
    case "flash":
    case "ads":
      return SITE_MEDIA_BUCKET;
    case "denuncia-evidence":
      return DENUNCIAS_EVIDENCE_BUCKET;
  }
}

function buildObjectPath(purpose: UploadPurpose, filename: string): string {
  const base = slugify(filename.replace(/\.[^/.]+$/, "")) || "archivo";
  const ext = fileExtension(filename) || (purpose === "news-video" ? "mp4" : "jpg");
  const stamp = Date.now();

  switch (purpose) {
    case "news-image":
      return `covers/${stamp}-${base}.${ext}`;
    case "news-video":
      return `videos/${stamp}-${base}.${ext}`;
    case "flash":
      return `flash/${stamp}-${base}.${ext}`;
    case "ads":
      return `ads/${stamp}-${base}.${ext}`;
    case "denuncia-evidence": {
      const id = crypto.randomUUID();
      const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
      return `${id}/${base}.${safeExt}`;
    }
  }
}

export async function createSignedMediaUpload(input: {
  purpose: UploadPurpose;
  filename: string;
  contentType: string;
  sizeBytes: number;
}) {
  const validation = validateUploadMeta(input);
  if (!validation.ok) {
    return { ok: false as const, message: validation.message };
  }

  const contentType = resolveContentType(input.purpose, input.filename, input.contentType);
  const bucket = bucketForPurpose(input.purpose);
  const path = buildObjectPath(input.purpose, input.filename);
  const supabase = getAdminClient();

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

  if (error || !data) {
    console.error("Error creando URL firmada de subida", error);
    return { ok: false as const, message: "No se pudo preparar la subida. Intenta de nuevo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    ok: true as const,
    bucket,
    path,
    publicUrl,
    token: data.token,
    signedUrl: data.signedUrl,
    contentType,
  };
}

export async function removeStorageObject(bucket: string, path?: string | null) {
  if (!path) return;
  const supabase = getAdminClient();
  await supabase.storage.from(bucket).remove([path]);
}
