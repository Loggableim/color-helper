import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://color-helper.com',
  integrations: [
    react(),
    sitemap({
      // Priority + changefreq per page type for better SEO
      serialize(item) {
        const url = item.url;
        let priority = 0.7;
        let changefreq = 'monthly';

        // Detect individual color page: ends with /colors/<slug>/  (slug has no slash after)
        const colorPageMatch = url.match(/\/colors\/([^/]+)\/?$/);
        const isIndividualColor = colorPageMatch && colorPageMatch[1] !== '' && !url.endsWith('/colors/');

        if (url === 'https://color-helper.com/') {
          priority = 1.0;
          changefreq = 'weekly';
        } else if (isIndividualColor) {
          // Individual color pages: lower priority, yearly
          priority = 0.6;
          changefreq = 'yearly';
        } else if (url.endsWith('/colors/') || url.endsWith('/color-names/')) {
          // Color index pages
          priority = 0.9;
          changefreq = 'monthly';
        } else if (url.includes('-picker/') || url.includes('-checker/') || url.includes('-converter/') || url.includes('-generator/') || url.includes('-mixer/') || url.includes('/random-color-') || url.includes('/hex-') || url.includes('/rgb-') || url.includes('/rgba-') || url.includes('/css-color-') || url.includes('/brand-') || url.includes('/image-')) {
          // Tool pages
          priority = 0.8;
          changefreq = 'monthly';
        } else if (url.includes('/generate/') || url.includes('/preview/') || url.includes('/export/') || url.includes('/gallery/') || url.includes('/palettes/')) {
          // Feature pages
          priority = 0.8;
          changefreq = 'monthly';
        } else if (url.includes('/guides/')) {
          priority = 0.7;
          changefreq = 'monthly';
        }

        return {
          ...item,
          priority,
          changefreq,
        };
      },
    }),
  ],
  output: 'static',
  build: {
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
});
