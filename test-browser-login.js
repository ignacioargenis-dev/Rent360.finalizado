// Script para probar login desde el navegador
const puppeteer = require('playwright');

async function testBrowserLogin() {
  console.log('🖥️  PROBANDO LOGIN DESDE EL NAVEGADOR');

  const browser = await puppeteer.chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Ir a la página de login
    console.log('1. Navegando a la página de login...');
    await page.goto('http://localhost:3003/auth/login');

    // Esperar a que cargue
    await page.waitForTimeout(2000);

    // Rellenar el formulario
    console.log('2. Rellenando credenciales...');
    await page.fill('input[name="email"]', 'admin@rent360.cl');
    await page.fill('input[name="password"]', '12345678');

    // Hacer clic en el botón de login
    console.log('3. Enviando formulario...');
    await page.click('button[type="submit"]');

    // Esperar a que se complete el login
    await page.waitForTimeout(3000);

    // Verificar si estamos en el dashboard
    const currentUrl = page.url();
    console.log('4. URL actual:', currentUrl);

    if (currentUrl.includes('/admin/dashboard') || currentUrl.includes('/admin')) {
      console.log('✅ Login exitoso - Redirigido al dashboard');
    } else {
      console.log('❌ Login falló - No redirigió correctamente');
    }

    // Intentar navegar a usuarios
    console.log('5. Navegando a /admin/users...');
    await page.goto('http://localhost:3003/admin/users');
    await page.waitForTimeout(2000);

    const usersUrl = page.url();
    console.log('URL de usuarios:', usersUrl);

    // Verificar si hay contenido de usuarios
    const hasUsersContent = (await page.locator('text=Gestión de Usuarios').count()) > 0;
    console.log('Contenido de usuarios visible:', hasUsersContent);

    // Verificar si hay errores en consola
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('Errores en consola:', errors);
    } else {
      console.log('✅ No hay errores en consola');
    }
  } catch (error) {
    console.error('Error durante la prueba:', error.message);
  } finally {
    await browser.close();
  }
}

testBrowserLogin();
