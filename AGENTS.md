# Mayprotec — Contexto del Proyecto

**Repositorio**: https://github.com/aldanasoy/mayprotec
**Stack**: Astro + Tailwind
**Propietario**: Arcoso LLC / Sergio Aldana

## Propósito
Sitio web para Mayprotec.

## Convenciones
- Commits en inglés
- Branch main
- Cuenta GitHub: `aldanasoy`

## Orquestación multi-agente

Este proyecto participa en el sistema multi-agente Arcoso (Hermes + OpenCode + Claude Desktop).
**Antes de trabajar:**
1. `git pull` del repo `~/arcoso/orquestacion-arcoso` (o `/opt/data/repo/orquestacion-arcoso` en VPS)
2. Leer `CONTEXT.json` — verificar locks y quién está activo
3. Si hay lock en este proyecto, NO tocarlo
4. Leer `KEEL.md` para contexto global del sistema

## Historial

### Sprint: GTM + GA4 (14-ago-2026)
Container GTM `GTM-TCV97SLJ` (cuenta 6371427711, container 261278316, workspace 2 "Default"). GA4: `G-MGY4Q16N34`.

Publicado (versión 2 "Mayprotec final v2") — **8 tags GA4 Event/Config**:
| Tag | Tipo | Disparo |
|-----|------|---------|
| GA4 - Configuration | googtag | All Pages |
| GA4 - click_to_call | gaawe | Click - tel links |
| GA4 - click_email | gaawe | Click - mailto links |
| GA4 - click_whatsapp | gaawe | Click - WhatsApp links (+ params click_location, click_text) |
| GA4 - form_start | gaawe | Custom Event - form_start (+ form_type) |
| GA4 - form_submit_lead | gaawe | Custom Event - form_complete (+ form_type, lead_servicio) |
| GA4 - modal_open | gaawe | Custom Event - modal_open (+ click_location) |
| GA4 - scroll_depth | gaawe | Scroll Depth 25-50-75-90 (+ percent_scrolled) |

Triggers 4-10 creados; variables DLV (11-14): form_type, click_location, click_text, lead_servicio.
Built-in vars: pageUrl/pageHostname/pagePath/referrer/event + scroll depth (threshold/units) + clicks (text/url/element/classes/id/target).

**En el sitio (src) falta implementar** el `dataLayer.push` para: eventos `form_start`, `form_complete` (con `form_type`, `lead_servicio`), `modal_open` (con `click_location`), y los clicks de tel/mailto/whatsapp usan auto-event — verificar que el push de lead_servicio exista.

**Notas técnicas (para no repetir debugging):**
- `create_version` exige scope `tagmanager.edit.containerversions` (no basta edit.containers). Token re-autorizado con los 4 scopes.
- OAuth redirect URI registrado: `http://localhost` (sin path); usar ese redirect siempre.
- Triggers GTM: `filter`/`customEventFilter` son listas de `Condition` directas (type=operator, arg0/arg1), NO usar `triggerGroup`.
- Custom event triggers requieren `customEventFilter` con `{{_event}}`.
- Los triggers linkClick exigen built-in vars de click (`clickUrl` etc.) o la compilación falla.
- El `compilerError: true` de `create_version` casi siempre viene de variables/flags referenciados inexistentes: revisar built-in variables antes de crear la versión.
- Al publicar vía API: `create_version` crea la versión y la deja en la lista; `versions.publish` devuelve 404 si la versión no compiló limpio.
- Scripts de setup en `scripts/`: `setup-gtm-publish.cjs`, `setup-gtm-triggers.cjs`, `gtm-reauth.cjs` (reautoriza token si faltan scopes).

### Hotfix: Tracking GA4 no reportaba visitas (14-ago-2026)
Causa raíz: `BaseLayout.astro` solo inicializaba `dataLayer`/`gtag()` con `GA_ID = ''` y **nunca cargaba el snippet real de GTM** (`GTM-TCV97SLJ`). El site tenía los IDs vacíos en `src/config/analytics.ts`.

Fix:
- `src/config/analytics.ts`: `gtm.containerId = 'GTM-TCV97SLJ'`, `ga4.measurementId = 'G-MGY4Q16N34'`.
- `BaseLayout.astro`: snippet GTM real en `<head>` (línea ~78) + `<noscript>` iframe, usando `set:html` (los `<script is:inline>` NO interpolan `{}` en Astro).
- `LeadModal.astro`: `pushEvent` al dataLayer → `modal_open` (click_location), `form_start` (form_type, form_location), `form_complete` (form_type, lead_servicio). Triggers del modal etiquetados con `data-modal-location` (hero, header, mobile-menu, footer, whatsapp-float, install-types).
- `ContactForm.astro`: `form_start` + `form_complete` con `form_type: 'contacto_seccion'`.

