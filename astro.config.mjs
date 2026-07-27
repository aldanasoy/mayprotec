import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://mallas-barranquilla.com',

  // base: '/mayprotec',  // Uncomment ONLY for GitHub Pages preview. Remove for Cloudflare Pages with custom domain.
  output: 'static',

  integrations: [sitemap()],
  build: { assets: '_assets' },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});