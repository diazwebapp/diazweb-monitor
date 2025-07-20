// @ts-check
import { defineConfig } from 'astro/config';
export const domain = process.env.PUBLIC_DOMAIN;

// https://astro.build/config
export default defineConfig({
    output: 'server',
    site:domain
});
