// Webhook post-call para el agente Retell "Mallas Colombia" (linea nacional, +57 300 913 3684).
// Adaptado del patron probado en kargusmoving-web/functions/api/retell-webhook.js.
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Retell v1 pone los campos en el nivel raiz; v2 los anida bajo body.call
  const callObj = body?.call || {};
  const event = body?.event;
  const call_id = body?.call_id || callObj.call_id;
  const call_analysis = body?.call_analysis || callObj.call_analysis;
  const from_number = body?.from_number || callObj.from_number || '';

  console.log('[retell-webhook] event:', event, 'call_id:', call_id, 'from:', from_number);

  const tgToken = env.MAYPROTEC_TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
  const tgChatId = env.MAYPROTEC_TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_ID;

  // ── call_started: aviso inmediato de llamada entrante ──
  if (event === 'call_started') {
    if (tgToken && tgChatId) {
      const callerDisplay = fmtPhone(from_number) || from_number || 'Desconocido';
      const msg = [
        `<b>📞 Llamada entrante — Mallas Colombia</b>`,
        ``,
        `<b>Desde:</b> ${esc(callerDisplay)}`,
        `<b>Call ID:</b> <code>${esc(call_id || 'unknown')}</code>`,
      ].join('\n');
      await sendTelegram(tgToken, tgChatId, msg);
    }
    return new Response(JSON.stringify({ ok: true, event: 'call_started' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── call_analyzed, o call_ended con analysis: procesar datos capturados ──
  const isCallAnalyzed = event === 'call_analyzed';
  const isCallEndedWithAnalysis = event === 'call_ended' && call_analysis;

  if (!isCallAnalyzed && !isCallEndedWithAnalysis) {
    console.log('[retell-webhook] skipping event:', event);
    return new Response(JSON.stringify({ ok: true, skipped: true, event }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const analysis = call_analysis || {};
  const c = analysis.custom_analysis_data || {};
  const callSummary = analysis.call_summary || '';
  const durationMs = analysis.call_duration_ms || analysis.duration_ms || 0;
  const duration = formatDuration(durationMs);

  // ── Filtro de spam 1: la LLM marco la llamada como spam ──
  if (c.is_spam === true) {
    console.log('[retell-webhook] skipping spam call (is_spam=true):', { call_id, from_number });
    return new Response(JSON.stringify({ ok: true, skipped: 'spam' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Filtro de spam 2: llamada muy corta sin ningun dato util ──
  const hasUsefulData = !!(c.nombre || c.ciudad || c.servicio || c.email || c.phone);
  if (durationMs > 0 && durationMs < 15000 && !hasUsefulData) {
    console.log('[retell-webhook] skipping short no-data call:', { call_id, from_number, durationMs });
    return new Response(JSON.stringify({ ok: true, skipped: 'short_no_data' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const callerPhone = c.phone || from_number || '';

  const leadData = {
    session_id: call_id,
    call_summary: callSummary,
    nombre: c.nombre || '',
    ciudad: c.ciudad || '',
    servicio: c.servicio || '',
    resumen: c.resumen || callSummary,
    phone: callerPhone,
    email: c.email || '',
    urgency: c.urgency || '',
    heard_from: c.heard_from || '',
    raw_payload: body,
    source: 'phone-mallas-colombia',
  };

  const hasData = !!(leadData.nombre || leadData.ciudad || leadData.servicio || leadData.resumen || leadData.email);

  const errors = [];

  // ── GestionaLeads ──
  if (env.GL_MAYPROTEC_TOKEN) {
    try {
      const glRes = await fetch(`https://gestionaleads.es/api/in/${env.GL_MAYPROTEC_TOKEN}/lead/retell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!glRes.ok) {
        const glBody = await glRes.text().catch(() => '');
        errors.push(`GestionaLeads error: ${glRes.status} ${glBody.slice(0, 200)}`);
      }
    } catch (e) {
      errors.push(`GestionaLeads exception: ${e.message}`);
    }
  }

  // ── Telegram: mensaje detallado (con datos) o aviso de datos faltantes ──
  if (tgToken && tgChatId) {
    let msg;
    if (hasData) {
      msg = [
        `<b>📞 Nuevo Lead — Mallas Colombia</b>`,
        ``,
        nz(leadData.nombre) ? `<b>Nombre:</b> ${esc(leadData.nombre)}` : null,
        nz(leadData.ciudad) ? `<b>Ciudad:</b> ${esc(leadData.ciudad)}` : null,
        nz(leadData.phone) ? `<b>Teléfono:</b> ${fmtPhone(leadData.phone)}` : null,
        nz(leadData.email) ? `<b>Email:</b> ${esc(leadData.email)}` : null,
        nz(leadData.servicio) ? `<b>Servicio:</b> ${esc(leadData.servicio)}` : null,
        nz(leadData.urgency) ? `<b>Urgencia:</b> ${esc(leadData.urgency)}` : null,
        nz(leadData.heard_from) ? `<b>Se enteró por:</b> ${esc(leadData.heard_from)}` : null,
        duration ? `\n<b>Duración:</b> ${duration}` : null,
        nz(leadData.resumen) ? `\n<b>Resumen:</b>\n${esc(leadData.resumen)}` : null,
      ].filter(Boolean).join('\n');
    } else {
      msg = [
        `<b>⚠️ Llamada sin datos — Mallas Colombia</b>`,
        ``,
        nz(leadData.phone) ? `<b>Teléfono:</b> ${fmtPhone(leadData.phone)}` : null,
        duration ? `<b>Duración:</b> ${duration}` : null,
        `\nLa llamada terminó pero el cliente no dejó datos de contacto.`,
      ].filter(Boolean).join('\n');
    }

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: msg,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      if (!tgRes.ok) {
        const tgBody = await tgRes.text().catch(() => '');
        errors.push(`Telegram error: ${tgRes.status} ${tgBody.slice(0, 200)}`);
      }
    } catch (e) {
      errors.push(`Telegram exception: ${e.message}`);
    }
  }

  return new Response(JSON.stringify({ ok: true, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendTelegram(token, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch (_) {}
}

function nz(v) {
  return v && v.trim && v.trim();
}

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtPhone(phone) {
  if (!phone || !phone.trim()) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length >= 11) return `+${d}`;
  return phone;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min} min ${sec}s`;
  return `${sec}s`;
}
