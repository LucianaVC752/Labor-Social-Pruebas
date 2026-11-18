const { chromium } = require('playwright');

// Rutas a evaluar en Labor Social
const URLS = [
  'http://localhost:3000',
  'http://localhost:3000/peticiones/nueva'
];

// Configuración de los 3 navegadores solicitados
const NAVEGADORES = [
  {
    nombre: 'Google Chrome',
    channel: 'chrome',
    executablePath: undefined
  },
  {
    nombre: 'Microsoft Edge',
    channel: 'msedge',
    executablePath: undefined
  },
  {
    nombre: 'Brave Browser',
    channel: undefined,
    // Ruta por defecto de Brave en Windows:
    executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
  }
];

const ITERACIONES = 3; // Número de cargas por ruta para promediar

async function medirCarga(navConfig) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: navConfig.channel,
      executablePath: navConfig.executablePath
    });
  } catch (err) {
    console.error(`⚠️ No se pudo abrir ${navConfig.nombre}. Verifica que esté instalado o ajusta executablePath.`);
    return [];
  }

  const resultados = [];

  for (const url of URLS) {
    let sumaTTFB = 0;
    let sumaDOM = 0;
    let sumaTotal = 0;

    for (let i = 1; i <= ITERACIONES; i++) {
      // Contexto limpio en cada iteración para evitar caché distorsionada
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url, { waitUntil: 'load', timeout: 30000 });

      const metricas = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          loadTotal: Math.round(nav.loadEventEnd - nav.startTime)
        };
      });

      sumaTTFB += metricas.ttfb;
      sumaDOM += metricas.domLoaded;
      sumaTotal += metricas.loadTotal;

      await context.close();
    }

    resultados.push({
      Navegador: navConfig.nombre,
      Ruta: url.replace('http://localhost:3000', '') || '/',
      'TTFB Promedio (ms)': Math.round(sumaTTFB / ITERACIONES),
      'DOM Loaded (ms)': Math.round(sumaDOM / ITERACIONES),
      'Carga Total (ms)': Math.round(sumaTotal / ITERACIONES),
      'Estado (< 3000ms)': Math.round(sumaTotal / ITERACIONES) < 3000 ? '✅ Aprobado' : '❌ Lento'
    });
  }

  await browser.close();
  return resultados;
}

(async () => {
  console.log('🚀 Iniciando pruebas de rendimiento (tiempos de carga por navegador)...\n');
  let tablaFinal = [];

  for (const nav of NAVEGADORES) {
    const res = await medirCarga(nav);
    tablaFinal = tablaFinal.concat(res);
  }

  console.table(tablaFinal);
})();