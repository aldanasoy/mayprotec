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

### Sprint: Validación auditoría UX/UI externa + CLS/typography fixes (30-ago-2026, OpenCode)
Revisión cruzada de la auditoría UI/UX de Mayprotec contra el código real (local + prod). La mayoría de "hallazgos" ya estaban corregidos en el sprint UI/UX P0+P1 del mismo día (ver arriba). **La auditoría tenía errores factuales**: (a) el logo NUNCA estuvo roto — es un componente `Logo.astro` con wordmark SVG vectorial; el "corte" en móvil era el estado previo al sprint de la mañana; (b) el footer es `bg-brand-dark` con logo claro (no tarjeta blanca); (c) no hay overflow-x ni 9 tarjetas (son 6, agrupadas por espacio/necesidad desde P1).

**Correcciones reales aplicadas** (commit `23f5378` + merge `b307644`):
- `Hero.astro`: `width/height` 1024×1024 → 1600×1200 (4:3 real, arregla CLS).
- `Hero.astro`: "Maria T." → "María T." (tilde, 2 instancias responsive).
- `WhyUs.astro`: `width/height` 600×450 → 800×600 (4:3).
- `Gallery.astro`: `width/height` 400×400 → 800×800 (1:1).
- Verificado `index.astro`: orden de secciones ya correcto (Hero→Benefits→InstallTypes→Gallery→WhyUs→Process→Testimonials→FAQ→InstalacionSeguridad→ContactForm) — coincide con la recomendación de la auditoría.
- Header móvil: verificado que cabe (272px disponibles vs 180px logo) — no había bug real, era el estado antiguo de prod.

**Pospuesto — imágenes IA**: regeneración de las 14-15 fotos (hero, espacios, necesidad, galería, equipo, proceso) para RnR queda pendiente. Bloqueada por falta de credenciales de generación de imágenes: Gemini free quota agotada del día, OpenRouter sin créditos, gpt-image-* en opencode-go requiere OPENAI_API_KEY real (no la de OpenRouter). Las fotos actuales siguen siendo stock de Unsplash. **Para reanudar**: agregar `GEMINI_API_KEY` con billing o `OPENAI_API_KEY` real a `~/.secrets.env`, y generar con el script documentado en el plan (prompts: "professional real estate photography, modern balcony in Barranquilla, white polypropylene safety net as protagonist, 4:3" etc).

### Sprint: UI/UX P0 + P1 (30-ago-2026) — logo, responsive, home
Diagnóstico UI/UX externo → ejecución por prioridad. Commits: `248ad24` (P0), `0e630c3` (logo vector), `1872901` (P1 home), `e8fd4b1` (P1 gallery).

**Bug sistémico corregido**: el `@theme` de `global.css` NO definía `--color-brand-primary` ni `--color-ink-DEFAULT` pero el código los usaba profusamente (`bg-brand-primary`, `text-brand-primary`, `bg-ink-DEFAULT`). En Tailwind v4 esas clases no generaban nada → muchas secciones (footer, Benefits, botones) se renderizaban **sin fondo/invisible**. Fix: agregar ambos tokens al `@theme` + cambiar footer a `bg-brand-dark` (verde oscuro). Verificar siempre computed background en navegador.

**Logo**: el enfoque correcto es wordmark como **paths vectoriales** (fonts→fontTools→svg). El `<text>` SVG dependía de que Manrope cargara dentro del SVG → se rompía en varios dispositivos. Convertí "Mayprotec"/"BARRANQUILLA" a `<path>` (Manrope 800 instanced) en `Logo.astro`. Método reproducible: `fontTools.varLib.instancer(instantiateVariableFont, {wght:800})` + `SVGPathPen`. OJO: en fontTools >=4.63 `glyf[g].draw(pen, glyfTable=glyf)` (API nueva).

**Responsive**: verificado con **Playwright local** (`/opt/data/.cache/ms-playwright/chromium-1228`, chrome --no-sandbox) en viewports 320-1440px. Criterio `document.documentElement.scrollWidth === innerWidth` en todos. Requisito: preview Astro + navegador Chromium real (no browserbase).

**Tailwind gotcha crítico**: NO mezclar `hidden` (display base) con `inline-flex`/`flex` (display base) en el mismo elemento — en v4 el orden CSS hace ganar a `flex`. Para "oculto en móvil, flex en desktop" envolver en `<div class="hidden lg:block">` / `<div class="lg:hidden">`. Verificado por `getComputedStyle().display`.

