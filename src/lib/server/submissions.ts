import { insertDenunciaInSupabase, type DenunciaSubmission } from "./denuncias";
import { insertRegistroColaborador } from "./registro-colaboradores";
import { isSupabaseConfigured } from "./supabase";

export type { DenunciaSubmission } from "./denuncias";

export interface RegistroSubmission {
  nombre: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  interes: string;
  mensaje?: string;
  autorizaCorreo: boolean;
}

export type SaveDenunciaResult =
  | { stored: true; mode: "supabase"; id: string }
  | { stored: true; mode: "webhook" }
  | { stored: false; mode: "disabled" };

async function postToWebhook(type: "denuncia" | "registro", payload: unknown) {
  const webhookUrl = import.meta.env.SUBMISSIONS_WEBHOOK_URL;
  const webhookSecret = import.meta.env.SUBMISSIONS_WEBHOOK_SECRET;

  if (!webhookUrl) {
    return { stored: false as const, mode: "disabled" as const };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
    },
    body: JSON.stringify({
      type,
      payload,
      receivedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`No se pudo guardar la informacion en el backend: ${detail}`);
  }

  return { stored: true as const, mode: "webhook" as const };
}

export async function saveDenunciaSubmission(
  payload: DenunciaSubmission,
  options?: {
    evidence?: { buffer: ArrayBuffer; filename: string; mimeType: string } | null;
  },
): Promise<SaveDenunciaResult> {
  if (isSupabaseConfigured()) {
    const { id } = await insertDenunciaInSupabase({
      nombre: payload.nombre,
      numero: payload.numero,
      correo: payload.correo,
      descripcion: payload.descripcion,
      ubicacion: payload.ubicacion,
      autorizaContacto: payload.autorizaContacto,
      evidence: options?.evidence && options.evidence.buffer.byteLength > 0 ? options.evidence : null,
    });

    return { stored: true, mode: "supabase", id };
  }

  const webhook = await postToWebhook("denuncia", payload);

  if (webhook.stored) {
    return { stored: true, mode: "webhook" };
  }

  return { stored: false, mode: "disabled" };
}

export type SaveRegistroResult =
  | { stored: true; mode: "supabase"; id: string }
  | { stored: true; mode: "webhook" }
  | { stored: false; mode: "disabled" };

export async function saveRegistroSubmission(payload: RegistroSubmission): Promise<SaveRegistroResult> {
  if (isSupabaseConfigured()) {
    const { id } = await insertRegistroColaborador({
      nombre: payload.nombre,
      correo: payload.correo,
      telefono: payload.telefono,
      ubicacion: payload.ubicacion,
      interes: payload.interes,
      mensaje: payload.mensaje,
      autorizaCorreo: payload.autorizaCorreo,
    });

    return { stored: true, mode: "supabase", id };
  }

  const webhook = await postToWebhook("registro", payload);

  if (webhook.stored) {
    return { stored: true, mode: "webhook" };
  }

  return { stored: false, mode: "disabled" };
}
