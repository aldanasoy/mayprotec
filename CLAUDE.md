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

## Development

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Full documentation: https://docs.astro.build
