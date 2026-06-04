import { slugify } from "./news-admin";
import { createSupabaseAdminClient } from "./supabase";

const TABLE = "denuncias";
export const DENUNCIAS_EVIDENCE_BUCKET = "denuncias-evidence";

export interface DenunciaSubmission {
  nombre: string;
  numero: string;
  correo: string;
  descripcion: string;
  ubicacion: string;
  autorizaContacto: boolean;
  evidencia?: {
    filename: string;
    mimeType: string;
    size: number;
  };
}

export interface DenunciaRecord {
  id: string;
  nombre: string;
  numero: string;
  correo: string;
  descripcion: string;
  ubicacion: string;
  autoriza_contacto: boolean;
  evidence_path: string | null;
  evidence_filename: string | null;
  evidence_mime: string | null;
  evidence_size: number | null;
  created_at: string;
}

function getAdmin() {
  return createSupabaseAdminClient();
}

export async function insertDenunciaInSupabase(input: {
  nombre: string;
  numero: string;
  correo: string;
  descripcion: string;
  ubicacion: string;
  autorizaContacto: boolean;
  evidence?: { buffer: ArrayBuffer; filename: string; mimeType: string } | null;
}): Promise<{ id: string }> {
  const supabase = getAdmin();
  const id = crypto.randomUUID();

  let evidence_path: string | null = null;
  let evidence_filename: string | null = null;
  let evidence_mime: string | null = null;
  let evidence_size: number | null = null;

  const ev = input.evidence;
  if (ev && ev.buffer.byteLength > 0) {
    const base = slugify(ev.filename.replace(/\.[^/.]+$/, "")) || "evidencia";
    const extension = ev.filename.includes(".") ? ev.filename.split(".").pop()?.toLowerCase() : "bin";
    const safeExt = extension && /^[a-z0-9]{1,8}$/.test(extension) ? extension : "bin";
    evidence_path = `${id}/${base}.${safeExt}`;
    evidence_filename = ev.filename;
    evidence_mime = ev.mimeType || "application/octet-stream";
    const body = new Uint8Array(ev.buffer);
    evidence_size = body.byteLength;

    const { error: uploadError } = await supabase.storage
      .from(DENUNCIAS_EVIDENCE_BUCKET)
      .upload(evidence_path, body, {
        contentType: evidence_mime,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }
  }

  const { error: insertError } = await supabase.from(TABLE).insert({
    id,
    nombre: input.nombre,
    numero: input.numero,
    correo: input.correo,
    descripcion: input.descripcion,
    ubicacion: input.ubicacion,
    autoriza_contacto: input.autorizaContacto,
    evidence_path,
    evidence_filename,
    evidence_mime,
    evidence_size,
  });

  if (insertError) {
    if (evidence_path) {
      await supabase.storage.from(DENUNCIAS_EVIDENCE_BUCKET).remove([evidence_path]);
    }
    throw insertError;
  }

  return { id };
}

export async function listDenunciasForAdmin(): Promise<DenunciaRecord[]> {
  const supabase = getAdmin();
  const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false }).limit(200);

  if (error) {
    throw error;
  }

  return (data ?? []) as DenunciaRecord[];
}

export async function getDenunciaById(id: string): Promise<DenunciaRecord | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();

  if (error) {
    throw error;
  }

  return data as DenunciaRecord | null;
}

export async function createEvidenceSignedUrl(path: string, expiresInSeconds = 120) {
  const supabase = getAdmin();
  const { data, error } = await supabase.storage
    .from(DENUNCIAS_EVIDENCE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function canUseSupabaseForDenuncias() {
  return isSupabaseConfigured();
}
