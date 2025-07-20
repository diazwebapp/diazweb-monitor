// src/pages/api/screenshot.ts
import type { APIRoute } from 'astro';
import { chromium } from 'playwright'; // Importa el navegador Chromium
import path from 'node:path'; // Para manejar rutas de archivos
import fs from 'node:fs/promises'; // Para operaciones de sistema de archivos
import { fileURLToPath } from 'node:url'; // Para resolver __dirname en ES Modules

// Helper para obtener el directorio raíz del proyecto en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../'); // Ajusta según la estructura de tu proyecto
const publicDir = path.join(projectRoot, '/public', 'screenshots'); // Directorio donde se guardarán las imágenes

export const POST: APIRoute = async ({ request }) => {
  let browser;
  try {
    const { url } = await request.json();
    let isValid = url.trim().includes('http') || url.trim().includes('https');

    if (!url) {
      return new Response(JSON.stringify({ message: 'URL es requerida.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!isValid) {
      return new Response(JSON.stringify({ message: 'URL es invalida.' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Asegúrate de que el directorio de capturas de pantalla exista
    await fs.mkdir(publicDir, { recursive: true });

    browser = await chromium.launch(); // Lanza el navegador Chromium
    const page = await browser.newPage();

    const timestamp = Date.now(); // Para nombres de archivo únicos

    // --- Captura de pantalla para Desktop ---
    await page.setViewportSize({ width: 1280, height: 800 }); // Tamaño de escritorio común
    await page.goto(url, { waitUntil: 'networkidle' }); // Espera a que la red esté inactiva
    const desktopScreenshotFileName = `desktop-${timestamp}.png`;
    const desktopScreenshotPath = path.join(publicDir, desktopScreenshotFileName);
    await page.screenshot({ path: desktopScreenshotPath });

    // --- Captura de pantalla para Mobile ---
    await page.setViewportSize({ width: 375, height: 667 }); // Tamaño de móvil común (iPhone SE)
    // No es necesario page.goto de nuevo si ya estás en la URL y solo cambias el viewport
    await page.goto(url, { waitUntil: 'networkidle' }); // Navega de nuevo para asegurar el renderizado móvil
    const mobileScreenshotFileName = `mobile-${timestamp}.png`;
    const mobileScreenshotPath = path.join(publicDir, mobileScreenshotFileName);
    await page.screenshot({ path: mobileScreenshotPath });

    await browser.close(); // Cierra el navegador

    // Rutas relativas para el frontend
    const desktopRelativePath = `/screenshots/${desktopScreenshotFileName}`;
    const mobileRelativePath = `/screenshots/${mobileScreenshotFileName}`;

    return new Response(
      JSON.stringify({
        message: 'Capturas de pantalla generadas con éxito.',
        desktop: desktopRelativePath,
        mobile: mobileRelativePath,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error al generar capturas de pantalla:', error);
    if (browser) {
      await browser.close(); // Asegúrate de cerrar el navegador en caso de error
    }
    return new Response(JSON.stringify({ message: 'Error interno del servidor al procesar la URL.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};