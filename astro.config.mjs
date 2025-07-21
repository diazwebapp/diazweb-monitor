// @ts-check
import { defineConfig } from 'astro/config';
//import cloudflare from '@astrojs/cloudflare';
import vercel from '@astrojs/vercel';
export const domain = process.env.PUBLIC_DOMAIN;

// https://astro.build/config
export default defineConfig({
  output: 'server',
  site:domain,
  adapter: vercel()
});