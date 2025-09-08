import { test, expect } from '@playwright/test';

test.describe('Property Management Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar estado y hacer login como propietario
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Ir a login
    await page.goto('/auth/login');

    // Login como propietario
    await page.fill('[name="email"]', 'owner@example.com');
    await page.fill('[name="password"]', 'OwnerPass123!');
    await page.click('button[type="submit"]');

    // Verificar que estamos en dashboard de propietario
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('.user-role')).toContainText('PROPIETARIO');
  });

  test('propietario debería poder publicar propiedad exitosamente', async ({ page }) => {
    // Ir a sección de propiedades
    await page.click('[data-testid="properties-menu"]');
    await expect(page).toHaveURL(/\/properties/);

    // Hacer click en "Agregar propiedad"
    await page.click('[data-testid="add-property-btn"]');
    await expect(page).toHaveURL(/\/properties\/new/);

    // Llenar formulario de propiedad
    await page.fill('[name="title"]', 'Hermoso departamento centro histórico');
    await page.fill('[name="description"]', 'Excelente departamento completamente amueblado en el corazón de Santiago. Cercano a metro, supermercados y servicios.');
    await page.selectOption('[name="type"]', 'APARTMENT');
    await page.fill('[name="price"]', '450000');
    await page.fill('[name="area"]', '65');
    await page.fill('[name="bedrooms"]', '2');
    await page.fill('[name="bathrooms"]', '1');
    await page.selectOption('[name="city"]', 'Santiago');
    await page.selectOption('[name="commune"]', 'Providencia');
    await page.fill('[name="address"]', 'Providencia 123, Providencia');

    // Características adicionales
    await page.check('[name="furnished"]');
    await page.check('[name="parking"]');
    await page.check('[name="elevator"]');
    await page.fill('[name="floor"]', '5');

    // Subir fotos (simular)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      './test-files/property-photo-1.jpg',
      './test-files/property-photo-2.jpg',
      './test-files/property-photo-3.jpg'
    ]);

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Verificar que se creó la propiedad
    await expect(page).toHaveURL(/\/properties\/[a-zA-Z0-9]+/);
    await expect(page.locator('.success-message')).toContainText(/propiedad.*creada|publicada/i);

    // Verificar detalles de la propiedad
    await expect(page.locator('.property-title')).toContainText('Hermoso departamento centro histórico');
    await expect(page.locator('.property-price')).toContainText('450.000');
    await expect(page.locator('.property-area')).toContainText('65 m²');
    await expect(page.locator('.property-status')).toContainText(/disponible|available/i);
  });

  test('propietario debería poder editar propiedad existente', async ({ page }) => {
    // Ir a lista de propiedades
    await page.click('[data-testid="properties-menu"]');
    await page.click('[data-testid="my-properties"]');

    // Seleccionar primera propiedad
    await page.click('.property-card:first-child .edit-btn');
    await expect(page).toHaveURL(/\/properties\/[a-zA-Z0-9]+\/edit/);

    // Modificar precio
    const newPrice = '480000';
    await page.fill('[name="price"]', newPrice);

    // Agregar nueva descripción
    await page.fill('[name="description"]', 'Propiedad actualizada con nueva descripción y mejores amenities.');

    // Cambiar estado
    await page.selectOption('[name="status"]', 'MAINTENANCE');

    // Guardar cambios
    await page.click('button[type="submit"]');

    // Verificar cambios
    await expect(page.locator('.success-message')).toContainText(/actualizada|modificada/i);
    await expect(page.locator('.property-price')).toContainText('480.000');
    await expect(page.locator('.property-status')).toContainText(/mantenimiento|maintenance/i);
  });

  test('propietario debería poder gestionar contratos de arriendo', async ({ page }) => {
    // Ir a sección de contratos
    await page.click('[data-testid="contracts-menu"]');
    await expect(page).toHaveURL(/\/contracts/);

    // Ver contratos activos
    await page.click('[data-testid="active-contracts"]');

    // Verificar que se muestran contratos
    const contractCards = page.locator('.contract-card');
    await expect(contractCards.first()).toBeVisible();

    // Ver detalles de contrato
    await page.click('.contract-card:first-child .view-details-btn');
    await expect(page).toHaveURL(/\/contracts\/[a-zA-Z0-9]+/);

    // Verificar información del contrato
    await expect(page.locator('.contract-status')).toContainText(/activo|active/i);
    await expect(page.locator('.tenant-info')).toBeVisible();
    await expect(page.locator('.payment-history')).toBeVisible();

    // Ver pagos del contrato
    await page.click('[data-testid="payment-history"]');
    await expect(page.locator('.payment-record')).toHaveLengthGreaterThan(0);
  });

  test('propietario debería poder recibir notificaciones de pagos', async ({ page }) => {
    // Ir a notificaciones
    await page.click('[data-testid="notifications-menu"]');
    await expect(page.locator('.notification-item')).toBeVisible();

    // Verificar notificación de pago recibido
    const paymentNotification = page.locator('.notification-item').filter({
      hasText: /pago|payment/i
    });

    await expect(paymentNotification).toBeVisible();
    await expect(paymentNotification).toContainText(/recibido|received/i);

    // Marcar como leída
    await page.click('.notification-item:first-child .mark-read-btn');

    // Verificar que se marcó como leída
    await expect(page.locator('.notification-item:first-child')).toHaveClass(/read/);
  });

  test('propietario debería poder ver reportes financieros', async ({ page }) => {
    // Ir a reportes
    await page.click('[data-testid="reports-menu"]');
    await page.click('[data-testid="financial-reports"]');

    // Ver resumen financiero
    await expect(page.locator('.total-income')).toBeVisible();
    await expect(page.locator('.total-expenses')).toBeVisible();
    await expect(page.locator('.net-profit')).toBeVisible();

    // Ver gráfico de ingresos
    await expect(page.locator('.income-chart')).toBeVisible();

    // Ver detalle por propiedad
    await page.click('[data-testid="property-breakdown"]');
    const propertyRows = page.locator('.property-financial-row');
    await expect(propertyRows).toHaveLengthGreaterThan(0);

    // Verificar que cada propiedad muestra ingresos
    await expect(propertyRows.first().locator('.property-income')).toBeVisible();
  });

  test('propietario debería poder gestionar mantenimiento', async ({ page }) => {
    // Ir a sección de mantenimiento
    await page.click('[data-testid="maintenance-menu"]');
    await expect(page).toHaveURL(/\/maintenance/);

    // Crear nueva solicitud de mantenimiento
    await page.click('[data-testid="new-maintenance-request"]');

    // Llenar formulario
    await page.selectOption('[name="property"]', 'departamento-centro'); // Primera propiedad
    await page.selectOption('[name="type"]', 'PLUMBING');
    await page.selectOption('[name="priority"]', 'HIGH');
    await page.fill('[name="description"]', 'Fuga en el baño principal que requiere reparación urgente');
    await page.fill('[name="preferredDate"]', '2024-02-15');

    // Subir fotos del problema
    const photoInput = page.locator('input[type="file"][name="photos"]');
    await photoInput.setInputFiles([
      './test-files/maintenance-photo-1.jpg',
      './test-files/maintenance-photo-2.jpg'
    ]);

    // Enviar solicitud
    await page.click('button[type="submit"]');

    // Verificar que se creó la solicitud
    await expect(page.locator('.success-message')).toContainText(/solicitud.*creada|enviada/i);

    // Verificar estado de la solicitud
    await expect(page.locator('.maintenance-status')).toContainText(/pendiente|pending/i);
  });

  test('propietario debería poder calificar inquilino', async ({ page }) => {
    // Ir a contratos finalizados
    await page.click('[data-testid="contracts-menu"]');
    await page.click('[data-testid="finished-contracts"]');

    // Seleccionar contrato finalizado
    const finishedContract = page.locator('.contract-card').filter({
      hasText: /finalizado|finished/i
    });

    await expect(finishedContract).toBeVisible();
    await finishedContract.click();

    // Ir a sección de calificación
    await page.click('[data-testid="rate-tenant"]');

    // Llenar formulario de calificación
    await page.click('.rating-stars .star:nth-child(4)'); // 4 estrellas
    await page.fill('[name="comment"]', 'Excelente inquilino, siempre pagó a tiempo y mantuvo la propiedad en perfectas condiciones.');
    await page.check('[name="recommend"]');

    // Aspectos específicos
    await page.selectOption('[name="punctuality"]', '5'); // Muy puntual
    await page.selectOption('[name="cleanliness"]', '5'); // Muy limpio
    await page.selectOption('[name="respect"]', '4'); // Respetuoso

    // Enviar calificación
    await page.click('button[type="submit"]');

    // Verificar que se guardó
    await expect(page.locator('.success-message')).toContainText(/calificación.*guardada|enviada/i);

    // Verificar que aparece en perfil del inquilino
    await expect(page.locator('.tenant-rating')).toContainText('4.0');
  });

  test('propietario debería poder configurar precios dinámicos', async ({ page }) => {
    // Ir a configuración de propiedad
    await page.click('[data-testid="properties-menu"]');
    await page.click('[data-testid="my-properties"]');
    await page.click('.property-card:first-child .settings-btn');

    // Ir a configuración de precios
    await page.click('[data-testid="pricing-settings"]');

    // Configurar precio dinámico
    await page.check('[name="dynamicPricing"]');
    await page.fill('[name="basePrice"]', '450000');
    await page.fill('[name="seasonalMultiplier"]', '1.2'); // 20% más en temporada alta
    await page.selectOption('[name="highSeasonStart"]', '12');
    await page.selectOption('[name="highSeasonEnd"]', '2');

    // Configurar descuentos
    await page.check('[name="longTermDiscount"]');
    await page.fill('[name="discountMonths"]', '6');
    await page.fill('[name="discountPercentage"]', '10');

    // Configurar precio mínimo/máximo
    await page.fill('[name="minPrice"]', '400000');
    await page.fill('[name="maxPrice"]', '500000');

    // Guardar configuración
    await page.click('button[type="submit"]');

    // Verificar que se guardó
    await expect(page.locator('.success-message')).toContainText(/configuración.*guardada/i);

    // Verificar precio calculado
    await expect(page.locator('.current-price')).toBeVisible();
    await expect(page.locator('.price-range')).toContainText('400.000 - 500.000');
  });

  test('propietario debería poder ver analytics avanzados', async ({ page }) => {
    // Ir a analytics
    await page.click('[data-testid="analytics-menu"]');
    await expect(page).toHaveURL(/\/analytics/);

    // Ver métricas generales
    await expect(page.locator('.total-views')).toBeVisible();
    await expect(page.locator('.total-inquiries')).toBeVisible();
    await expect(page.locator('.conversion-rate')).toBeVisible();

    // Ver gráfico de visitas por día
    await expect(page.locator('.visits-chart')).toBeVisible();

    // Ver análisis por fuente
    await page.click('[data-testid="source-analysis"]');
    await expect(page.locator('.source-item')).toHaveLengthGreaterThan(0);

    // Ver mapa de calor de interés
    await expect(page.locator('.interest-heatmap')).toBeVisible();

    // Ver predicciones de precio
    await page.click('[data-testid="price-predictions"]');
    await expect(page.locator('.predicted-price')).toBeVisible();
    await expect(page.locator('.market-trend')).toBeVisible();
  });

  test('propietario debería poder gestionar múltiples propiedades', async ({ page }) => {
    // Ir a vista de portafolio
    await page.click('[data-testid="properties-menu"]');
    await page.click('[data-testid="portfolio-view"]');

    // Ver resumen de todas las propiedades
    const propertyCards = page.locator('.property-summary-card');
    await expect(propertyCards).toHaveLengthGreaterThan(0);

    // Verificar métricas consolidadas
    await expect(page.locator('.total-properties')).toBeVisible();
    await expect(page.locator('.total-monthly-income')).toBeVisible();
    await expect(page.locator('.occupancy-rate')).toBeVisible();

    // Ver rendimiento por propiedad
    await page.click('[data-testid="performance-comparison"]');
    await expect(page.locator('.performance-chart')).toBeVisible();

    // Ver distribución geográfica
    await page.click('[data-testid="location-map"]');
    await expect(page.locator('.property-map')).toBeVisible();

    // Exportar reporte
    await page.click('[data-testid="export-report"]');
    await expect(page.locator('.export-success')).toContainText(/exportado|generado/i);
  });

  test('propietario debería poder configurar notificaciones', async ({ page }) => {
    // Ir a configuración de notificaciones
    await page.click('[data-testid="settings-menu"]');
    await page.click('[data-testid="notification-settings"]');

    // Configurar preferencias de notificación
    await page.check('[name="paymentReceived"]');
    await page.check('[name="contractEnding"]');
    await page.check('[name="maintenanceRequest"]');
    await page.uncheck('[name="marketingEmails"]');

    // Configurar frecuencia
    await page.selectOption('[name="frequency"]', 'DAILY');

    // Configurar canales
    await page.check('[name="emailNotifications"]');
    await page.check('[name="smsNotifications"]');
    await page.check('[name="pushNotifications"]');

    // Guardar configuración
    await page.click('button[type="submit"]');

    // Verificar que se guardó
    await expect(page.locator('.success-message')).toContainText(/configuración.*guardada/i);
  });
});
