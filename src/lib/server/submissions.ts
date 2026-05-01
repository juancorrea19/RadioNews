export interface DenunciaSubmission {
  nombre: string
  numero: string
  correo: string
  descripcion: string
  ubicacion: string
  autorizaContacto: boolean
  evidencia?: {
    filename: string
    mimeType: string
    size: number
  }
}

export interface RegistroSubmission {
  nombre: string
  correo: string
  telefono: string
  ubicacion: string
  interes: string
  mensaje?: string
  autorizaCorreo: boolean
}

async function postToWebhook(type: 'denuncia' | 'registro', payload: unknown) {
  const webhookUrl = import.meta.env.SUBMISSIONS_WEBHOOK_URL
  const webhookSecret = import.meta.env.SUBMISSIONS_WEBHOOK_SECRET

  if (!webhookUrl) {
    return { stored: false as const, mode: 'disabled' as const }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
    },
    body: JSON.stringify({
      type,
      payload,
      receivedAt: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`No se pudo guardar la informacion en el backend: ${detail}`)
  }

  return { stored: true as const, mode: 'webhook' as const }
}

export async function saveDenunciaSubmission(payload: DenunciaSubmission) {
  return postToWebhook('denuncia', payload)
}

export async function saveRegistroSubmission(payload: RegistroSubmission) {
  return postToWebhook('registro', payload)
}
