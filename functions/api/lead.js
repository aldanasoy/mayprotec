// Webhook server-side para los formularios web (ContactForm.astro y LeadModal.astro).
// Antes estas llamadas a Telegram/GestionaLeads se hacian desde el navegador con
// credenciales embebidas en el JS del cliente (visibles con "ver codigo fuente").
// Ahora el formulario solo envia los datos aqui, y este endpoint usa las
// credenciales como variables de entorno server-side (nunca expuestas al navegador).
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const nombre = String(data.nombre || '').trim();
  const telefono = String(data.telefono || '').trim();
  const email = String(data.email || '').trim();
  const servicio = String(data.servicio || '').trim();
  const zona = String(data.zona || '').trim();
  const mensaje = String(data.mensaje || '').trim();
  const fuente = String(data.fuente || 'mallas-barranquilla.com').trim();

  if (!nombre || !telefono || !servicio) {
    return new Response(JSON.stringify({ error: 'Faltan campos requeridos (nombre, telefono, servicio)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const errors = [];
  const tgToken = env.MAYPROTEC_TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
  const tgChatId = env.MAYPROTEC_TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_ID;
  const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

  // ── Telegram ──
  if (tgToken && tgChatId) {
    const tgMsg = [
      `<b>📞 Nuevo Lead — Mayprotec (Form)</b>`,
      ``,
      `<b>Nombre:</b> ${esc(nombre)}`,
      `<b>WhatsApp:</b> ${esc(telefono)}`,
      email ? `<b>Email:</b> ${esc(email)}` : null,
      `<b>Servicio:</b> ${esc(servicio)}`,
      zona ? `<b>Zona:</b> ${esc(zona)}` : null,
      mensaje ? `<b>Detalles:</b> ${esc(mensaje)}` : null,
      ``,
      `<b>Hora:</b> ${esc(timestamp)}`,
      `<b>Fuente:</b> ${esc(fuente)}`,
    ].filter(Boolean).join('\n');

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: tgMsg, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      if (!tgRes.ok) {
        const tgBody = await tgRes.text().catch(() => '');
        errors.push(`Telegram error: ${tgRes.status} ${tgBody.slice(0, 200)}`);
      }
    } catch (e) {
      errors.push(`Telegram exception: ${e.message}`);
    }
  }

  // ── GestionaLeads ──
  if (env.GL_MAYPROTEC_TOKEN) {
    try {
      const glRes = await fetch(`https://gestionaleads.es/api/in/${env.GL_MAYPROTEC_TOKEN}/lead/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          email,
          fuente,
          notas: `Servicio: ${servicio}. Zona: ${zona}. ${mensaje}`,
        }),
      });
      if (!glRes.ok) {
        const glBody = await glRes.text().catch(() => '');
        errors.push(`GestionaLeads error: ${glRes.status} ${glBody.slice(0, 200)}`);
      }
    } catch (e) {
      errors.push(`GestionaLeads exception: ${e.message}`);
    }
  }

  return new Response(JSON.stringify({ ok: true, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
