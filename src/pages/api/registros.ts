import type { APIRoute } from 'astro'
import { saveRegistroSubmission } from '../../lib/server/submissions'
import { sendNotificationEmail } from '../../lib/server/notifications'

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

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData()

    const nombre = String(formData.get('nombre') || '').trim()
    const correo = String(formData.get('correo') || '').trim()
    const telefono = String(formData.get('telefono') || '').trim()
    const ubicacion = String(formData.get('ubicacion') || '').trim()
    const interes = String(formData.get('interes') || '').trim()
    const mensaje = String(formData.get('mensaje') || '').trim()
    const autorizaCorreo = formData.get('autorizaCorreo') === 'on'

    if (!nombre || !correo || !telefono || !ubicacion || !interes || !autorizaCorreo) {
      return response(
        { message: 'Completa todos los campos obligatorios del registro.' },
        400,
      )
    }

    const submission = {
      nombre,
      correo,
      telefono,
      ubicacion,
      interes,
      mensaje,
      autorizaCorreo,
    }

    const [storageResult, emailResult] = await Promise.allSettled([
      saveRegistroSubmission(submission),
      sendNotificationEmail({
        subject: `Nuevo registro de colaboracion: ${nombre}`,
        replyTo: correo,
        html: `
          <h2>Nuevo registro recibido</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
          <p><strong>Telefono:</strong> ${escapeHtml(telefono)}</p>
          <p><strong>Ubicacion:</strong> ${escapeHtml(ubicacion)}</p>
          <p><strong>Interes:</strong> ${escapeHtml(interes)}</p>
          <p><strong>Mensaje:</strong><br />${escapeHtml(mensaje || 'Sin mensaje adicional').replaceAll('\n', '<br />')}</p>
        `,
      }),
    ])

    if (storageResult.status === 'rejected') {
      console.error('Error guardando registro', storageResult.reason)
    }

    if (emailResult.status === 'rejected') {
      console.error('Error enviando correo de registro', emailResult.reason)
    }

    return response({
      ok: true,
      message:
        'Tu registro fue recibido. Si ya configuraste correo o persistencia, tambien quedo enviado al equipo.',
    })
  } catch (error) {
    console.error('Error procesando registro', error)
    return response({ message: 'No se pudo procesar el registro.' }, 500)
  }
}