**P0 (commit 248ad24)**: Logo unificado (reutilizado header/drawer/footer), header 64-72px + drawer móvil 44px con scroll-lock/cerrar fuera/Escape/CTA, hero 48/52 con foto 4:3 overflow-hidden + object-position, testimonio como tarjeta en flow en móvil, sin `<br>` forzados, footer verde oscuro AA.
**P1 (1872901, e8fd4b1)**: Benefits→barra confianza 4 cols, InstallTypes→6 cards agrupadas (ServiceCard.astro), WhyUs→4 diferenciales + título corregido, index→servicios arriba, Gallery→metadata por trabajo (tipo/barrio/espacio/necesidad).
**P2 pendiente**: lightbox galería, filtros galería, normalización global de CTA, formulario con foto, refinamiento tokens/espaciado, accesibilidad completa, WhatsAppFloat ajustes, footer frase SEO.



### Sprint: Canonicalización de dominio en CF (14-ago-2026, post-deploy)
GSC no debe ver http/https/www/sin-www como páginas distintas. Estado final verificado en prod:
- `http://mallas-barranquilla.com` → 301 → `https://mallas-barranquilla.com` (1 hop, via Always Use HTTPS)
- `http://www.mallas-barranquilla.com` → 301 → `https://mallas-barranquilla.com` (1 hop)
- `https://www.mallas-barranquilla.com` → 301 → `https://mallas-barranquilla.com` (1 hop, path+query preservados)
- `https://mallas-barranquilla.com` → 200 directo (0 hops)

**Fix aplicado en Cloudflare (no fue cambio de código):** antes `http://www` hacía 2 hops (http→https por Always Use HTTPS, luego www→apex por `_redirects`). Se creó **Redirect Rule** en fase `http_request_dynamic_redirect` (zone `837e476...`): `http.host eq "www.mallas-barranquilla.com"` → 301 a `https://mallas-barranquilla.com` con `concat("https://mallas-barranquilla.com", http.request.uri.path)` + `preserve_query_string: true`. Así www cae en 1 solo salto directo al apex. La regla www→apex en `public/_redirects` queda como redundante (CF gana por orden de fases).

### Sprint: Sitemap lastmod + Cache/Perf Cloudflare para GSC (14-ago-2026)
Contexto: GSC (propiedad Dominio `sc-domain:mallas-barranquilla.com` verificado vía DNS) lee `sitemap-index.xml` (15 URLs) pero reporta **0 páginas descubiertas** — estado esperado en sitio nuevo; sitemap OK, server OK, la cura es tiempo + "Solicitar indexación" desde GSC UI (API GSC = 403 desde este entorno).

Cambios de código (commit `d6e4f0c`):
- **`astro.config.mjs`**: `sitemap({ ..., lastmod: new Date('2026-08-14') })` → `<lastmod>` en las 15 URLs + el index.
- **`public/_headers`**: edge-cache para HTML (`Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`), sitemaps (`/sitemap-*.xml`, max-age=3600), y reglas nuevas para png/jpg/jpeg/avif/gif (30d + SWR) y `*.txt`. `/_assets/*` immutable 1y (ya estaba).
- **`public/_redirects`**: `/sitemap.xml → /sitemap-index.xml 301` (antes `/sitemap.xml` devolvía **200 text/html** por fallback SPA — causa probable si se envió ese path a GSC).

Cloudflare (zona `837e476d2efb42417bda2e3fc1a918db`), vía API:
- **Cache Rule** creada en fase `http_request_cache_settings`: edge cache 2h + stale-while-revalidate para TODO excepto `/_assets/` y `/images/` (que ya son immutable). Free plan: min edge TTL 2h, sin `matches` (solo `starts_with`).
- **Always Online** activado (`always_online: on`).
- Settings pre-existentes útiles: `cache_level: aggressive`, `browser_cache_ttl: 14400`, Brotli on, HTTP/3 on, SSL strict, security medium, sin bot/waf bloqueos.

Pendiente por Sergio (manual, en GSC): URL Inspection de `https://mallas-barranquilla.com/` + 3-4 URLs clave → "Solicitar indexación"; esperar 24-72h; re-chequear "Páginas descubiertas".

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

### Sprint: URLs SEO servicio+ciudad + fechas orgánicas blog (14-ago-2026)
- **URLs de servicio optimizadas (servicio + ciudad)**: las 3 páginas renombradas con `git mv`:
  - `/servicios/malla-para-gatos-barranquilla`
  - `/servicios/malla-para-perros-barranquilla`
  - `/servicios/malla-para-ninos-barranquilla`
  - `/servicios` se queda igual. Actualizados canonical, schema (`BreadcrumbList`/`Service` url), hrefs en `InstallTypes.astro`, `Footer.astro` y `servicios.astro` (incl. `ItemList`).
