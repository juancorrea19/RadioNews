import type { APIRoute } from "astro";
import { isSupabaseConfigured } from "../../lib/server/supabase";
import { saveDenunciaSubmission, type SaveDenunciaResult } from "../../lib/server/submissions";
import {
  sendDenunciaAcknowledgementEmail,
  sendNotificationEmail,
} from "../../lib/server/notifications";
import { DENUNCIA_EVIDENCE_MAX_BYTES } from "../../lib/upload-limits";

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const nombre = String(formData.get("nombre") || "").trim();
    const numero = String(formData.get("numero") || "").trim();
    const correo = String(formData.get("correo") || "").trim();
    const descripcion = String(formData.get("descripcion") || "").trim();
    const ubicacion = String(formData.get("ubicacion") || "").trim();
    const autorizaContacto = formData.get("autorizaContacto") === "on";
    const evidencePath = String(formData.get("evidencePath") || "").trim();
    const evidenceFilename = String(formData.get("evidenceFilename") || "").trim();
    const evidenceMime = String(formData.get("evidenceMime") || "").trim();
    const evidenceSizeRaw = String(formData.get("evidenceSize") || "").trim();
    const evidenceSize = Number.parseInt(evidenceSizeRaw, 10);

    if (!nombre || !numero || !correo || !descripcion || !ubicacion || !autorizaContacto) {
      return response({ message: "Completa todos los campos obligatorios de la denuncia." }, 400);
    }

    let evidenciaMeta:
      | {
          filename: string;
          mimeType: string;
          size: number;
        }
      | undefined;

    let preUploadedEvidence:
      | {
          path: string;
          filename: string;
          mimeType: string;
          size: number;
        }
      | null = null;

    if (evidencePath) {
      if (!Number.isFinite(evidenceSize) || evidenceSize <= 0 || evidenceSize > DENUNCIA_EVIDENCE_MAX_BYTES) {
        return response({ message: "La evidencia supera el limite recomendado de 8 MB." }, 400);
      }

      evidenciaMeta = {
        filename: evidenceFilename || "evidencia",
        mimeType: evidenceMime || "application/octet-stream",
        size: evidenceSize,
      };

      preUploadedEvidence = {
        path: evidencePath,
        filename: evidenciaMeta.filename,
        mimeType: evidenciaMeta.mimeType,
        size: evidenciaMeta.size,
      };
    }

    const submission = {
      nombre,
      numero,
      correo,
      descripcion,
      ubicacion,
      autorizaContacto,
      evidencia: evidenciaMeta,
    };

    let storage: SaveDenunciaResult;

    try {
      storage = await saveDenunciaSubmission(submission, {
        preUploadedEvidence,
      });
    } catch (error) {
      console.error("Error guardando denuncia en Supabase o webhook", error);
      return response(
        {
          message:
            "No se pudo registrar la denuncia en este momento. Intenta de nuevo mas tarde o escribenos por otro canal.",
        },
        500,
      );
    }

    if (isSupabaseConfigured() && (!storage.stored || storage.mode !== "supabase")) {
      return response({ message: "No se pudo guardar la denuncia de forma segura." }, 500);
    }

    const staffEmail = sendNotificationEmail({
      subject: `Nueva denuncia de ${nombre}`,
      replyTo: correo,
      html: `
          <h2>Nueva denuncia recibida</h2>
          <p><strong>ID (Supabase):</strong> ${storage.stored && storage.mode === "supabase" ? escapeHtml(storage.id) : "N/A"}</p>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Numero:</strong> ${escapeHtml(numero)}</p>
          <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
          <p><strong>Ubicacion:</strong> ${escapeHtml(ubicacion)}</p>
          <p><strong>Autoriza contacto:</strong> ${autorizaContacto ? "Si" : "No"}</p>
          <p><strong>Descripcion:</strong><br />${escapeHtml(descripcion).replaceAll("\n", "<br />")}</p>
          <p><strong>Evidencia:</strong> ${
            evidenciaMeta
              ? `${escapeHtml(evidenciaMeta.filename)} (${evidenciaMeta.size} bytes) — archivada en Storage (revisa el panel admin para descargar).`
              : "No se adjunto archivo"
          }</p>
        `,
    });

    const ackEmail = sendDenunciaAcknowledgementEmail(correo, nombre);

    const [staffResult, ackResult] = await Promise.allSettled([staffEmail, ackEmail]);

    if (staffResult.status === "rejected") {
      console.error("Error enviando correo al equipo", staffResult.reason);
    }

    if (ackResult.status === "rejected") {
      console.error("Error enviando acuse al ciudadano", ackResult.reason);
    }

    const staffDelivered = staffResult.status === "fulfilled" && staffResult.value.delivered;
    const ackDelivered = ackResult.status === "fulfilled" && ackResult.value.delivered;

    let message = "Recibimos tu denuncia. Quedo registrada para revision del equipo.";
    if (isSupabaseConfigured()) {
      message += " La evidencia y los datos quedaron archivados de forma segura.";
    }
    if (staffDelivered) {
      message += " Tambien enviamos un resumen al correo interno.";
    }
    if (ackDelivered) {
      message += " Te enviamos un acuse de recibo a tu correo.";
    }
    if (!staffDelivered && import.meta.env.RESEND_API_KEY) {
      message += " (Aviso: el correo al equipo no se pudo enviar; revisa RESEND y NOTIFICATION_EMAIL.)";
    }

    return response({
      ok: true,
      message,
    });
  } catch (error) {
    console.error("Error procesando denuncia", error);
    return response({ message: "No se pudo procesar la denuncia." }, 500);
  }
};