Pendiente real del negocio: reemplazar placeholders `[WHATSAPP_NUM]` / `[TELEFONO]` en los componentes — hasta que no se reemplace, los clicks `wa.me` apuntan a números ficticios (aunque el trigger GTM los caza igual).

### Sprint: Leads funcionando — Telegram grupal + GestionaLeads (14-ago-2026)
- **Causa raíz de "no llegaban leads"**: el token del bot Managito hardcodeado en `LeadModal.astro`/`ContactForm.astro` estaba **invalidado (401)**. El token real está en `~/.secrets.env` como `TELEGRAM_BOT_TOKEN` (bot id 8690717519, username `ManagitoBot`).
- Nueva config central: `src/config/leads.ts` con `LEADS` (TG_BOT real, TG_CHAT grupal `-5513637048`, GL_TOKEN de GestionaLeads Mayprotec `310c31e7...`, WA_NUMBER placeholder).
- **Gotcha de Astro (importante)**: en `<script>` de componente, Astro **no emite ESM imports en el bundle** → la config quedaba como `LEADS.TG_BOT` sin definir en runtime. Solución: inyectar config vía `<script is:inline set:html>` que define `window.__LEADS_CFG__` ANTES del bundle; el bundle lee `window.__LEADS_CFG__`. Verificado: `dist/index.html` contiene `310c31e7...` y `-5513637048`.
- Grupo Telegram **Mayprotec** (`-5513637048`) creado por Sergio, bot managito miembro (no admin). Verificado sendMessage real (message_id 96). Ajuste "quién puede agregar miembros → Solo administradores" debe hacerse desde la app (el bot no tiene permiso de cambiar invites; sin username público = no encontrable).
- GestionaLeads Mayprotec: token API en `leads.ts`; POST a `https://gestionaleads.es/api/in/{token}/lead/web` desde modal y form de contacto.
- **Botones WhatsApp del sitio ahora abren el modal de captación** (no `wa.me` directo): Hero (`hero-whatsapp`), FAQ (`faq`), ContactForm CTA (`contact-cta`), precios (`precios`), float (ya lo hacía). Solo queda `wa.me` en el step de éxito post-envío (`LeadModal.astro:454` con placeholder WA_NUMBER).
- **Opción "Otra"** agregada al select "Que necesitas instalar" en modal y ContactForm: muestra un campo libre corto (`otra_servicio`, maxlength 60). El valor se envía como `otra: <texto>` a Telegram/GestionaLeads/dataLayer.

Flujo de deploy: push a `main` → Cloudflare Pages rebuild automático (build: `npm run build`, output `dist`).

### Sprint: Servicios SEO + sitemap limpio para GSC (14-ago-2026)
- **Sitemap listo para GSC**: `https://mallas-barranquilla.com/sitemap-index.xml` → `sitemap-0.xml` con **15 URLs indexables**. Filtro agregado en `astro.config.mjs` (`sitemap.filter`) que excluye `/gracias` y `/test-analytics` (ambas con `noindex={true}`; `gracias` ya lo tenía, `test-analytics` ahora lo tiene).
- **Nueva página índice**: `/servicios` (src/pages/servicios.astro) — lista 8 servicios con anclas (a páginas propias o al inicio), schema `BreadcrumbList` + `ItemList`. Agregada al menú Header (después de Inicio) y al Footer (columna Servicios enhorquilló los links nuevos).
- **3 páginas de servicio nuevas** (SEO por keyword + entidades de ciudad Barranquilla/Atlántico/barrios):
  - `/servicios/malla-para-gatos` (src/pages/servicios/malla-para-gatos.astro)
  - `/servicios/malla-para-perros` (src/pages/servicios/malla-para-perros.astro)
  - `/servicios/malla-para-ninos` (src/pages/servicios/malla-para-ninos.astro)
  - Cada una con: H1 keyword, title/desc/canonical propios, `ogImage`, schema `BreadcrumbList` + `Service` (con `hasOfferCatalog` y `areaServed`), texto ancla "Volver al inicio", CTA modal (`data-modal-location="servicio-*"`) y links a `/servicios` y `/`.
  - Fotos Unsplash descargadas a `public/images/`: `malla-gatos.jpg`, `malla-perros.jpg`, `malla-ninos.jpg`.
- **Tarjetas del home** (`src/components/home/InstallTypes.astro`): ahora 9 tarjetas; agregadas gatos/perros/niños. Cada tarjeta tiene `href` + `linkLabel` → texto ancla a su página de servicio si existe, o al inicio (`/#contacto`) si no (el CTA ya NO abre el modal en esta sección).
- Build OK (17 páginas). Rebuild automático en CF Pages tras push.

## Development

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Full documentation: https://docs.astro.build
