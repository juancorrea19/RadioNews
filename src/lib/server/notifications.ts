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
