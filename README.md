# Mayprotec — Mallas para Balcones en Barranquilla

Sitio web de Mayprotec (Rank & Rent de Arcoso LLC). Stack: **Astro + Tailwind**, deploy en **Cloudflare Pages**.

## Deploy

- **Repo**: `aldanasoy/mayprotec` (branch `main`)
- **Hosting**: Cloudflare Pages → proyecto `mayprotec`
- **Dominios**: `mallas-barranquilla.com` + `www` (CNAME → `mayprotec.pages.dev`)
- **Cuenta Cloudflare**: `info@sergioaldana.com.co`
- Cada push a `main` dispara build automático (`npm run build`, output `dist`)

## Seguridad / SSL

- SSL Cloudflare: **Full (Strict)**, **Always Use HTTPS** ON, TLS mín 1.2
- HSTS: `max-age=15552000; includeSubDomains` (Edge Certificates)
- `public/_redirects`: www → non-www 301
- `public/_headers`: security headers + caching
- Cloudflare Redirect Rule `www to non-www` (edge-level)

## Local

```bash
npm install
npm run dev        # localhost:4321
npm run build      # build a ./dist/
```

## Notas

- El proyecto Pages se creó el 2026-07-31 migrando desde GitHub Pages (gh-pages).
- El Worker `maprotec` (intento previo con wrangler) se eliminó — dejaba un AAAA `100::` que bloqueaba el CNAME del apex.
