// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  site: import.meta.env.PUBLIC_SITE_URL,
  integrations: [
    react(),
    // sitemap() // Descomenta SOLO si realmente usas la integración de sitemap
  ],

  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Requerido con Vite 8 hoisted: @tailwindcss/vite usa createResolver()
      // tsconfigPaths is not a valid option here. To enable TypeScript path resolution in Vite, use the official vite-tsconfig-paths plugin:
      // 1. Install: npm install -D vite-tsconfig-paths
      // 2. Add to plugins (outside of resolve):
      // import tsconfigPaths from 'vite-tsconfig-paths';
      // plugins: [tailwindcss(), tsconfigPaths()],
    },
  },
});
