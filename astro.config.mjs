import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://color-helper.com',
  integrations: [react(), sitemap()],
  output: 'static',
  build: {
    assets: '_assets',
  },
});
