export interface EmailAttachment {
  filename: string
  content: string
  type?: string
}

interface SendNotificationEmailInput {
  subject: string
  html: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

function getNotificationRecipient() {
  return (
    import.meta.env.NOTIFICATION_EMAIL ||
    import.meta.env.PUBLIC_CONTACT_EMAIL ||
    'contacto@radionewsonline.com'
  )
}

export async function sendNotificationEmail(input: SendNotificationEmailInput) {
  const apiKey = import.meta.env.RESEND_API_KEY
  const recipient = getNotificationRecipient()
  const from = import.meta.env.EMAIL_FROM || 'Radio News Online <onboarding@resend.dev>'

  if (!apiKey) {
    return { delivered: false as const, reason: 'missing_resend_api_key' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo ? [input.replyTo] : undefined,
      attachments: input.attachments,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`No se pudo enviar el correo: ${detail}`)
  }

  return { delivered: true as const }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendDenunciaAcknowledgementEmail(to: string, nombre: string) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.EMAIL_FROM || "Radio News Online <onboarding@resend.dev>";

  if (!apiKey) {
    return { delivered: false as const, reason: "missing_resend_api_key" as const };
  }

  const safeName = escapeHtml(nombre.trim() || "Usuario");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to.trim()],
      subject: "Recibimos tu denuncia | Radio News Online",
      html: `
        <p>Hola ${safeName},</p>
        <p>Gracias por comunicarte con <strong>Radio News Online</strong>. Tu denuncia fue recibida y quedara en manos del equipo para revision.</p>
        <p>Si dejaste datos de contacto y autorizaste comunicacion, podremos escribirte cuando haya novedades.</p>
        <p style="color:#555;font-size:13px;margin-top:24px;">Este es un mensaje automatico; no respondas directamente a este correo si no esperabas este aviso.</p>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`No se pudo enviar el acuse de recibo: ${detail}`);
  }

  return { delivered: true as const };
}

export async function sendRegistroAcknowledgementEmail(to: string, nombre: string, interes: string) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.EMAIL_FROM || "Radio News Online <onboarding@resend.dev>";

  if (!apiKey) {
    return { delivered: false as const, reason: "missing_resend_api_key" as const };
  }

  const safeName = escapeHtml(nombre.trim() || "Usuario");
  const safeInteres = escapeHtml(interes.trim() || "—");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to.trim()],
      subject: "Recibimos tu registro | Radio News Online",
      html: `
        <p>Hola ${safeName},</p>
        <p>Gracias por tu interes en colaborar con <strong>Radio News Online</strong>. Registramos tu solicitud con el area de interes: <strong>${safeInteres}</strong>.</p>
        <p>Si autorizaste contacto por correo, el equipo podra escribirte cuando haya una oportunidad alineada con tu perfil.</p>
        <p style="color:#555;font-size:13px;margin-top:24px;">Este es un mensaje automatico.</p>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`No se pudo enviar el acuse de registro: ${detail}`);
  }

  return { delivered: true as const };
}
