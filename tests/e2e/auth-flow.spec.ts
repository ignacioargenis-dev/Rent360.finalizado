import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    // Check if the page loads correctly
    await expect(page).toHaveTitle(/Rent360/);

    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show login form', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Check if login form is visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Iniciar Sesión")');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should show register form', async ({ page }) => {
    // Navigate to register page
    await page.goto('/auth/register');

    // Check if register form is visible
    const nameInput = page.locator('input[placeholder*="Nombre"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const registerButton = page.locator('button:has-text("Registrarse")');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(registerButton).toBeVisible();
  });

  test('should handle login form validation', async ({ page }) => {
    await page.goto('/auth/login');

    // Try to submit empty form
    const loginButton = page.locator('button:has-text("Iniciar Sesión")');
    await loginButton.click();

    // Check for validation messages
    // Note: Adjust selectors based on actual implementation
    const emailError = page.locator('text=/email requerido|email obligatorio/i');
    const passwordError = page.locator('text=/contraseña requerida|password requerida/i');

    // At least one validation should appear
    const hasValidation = await emailError.isVisible() || await passwordError.isVisible();
    expect(hasValidation).toBe(true);
  });

  test('should handle register form validation', async ({ page }) => {
    await page.goto('/auth/register');

    // Try to submit empty form
    const registerButton = page.locator('button:has-text("Registrarse")');
    await registerButton.click();

    // Check for validation messages
    const nameError = page.locator('text=/nombre requerido|name requerido/i');
    const emailError = page.locator('text=/email requerido|email obligatorio/i');
    const passwordError = page.locator('text=/contraseña requerida|password requerida/i');

    // At least one validation should appear
    const hasValidation = await nameError.isVisible() ||
                         await emailError.isVisible() ||
                         await passwordError.isVisible();
    expect(hasValidation).toBe(true);
  });

  test('should navigate between auth pages', async ({ page }) => {
    // Start at login
    await page.goto('/auth/login');

    // Click register link
    const registerLink = page.locator('a:has-text("Registrarse")').or(
      page.locator('text=/¿No tienes cuenta|Crear cuenta/i')
    );
    await registerLink.click();

    // Should be on register page
    await expect(page).toHaveURL(/.*register/);

    // Click login link
    const loginLink = page.locator('a:has-text("Iniciar Sesión")').or(
      page.locator('text=/¿Ya tienes cuenta|Iniciar sesión/i')
    );
    await loginLink.click();

    // Should be back on login page
    await expect(page).toHaveURL(/.*login/);
  });
});