- **Sin fechas en páginas**: las páginas de servicio no muestran ni emiten `datePublished`/`dateModified`. La fecha solo vive en el blog.
- **Fechas de blog distribuidas orgánicamente** (antes: las 3 en 2026-07-21 → antinatural):
  - `como-elegir-malla-seguridad-balcon` → `2025-11-18`
  - `mallas-de-seguridad-para-gatos-guia-completa` → `2026-03-10`
  - `proteccion-ninos-balcones-apartamentos` → `2026-07-21`
- Build OK (17 páginas). Sitemap sin URLs viejas.

### Sprint: Mejoras SEO contexto del blueprint de GSC (26-ago-2026)
Aplicación de la 1ª fase del blueprint de mejoras Mayprotec (basado en GSC real + Ubersuggest):
- **Home**: nueva componente `InstalacionSeguridad.astro` con H2 "Instalación de Mallas de Seguridad en Barranquilla" (~250 palabras, keyword co-principal "mallas de seguridad Barranquilla" striking distance pos~12) + links naturales a `/precios`, landings gatos/perros/niños y `/servicios`. Insertada entre WhyUs e InstallTypes (índice `index.astro`).
- **Gatos** (`malla-para-gatos-barranquilla.astro`): nueva sección H2 "¿Cómo evitar que tu gato se escape por el balcón o las ventanas?" apuntando a la long-tail "malla para que no se escapen los gatos" (~pos 3 en GSC). Corregida inconsistencia material: "polietileno" → "polipropileno" (el resto del sitio usa polipropileno; el blueprint marcaba la discordancia).
- **Perros** (`malla-para-perros-barranquilla.astro`): sección FAQ visible (4 Q&A) para cobertura semántica y bloques para long-tails.
- **Niños** (`malla-para-ninos-barranquilla.astro`): sección FAQ visible (4 Q&A) para cobertura semántica.
- Build OK (17 páginas). Commit `0814ab5`, deploy CF Pages `4be782b0.mayprotec.pages.dev` (build+deploy success).

### Sprint: Alinear Gatos H1/Title con keyword mapping (26-ago-2026, audit Bluejay/ChatGPT)
Auditoría de bluejay (ChatGPT) confirmó que la landing de gatos no seguía el keyword mapping de Ubersuggest:
- Gatos estaba ~pos 46-61 (sin posición alta que proteger, a diferencia de Home ~#7) → se puede ser agresivo.
- **Title**: "Mallas para Gatos en Barranquilla | Instalación de Seguridad" (antes "Malla de seguridad para gatos... | Mayprotec").
- **H1**: "Mallas para Gatos en Barranquilla" (antes "Malla de seguridad para gatos...").
- Primer párrafo mantiene semántica: "Instalamos mallas de seguridad para gatos..." (plural refuerza el cluster del H1 nuevo).
- Suavizada afirmación no verificable: eliminado "causa más común de visitas veterinarias en Barranquilla" → "representan un riesgo importante para gatos en apartamentos altos".
- **Perros se dejó quieto** (conservador, correcto: ~pos 4.25 en GSC, no hay que arriesgar).
Commit `94799df`, deploy `f5966ebb.mayprotec.pages.dev` (build+deploy success, verificado).

**PENDIENTE para Sergio** (necesarios para P0/P1 completos, no inventar — el blueprint lo prohíbe):
- Teléfono real `[TELEFONO]`, número WhatsApp `[WHATSAPP_NUM]` y dirección `[DIRECCION]` (aún placeholders en código en `BaseLayout.astro`, `Footer.astro`, `contacto`, `LeadModal`, `ContactForm`, `leads.ts`).
- Confirmar garantía REAL: Home dice "1 año" (Hero/Benefits/Process/FAQ) vs landing gatos "5 años en tensado y anclajes". Alinear.
- Validar claims: "+150 familias" (Hero), "más de 5 años" (WhyUs), "+45 reseñas / 5.0" (Testimonials), "Instalación disponible hoy". El testimonio de "Manga" es de Cartagena → reubicar/eliminar para hiperlocal Barranquilla.
- Datos de GBP (Google Business Profile) si aplica para SEO local paralelo.

## Development

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Full documentation: https://docs.astro.build
