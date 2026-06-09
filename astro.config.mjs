// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';



export default defineConfig({
  output: 'server',
  //site: process.env.PUBLIC_SITE_URL,
  integrations: [
    react(),
    // sitemap() // Descomenta SOLO si realmente usas la integración de sitemap
  ],

  adapter: vercel(),

});
