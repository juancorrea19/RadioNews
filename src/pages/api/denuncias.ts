import type { APIRoute } from 'astro'
import { saveDenunciaSubmission } from '../../lib/server/submissions'
import { sendNotificationEmail, type EmailAttachment } from '../../lib/server/notifications'

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData()

    const nombre = String(formData.get('nombre') || '').trim()
    const numero = String(formData.get('numero') || '').trim()
    const correo = String(formData.get('correo') || '').trim()
    const descripcion = String(formData.get('descripcion') || '').trim()
    const ubicacion = String(formData.get('ubicacion') || '').trim()
    const autorizaContacto = formData.get('autorizaContacto') === 'on'
    const evidencia = formData.get('evidencia')

    if (!nombre || !numero || !correo || !descripcion || !ubicacion || !autorizaContacto) {
      return response(
        { message: 'Completa todos los campos obligatorios de la denuncia.' },
        400,
      )
    }

    let attachment: EmailAttachment | undefined
    let evidenciaMeta:
      | {
          filename: string
          mimeType: string
          size: number
        }
      | undefined

    if (evidencia instanceof File && evidencia.size > 0) {
      if (evidencia.size > 8 * 1024 * 1024) {
        return response(
          { message: 'La evidencia supera el limite recomendado de 8 MB.' },
          400,
        )
      }

      evidenciaMeta = {
        filename: evidencia.name,
        mimeType: evidencia.type || 'application/octet-stream',
        size: evidencia.size,
      }

      attachment = {
        filename: evidencia.name,
        type: evidencia.type || 'application/octet-stream',
        content: arrayBufferToBase64(await evidencia.arrayBuffer()),
      }
    }

    const submission = {
      nombre,
      numero,
      correo,
      descripcion,
      ubicacion,
      autorizaContacto,
      evidencia: evidenciaMeta,
    }

    const [storageResult, emailResult] = await Promise.allSettled([
      saveDenunciaSubmission(submission),
      sendNotificationEmail({
        subject: `Nueva denuncia de ${nombre}`,
        replyTo: correo,
        attachments: attachment ? [attachment] : undefined,
        html: `
          <h2>Nueva denuncia recibida</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Numero:</strong> ${escapeHtml(numero)}</p>
          <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
          <p><strong>Ubicacion:</strong> ${escapeHtml(ubicacion)}</p>
          <p><strong>Autoriza contacto:</strong> ${autorizaContacto ? 'Si' : 'No'}</p>
          <p><strong>Descripcion:</strong><br />${escapeHtml(descripcion).replaceAll('\n', '<br />')}</p>
          <p><strong>Evidencia:</strong> ${
            evidenciaMeta
              ? `${escapeHtml(evidenciaMeta.filename)} (${evidenciaMeta.size} bytes)`
              : 'No se adjunto archivo'
          }</p>
        `,
      }),
    ])

    if (storageResult.status === 'rejected') {
      console.error('Error guardando denuncia', storageResult.reason)
    }

    if (emailResult.status === 'rejected') {
      console.error('Error enviando correo de denuncia', emailResult.reason)
    }

    return response({
      ok: true,
      message:
        'Recibimos tu denuncia. Si configuraste correo o backend, ya quedo enviada para seguimiento.',
    })
  } catch (error) {
    console.error('Error procesando denuncia', error)
    return response({ message: 'No se pudo procesar la denuncia.' }, 500)
  }
}
