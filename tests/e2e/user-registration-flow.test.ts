import { test, expect } from '@playwright/test';

test.describe('User Registration and Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar estado antes de cada test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('usuario debería poder registrarse exitosamente', async ({ page }) => {
    // Navegar a la página de registro
    await page.goto('/auth/register');

    // Verificar que estamos en la página correcta
    await expect(page).toHaveTitle(/Registro|Sign Up|Register/i);
    await expect(page.locator('h1')).toContainText(/registro|crear cuenta/i);

    // Llenar el formulario de registro
    await page.fill('[name="name"]', 'Juan Pérez');
    await page.fill('[name="email"]', 'test-user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.selectOption('[name="role"]', 'TENANT');
    await page.fill('[name="phone"]', '+56912345678');

    // Aceptar términos y condiciones si existen
    const termsCheckbox = page.locator('[name="acceptTerms"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Verificar redirección exitosa
    await expect(page).toHaveURL(/\/dashboard|\/verify-email|\/welcome/i);

    // Verificar mensaje de éxito
    await expect(page.locator('.success-message, .alert-success')).toContainText(
      /cuenta creada|registro exitoso|verifica tu email/i
    );

    // Verificar que se guardó información en localStorage/sessionStorage
    const storedData = await page.evaluate(() => {
      return {
        user: localStorage.getItem('user'),
        token: localStorage.getItem('token'),
      };
    });
    expect(storedData.user).toBeTruthy();
  });

  test('debería validar campos requeridos en registro', async ({ page }) => {
    await page.goto('/auth/register');

    // Intentar enviar formulario vacío
    await page.click('button[type="submit"]');

    // Verificar mensajes de error para campos requeridos
    await expect(page.locator('.error-message, .field-error')).toContainText(/requerido|obligatorio/i);

    // Verificar que campos específicos muestren errores
    const nameField = page.locator('[name="name"]');
    const emailField = page.locator('[name="email"]');
    const passwordField = page.locator('[name="password"]');

    await expect(nameField).toHaveAttribute('aria-invalid', 'true');
    await expect(emailField).toHaveAttribute('aria-invalid', 'true');
    await expect(passwordField).toHaveAttribute('aria-invalid', 'true');
  });

  test('debería validar formato de email', async ({ page }) => {
    await page.goto('/auth/register');

    // Probar emails inválidos
    const invalidEmails = [
      'invalid-email',
      'user@',
      '@example.com',
      'user..double@example.com',
      'user@example',
    ];

    for (const invalidEmail of invalidEmails) {
      await page.fill('[name="email"]', invalidEmail);
      await page.fill('[name="password"]', 'ValidPass123!');
      await page.fill('[name="name"]', 'Test User');

      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toContainText(/email.*válido|formato.*email/i);

      // Limpiar campos para siguiente iteración
      await page.fill('[name="email"]', '');
    }
  });

  test('debería validar fortaleza de contraseña', async ({ page }) => {
    await page.goto('/auth/register');

    // Probar contraseñas débiles
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'abcdefgh',
    ];

    for (const weakPassword of weakPasswords) {
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', weakPassword);
      await page.fill('[name="confirmPassword"]', weakPassword);

      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toContainText(
        /contraseña.*débil|seguridad|mínimo|mayúscula|número/i
      );

      // Limpiar campos
      await page.fill('[name="password"]', '');
      await page.fill('[name="confirmPassword"]', '');
    }
  });

  test('debería validar coincidencia de contraseñas', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPass123!');

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText(
      /contraseñas.*coinciden|no.*coinciden/i
    );
  });

  test('debería rechazar email ya registrado', async ({ page }) => {
    await page.goto('/auth/register');

    // Intentar registrar con email ya existente
    await page.fill('[name="name"]', 'Juan Pérez');
    await page.fill('[name="email"]', 'existing@example.com'); // Email que ya existe
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.selectOption('[name="role"]', 'TENANT');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('.error-message, .alert-danger')).toContainText(
      /ya.*registrado|ya.*existe|duplicado/i
    );

    // Verificar que no se redirige
    await expect(page).toHaveURL(/.*register.*/);
  });

  test('usuario debería poder verificar email', async ({ page }) => {
    // Simular recepción de email de verificación
    const verificationToken = 'mock_verification_token_123';

    // Navegar directamente a la página de verificación
    await page.goto(`/auth/verify-email?token=${verificationToken}`);

    // Verificar que se procesa la verificación
    await expect(page.locator('.success-message')).toContainText(
      /email.*verificado|cuenta.*activada/i
    );

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/\/dashboard|\/welcome/i);
  });

  test('usuario debería poder iniciar sesión después del registro', async ({ page }) => {
    // Ir a login
    await page.goto('/auth/login');

    // Llenar credenciales
    await page.fill('[name="email"]', 'test-user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Verificar login exitoso
    await expect(page).toHaveURL(/\/dashboard/i);

    // Verificar que se muestra información del usuario
    await expect(page.locator('.user-info, .user-name')).toContainText('Juan Pérez');

    // Verificar que el token se guardó
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('debería manejar intentos de login fallidos', async ({ page }) => {
    await page.goto('/auth/login');

    // Intentar login con credenciales incorrectas
    await page.fill('[name="email"]', 'test-user@example.com');
    await page.fill('[name="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('.error-message, .alert-danger')).toContainText(
      /credenciales.*incorrectas|usuario.*contraseña/i
    );

    // Verificar que no se redirige
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('debería aplicar rate limiting en login', async ({ page }) => {
    await page.goto('/auth/login');

    // Intentar múltiples logins fallidos
    for (let i = 0; i < 5; i++) {
      await page.fill('[name="email"]', 'test-user@example.com');
      await page.fill('[name="password"]', 'WrongPassword123!');

      await page.click('button[type="submit"]');

      // Limpiar campos para siguiente intento
      await page.fill('[name="password"]', '');
    }

    // Verificar que se aplica rate limiting
    await expect(page.locator('.error-message')).toContainText(
      /demasiados.*intentos|espera|inténtalo.*más tarde/i
    );
  });

  test('usuario debería poder hacer logout', async ({ page }) => {
    // Primero hacer login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test-user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verificar que estamos logueados
    await expect(page).toHaveURL(/\/dashboard/i);

    // Hacer logout
    await page.click('.logout-btn, [data-testid="logout"]');

    // Verificar redirección a login
    await expect(page).toHaveURL(/\/auth\/login|\/$/i);

    // Verificar que se limpió el token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('debería recordar sesión entre recargas', async ({ page }) => {
    // Hacer login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test-user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verificar login exitoso
    await expect(page).toHaveURL(/\/dashboard/i);

    // Recargar página
    await page.reload();

    // Verificar que seguimos logueados
    await expect(page).toHaveURL(/\/dashboard/i);
    await expect(page.locator('.user-info')).toContainText('Juan Pérez');
  });

  test('debería manejar expiración de sesión', async ({ page }) => {
    // Simular sesión expirada manipulando localStorage
    await page.goto('/dashboard');

    // Manipular token para que expire
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired_token_123');
    });

    // Recargar página
    await page.reload();

    // Verificar redirección a login
    await expect(page).toHaveURL(/\/auth\/login/i);

    // Verificar mensaje de sesión expirada
    await expect(page.locator('.info-message')).toContainText(
      /sesión.*expirada|vuelve.*iniciar/i
    );
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    // Simular dispositivo móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/auth/register');

    // Verificar que el formulario se adapta
    await expect(page.locator('form')).toBeVisible();

    // Verificar que los campos son usables en móvil
    const nameField = page.locator('[name="name"]');
    await expect(nameField).toBeVisible();
    await expect(nameField).toBeEnabled();

    // Llenar formulario en móvil
    await page.fill('[name="name"]', 'Usuario Móvil');
    await page.fill('[name="email"]', 'mobile@example.com');
    await page.fill('[name="password"]', 'MobilePass123!');

    // Verificar que el botón de submit es accesible
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('debería manejar conexiones lentas', async ({ page }) => {
    // Simular conexión lenta
    await page.route('**/api/auth/register', async route => {
      // Delay de 5 segundos
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Usuario registrado exitosamente'
        })
      });
    });

    await page.goto('/auth/register');

    // Llenar y enviar formulario
    await page.fill('[name="name"]', 'Usuario Lento');
    await page.fill('[name="email"]', 'slow@example.com');
    await page.fill('[name="password"]', 'SlowPass123!');
    await page.fill('[name="confirmPassword"]', 'SlowPass123!');

    await page.click('button[type="submit"]');

    // Verificar que se muestra indicador de carga
    await expect(page.locator('.loading, .spinner')).toBeVisible();

    // Esperar respuesta
    await expect(page.locator('.success-message')).toContainText(
      /registrado|cuenta creada/i
    );
  });

  test('debería manejar errores de red', async ({ page }) => {
    // Simular error de red
    await page.route('**/api/auth/register', route => {
      route.abort('failed');
    });

    await page.goto('/auth/register');

    await page.fill('[name="name"]', 'Usuario Error');
    await page.fill('[name="email"]', 'error@example.com');
    await page.fill('[name="password"]', 'ErrorPass123!');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error de conexión
    await expect(page.locator('.error-message')).toContainText(
      /conexión|error.*red|problema.*servidor/i
    );

    // Verificar que se puede reintentar
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});
