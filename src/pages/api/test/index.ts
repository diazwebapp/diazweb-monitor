// src/pages/api/screenshot.ts
import type { APIRoute } from 'astro';
import { chromium } from 'playwright'; // Importa el navegador Chromium


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
    //await fs.mkdir(publicDir, { recursive: true });

    browser = await chromium.launch(); // Lanza el navegador Chromium
    const page = await browser.newPage();

    // --- Captura de pantalla para Desktop ---
    await page.setViewportSize({ width: 1280, height: 800 }); // Tamaño de escritorio común
    await page.goto(url, { waitUntil: 'networkidle' }); // Espera a que la red esté inactiva
    const buffer1 = await page.screenshot({ type:"png" });

    // --- Captura de pantalla para Mobile ---
    await page.setViewportSize({ width: 375, height: 667 }); // Tamaño de móvil común (iPhone SE)
    // No es necesario page.goto de nuevo si ya estás en la URL y solo cambias el viewport
    await page.goto(url, { waitUntil: 'networkidle' }); // Navega de nuevo para asegurar el renderizado móvil
    const buffer2 = await page.screenshot({ type:"png" });

    await browser.close(); // Cierra el navegador

    let mobileBase64 = buffer2.toString('base64');
    let desktopBase64 = buffer1.toString('base64'); 

    mobileBase64 = `data:image/png;base64,${mobileBase64}`
    desktopBase64 = `data:image/png;base64,${desktopBase64}`
    
    return new Response(
      JSON.stringify({
        message: 'Capturas de pantalla generadas con éxito.',
        desktop: desktopBase64 ,
        mobile: mobileBase64,
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