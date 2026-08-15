import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mallas-barranquilla.com',
  // base: '/mayprotec',  // Uncomment ONLY for GitHub Pages preview. Remove for Cloudflare Pages with custom domain.
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/gracias') &&
        !page.includes('/test-analytics'),
      lastmod: new Date('2026-08-14'),
    }),
  ],
  build: { assets: '_assets' },
  vite: {
    plugins: [tailwindcss()],
  },
});
