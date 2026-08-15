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

Flujo de deploy: push a `main` → Cloudflare Pages rebuild automático (build: `npm run build`, output `dist`).

## Development

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Full documentation: https://docs.astro.build
