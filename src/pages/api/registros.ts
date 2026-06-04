import type { APIRoute } from "astro";
import { isSupabaseConfigured } from "../../lib/server/supabase";
import { saveRegistroSubmission, type SaveRegistroResult } from "../../lib/server/submissions";
import {
  sendNotificationEmail,
  sendRegistroAcknowledgementEmail,
} from "../../lib/server/notifications";

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
    const correo = String(formData.get("correo") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const ubicacion = String(formData.get("ubicacion") || "").trim();
    const interes = String(formData.get("interes") || "").trim();
    const mensaje = String(formData.get("mensaje") || "").trim();
    const autorizaCorreo = formData.get("autorizaCorreo") === "on";

    if (!nombre || !correo || !telefono || !ubicacion || !interes || !autorizaCorreo) {
      return response({ message: "Completa todos los campos obligatorios del registro." }, 400);
    }

    const submission = {
      nombre,
      correo,
      telefono,
      ubicacion,
      interes,
      mensaje,
      autorizaCorreo,
    };

    let storage: SaveRegistroResult;

    try {
      storage = await saveRegistroSubmission(submission);
    } catch (error) {
      console.error("Error guardando registro en Supabase o webhook", error);
      return response(
        {
          message:
            "No se pudo registrar tu solicitud en este momento. Intenta de nuevo mas tarde o escribenos por otro canal.",
        },
        500,
      );
    }

    if (isSupabaseConfigured() && (!storage.stored || storage.mode !== "supabase")) {
      return response({ message: "No se pudo guardar el registro de forma segura." }, 500);
    }

    const staffEmail = sendNotificationEmail({
      subject: `Nuevo registro de colaboracion: ${nombre}`,
      replyTo: correo,
      html: `
          <h2>Nuevo registro recibido</h2>
          <p><strong>ID (Supabase):</strong> ${storage.stored && storage.mode === "supabase" ? escapeHtml(storage.id) : "N/A"}</p>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
          <p><strong>Telefono:</strong> ${escapeHtml(telefono)}</p>
          <p><strong>Ubicacion:</strong> ${escapeHtml(ubicacion)}</p>
          <p><strong>Interes:</strong> ${escapeHtml(interes)}</p>
          <p><strong>Mensaje:</strong><br />${escapeHtml(mensaje || "Sin mensaje adicional").replaceAll("\n", "<br />")}</p>
        `,
    });

    const ackEmail = sendRegistroAcknowledgementEmail(correo, nombre, interes);

    const [staffResult, ackResult] = await Promise.allSettled([staffEmail, ackEmail]);

    if (staffResult.status === "rejected") {
      console.error("Error enviando correo al equipo (registro)", staffResult.reason);
    }

    if (ackResult.status === "rejected") {
      console.error("Error enviando acuse al colaborador", ackResult.reason);
    }

    const staffDelivered = staffResult.status === "fulfilled" && staffResult.value.delivered;
    const ackDelivered = ackResult.status === "fulfilled" && ackResult.value.delivered;

    let message = "Recibimos tu registro. Quedo en cola para revision del equipo.";
    if (isSupabaseConfigured()) {
      message += " Los datos quedaron archivados en Supabase.";
    }
    if (staffDelivered) {
      message += " Enviamos un resumen al correo interno.";
    }
    if (ackDelivered) {
      message += " Te enviamos un acuse a tu correo.";
    }
    if (!staffDelivered && import.meta.env.RESEND_API_KEY) {
      message += " (Aviso: el correo al equipo no se pudo enviar; revisa RESEND y NOTIFICATION_EMAIL.)";
    }

    return response({
      ok: true,
      message,
    });
  } catch (error) {
    console.error("Error procesando registro", error);
    return response({ message: "No se pudo procesar el registro." }, 500);
  }
};
