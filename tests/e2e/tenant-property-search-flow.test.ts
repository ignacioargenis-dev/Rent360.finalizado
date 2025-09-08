import { test, expect } from '@playwright/test';

test.describe('Tenant Property Search Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar estado y hacer login como inquilino
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Ir a login
    await page.goto('/auth/login');

    // Login como inquilino
    await page.fill('[name="email"]', 'tenant@example.com');
    await page.fill('[name="password"]', 'TenantPass123!');
    await page.click('button[type="submit"]');

    // Verificar que estamos en dashboard de inquilino
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('.user-role')).toContainText(/inquilino|tenant/i);
  });

  test('inquilino debería poder buscar propiedades por filtros', async ({ page }) => {
    // Ir a búsqueda de propiedades
    await page.click('[data-testid="search-properties"]');
    await expect(page).toHaveURL(/\/properties/);

    // Aplicar filtros básicos
    await page.selectOption('[name="city"]', 'Santiago');
    await page.selectOption('[name="commune"]', 'Providencia');
    await page.selectOption('[name="type"]', 'APARTMENT');
    await page.fill('[name="minPrice"]', '300000');
    await page.fill('[name="maxPrice"]', '600000');
    await page.fill('[name="bedrooms"]', '2');

    // Aplicar filtros avanzados
    await page.click('[data-testid="advanced-filters"]');
    await page.check('[name="furnished"]');
    await page.check('[name="parking"]');
    await page.selectOption('[name="minArea"]', '50');
    await page.selectOption('[name="maxArea"]', '80');

    // Buscar
    await page.click('[data-testid="search-btn"]');

    // Verificar resultados
    await expect(page.locator('.property-card')).toHaveLengthGreaterThan(0);

    // Verificar que los filtros se aplicaron
    const firstProperty = page.locator('.property-card').first();
    await expect(firstProperty).toContainText(/santiago|providencia/i);
    await expect(firstProperty.locator('.property-price')).toBeVisible();
  });

  test('inquilino debería poder ver detalles completos de propiedad', async ({ page }) => {
    // Buscar propiedades primero
    await page.click('[data-testid="search-properties"]');
    await page.click('[data-testid="search-btn"]');

    // Hacer click en primera propiedad
    await page.click('.property-card:first-child .view-details-btn');
    await expect(page).toHaveURL(/\/properties\/[a-zA-Z0-9]+/);

    // Verificar información básica
    await expect(page.locator('.property-title')).toBeVisible();
    await expect(page.locator('.property-price')).toBeVisible();
    await expect(page.locator('.property-description')).toBeVisible();
    await expect(page.locator('.property-address')).toBeVisible();

    // Verificar galería de fotos
    const photoGallery = page.locator('.photo-gallery');
    await expect(photoGallery).toBeVisible();
    await expect(photoGallery.locator('img')).toHaveLengthGreaterThan(0);

    // Verificar mapa de ubicación
    await expect(page.locator('.property-map')).toBeVisible();

    // Verificar características
    await expect(page.locator('.property-features')).toBeVisible();
    await expect(page.locator('.feature-item')).toHaveLengthGreaterThan(0);

    // Verificar información del propietario
    await page.click('[data-testid="owner-info"]');
    await expect(page.locator('.owner-rating')).toBeVisible();
    await expect(page.locator('.owner-response-time')).toBeVisible();
  });

  test('inquilino debería poder guardar propiedades favoritas', async ({ page }) => {
    // Buscar propiedades
    await page.click('[data-testid="search-properties"]');
    await page.click('[data-testid="search-btn"]');

    // Marcar primera propiedad como favorita
    const firstProperty = page.locator('.property-card').first();
    const favoriteBtn = firstProperty.locator('[data-testid="favorite-btn"]');
    await favoriteBtn.click();

    // Verificar que se marcó como favorita
    await expect(favoriteBtn).toHaveClass(/active|favorited/);

    // Ir a favoritos
    await page.click('[data-testid="favorites-menu"]');
    await expect(page).toHaveURL(/\/favorites/);

    // Verificar que la propiedad está en favoritos
    await expect(page.locator('.property-card')).toHaveLengthGreaterThan(0);
    await expect(page.locator('.property-card').first()).toBeVisible();

    // Desmarcar como favorita
    await page.click('.property-card:first-child [data-testid="favorite-btn"]');
    await expect(page.locator('.property-card')).toHaveLength(0);
  });

  test('inquilino debería poder contactar al propietario', async ({ page }) => {
    // Ver detalles de propiedad
    await page.click('[data-testid="search-properties"]');
    await page.click('[data-testid="search-btn"]');
    await page.click('.property-card:first-child .view-details-btn');

    // Hacer click en contactar
    await page.click('[data-testid="contact-owner"]');

    // Verificar modal de contacto
    await expect(page.locator('.contact-modal')).toBeVisible();

    // Llenar formulario de contacto
    await page.fill('[name="message"]', 'Hola, me interesa esta propiedad. ¿Podemos agendar una visita para este fin de semana?');
    await page.check('[name="scheduleVisit"]');
    await page.fill('[name="visitDate"]', '2024-02-10');
    await page.selectOption('[name="visitTime"]', '10:00');

    // Enviar mensaje
    await page.click('.contact-modal button[type="submit"]');

    // Verificar que se envió
    await expect(page.locator('.success-message')).toContainText(/mensaje.*enviado|contacto.*realizado/i);

    // Verificar que aparece en conversaciones
    await page.click('[data-testid="messages-menu"]');
    await expect(page.locator('.conversation-item')).toHaveLengthGreaterThan(0);
  });

  test('inquilino debería poder agendar visita a propiedad', async ({ page }) => {
    // Ver detalles de propiedad
    await page.click('[data-testid="search-properties"]');
    await page.click('[data-testid="search-btn"]');
    await page.click('.property-card:first-child .view-details-btn');

    // Ir a agendar visita
    await page.click('[data-testid="schedule-visit"]');

    // Seleccionar fecha y hora
    await page.fill('[name="visitDate"]', '2024-02-15');
    await page.selectOption('[name="visitTime"]', '14:00');
    await page.selectOption('[name="visitType"]', 'IN_PERSON');

    // Agregar notas adicionales
    await page.fill('[name="notes"]', 'Me gustaría ver el barrio y preguntar sobre gastos comunes.');

    // Confirmar visita
    await page.click('button[type="submit"]');

    // Verificar confirmación
    await expect(page.locator('.success-message')).toContainText(/visita.*agendada|programada/i);

    // Verificar que aparece en calendario
    await page.click('[data-testid="calendar-menu"]');
    await expect(page.locator('.calendar-event')).toContainText('Visita propiedad');
  });

  test('inquilino debería poder comparar propiedades', async ({ page }) => {
    // Buscar propiedades
    await page.click('[data-testid="search-properties"]');
    await page.click('[data-testid="search-btn"]');

    // Seleccionar múltiples propiedades para comparar
    const propertyCards = page.locator('.property-card');
    await expect(propertyCards).toHaveLengthGreaterThan(1);

    // Marcar dos propiedades para comparar
    await page.click('.property-card:nth-child(1) [data-testid="compare-checkbox"]');
    await page.click('.property-card:nth-child(2) [data-testid="compare-checkbox"]');

    // Ir a comparación
    await page.click('[data-testid="compare-btn"]');
    await expect(page).toHaveURL(/\/compare/);

    // Verificar tabla de comparación
    await expect(page.locator('.comparison-table')).toBeVisible();
    await expect(page.locator('.comparison-row')).toHaveLengthGreaterThan(0);

    // Verificar columnas de comparación
    await expect(page.locator('.comparison-header')).toContainText(/precio|ubicación|características/i);

    // Verificar que se pueden ver diferencias
    const priceComparison = page.locator('.price-comparison');
    await expect(priceComparison).toBeVisible();
  });

  test('inquilino debería poder aplicar a propiedad con documentos', async ({ page }) => {
    // Ver detalles de propiedad
    await page.click('[data-testid="search-properties"]');
    await page.click('[data-testid="search-btn"]');
    await page.click('.property-card:first-child .view-details-btn');

    // Hacer click en aplicar
    await page.click('[data-testid="apply-property"]');

    // Verificar formulario de aplicación
    await expect(page.locator('.application-form')).toBeVisible();

    // Información personal (debería estar precargada)
    await expect(page.locator('[name="fullName"]')).toHaveValue(/test|usuario/i);

    // Información adicional
    await page.selectOption('[name="employmentStatus"]', 'EMPLOYED');
    await page.fill('[name="monthlyIncome"]', '800000');
    await page.fill('[name="currentAddress"]', 'Santiago Centro');
    await page.fill('[name="moveInDate"]', '2024-03-01');

    // Referencias
    await page.fill('[name="reference1Name"]', 'Juan Pérez');
    await page.fill('[name="reference1Phone"]', '+56912345678');
    await page.fill('[name="reference1Relationship"]', 'Empleador');

    // Subir documentos requeridos
    const documentInputs = page.locator('input[type="file"]');
    await documentInputs.nth(0).setInputFiles('./test-files/id-document.pdf');
    await documentInputs.nth(1).setInputFiles('./test-files/income-proof.pdf');
    await documentInputs.nth(2).setInputFiles('./test-files/rent-agreement.pdf');

    // Firmar términos
    await page.check('[name="acceptTerms"]');
    await page.check('[name="acceptPrivacy"]');

    // Enviar aplicación
    await page.click('button[type="submit"]');

    // Verificar que se envió
    await expect(page.locator('.success-message')).toContainText(/aplicación.*enviada|postulación.*recibida/i);

    // Verificar estado de aplicación
    await page.click('[data-testid="my-applications"]');
    await expect(page.locator('.application-status')).toContainText(/pendiente|review/i);
  });

  test('inquilino debería poder ver recomendaciones personalizadas', async ({ page }) => {
    // Ir a recomendaciones
    await page.click('[data-testid="recommendations-menu"]');
    await expect(page).toHaveURL(/\/recommendations/);

    // Verificar recomendaciones basadas en preferencias
    await expect(page.locator('.recommended-property')).toHaveLengthGreaterThan(0);

    // Verificar que las recomendaciones tienen buena puntuación
    const firstRecommendation = page.locator('.recommended-property').first();
    await expect(firstRecommendation.locator('.match-score')).toBeVisible();
    await expect(firstRecommendation.locator('.match-score')).toContainText(/\d+%/);

    // Verificar filtros de recomendaciones
    await page.click('[data-testid="recommendation-filters"]');
    await page.selectOption('[name="sortBy"]', 'MATCH_SCORE');
    await page.click('[data-testid="apply-filters"]');

    // Verificar que se reordenaron
    const recommendations = page.locator('.recommended-property');
    const firstScore = await recommendations.first().locator('.match-score').textContent();
    const secondScore = await recommendations.nth(1).locator('.match-score').textContent();

    // El primero debería tener mayor o igual puntuación que el segundo
    const firstScoreNum = parseInt(firstScore?.replace('%', '') || '0');
    const secondScoreNum = parseInt(secondScore?.replace('%', '') || '0');
    expect(firstScoreNum).toBeGreaterThanOrEqual(secondScoreNum);
  });

  test('inquilino debería poder gestionar perfil y documentos', async ({ page }) => {
    // Ir a perfil
    await page.click('[data-testid="profile-menu"]');
    await expect(page).toHaveURL(/\/profile/);

    // Actualizar información personal
    await page.click('[data-testid="edit-profile"]');
    await page.fill('[name="phone"]', '+56987654321');
    await page.fill('[name="emergencyContact"]', 'María González - +56911223344');
    await page.selectOption('[name="smokingPreference"]', 'NO_SMOKING');
    await page.selectOption('[name="petPreference"]', 'SMALL_PETS');

    // Guardar cambios
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toContainText(/perfil.*actualizado/i);

    // Gestionar documentos
    await page.click('[data-testid="documents-tab"]');

    // Subir nuevo documento
    await page.click('[data-testid="upload-document"]');
    await page.selectOption('[name="documentType"]', 'INCOME_PROOF');
    await page.setInputFiles('input[type="file"]', './test-files/new-income-proof.pdf');
    await page.click('button[type="submit"]');

    // Verificar que se subió
    await expect(page.locator('.document-item')).toContainText('INCOME_PROOF');

    // Ver estado de verificación KYC
    await page.click('[data-testid="kyc-status"]');
    await expect(page.locator('.kyc-status')).toBeVisible();
    await expect(page.locator('.kyc-progress')).toBeVisible();
  });

  test('inquilino debería poder ver historial de búsquedas', async ({ page }) => {
    // Hacer algunas búsquedas
    await page.click('[data-testid="search-properties"]');

    // Primera búsqueda
    await page.selectOption('[name="city"]', 'Santiago');
    await page.fill('[name="maxPrice"]', '500000');
    await page.click('[data-testid="search-btn"]');

    // Segunda búsqueda
    await page.selectOption('[name="commune"]', 'Las Condes');
    await page.fill('[name="bedrooms"]', '3');
    await page.click('[data-testid="search-btn"]');

    // Ir a historial de búsquedas
    await page.click('[data-testid="search-history"]');

    // Verificar que aparecen las búsquedas recientes
    await expect(page.locator('.search-history-item')).toHaveLengthGreaterThan(0);

    // Verificar detalles de búsqueda
    const firstSearch = page.locator('.search-history-item').first();
    await expect(firstSearch).toContainText(/santiago|las condes/i);
    await expect(firstSearch.locator('.search-date')).toBeVisible();

    // Repetir búsqueda desde historial
    await page.click('.search-history-item:first-child .repeat-search-btn');
    await expect(page.locator('.property-card')).toHaveLengthGreaterThan(0);
  });

  test('inquilino debería poder configurar alertas de búsqueda', async ({ page }) => {
    // Ir a configuración de alertas
    await page.click('[data-testid="settings-menu"]');
    await page.click('[data-testid="search-alerts"]');

    // Crear nueva alerta
    await page.click('[data-testid="create-alert"]');

    // Configurar criterios
    await page.selectOption('[name="city"]', 'Santiago');
    await page.selectOption('[name="commune"]', 'Providencia');
    await page.fill('[name="minPrice"]', '350000');
    await page.fill('[name="maxPrice"]', '550000');
    await page.fill('[name="bedrooms"]', '2');
    await page.check('[name="furnished"]');

    // Configurar frecuencia
    await page.selectOption('[name="frequency"]', 'DAILY');

    // Configurar nombre de alerta
    await page.fill('[name="alertName"]', 'Departamentos Providencia');

    // Crear alerta
    await page.click('button[type="submit"]');

    // Verificar que se creó
    await expect(page.locator('.success-message')).toContainText(/alerta.*creada/i);

    // Verificar que aparece en lista de alertas
    await expect(page.locator('.alert-item')).toContainText('Departamentos Providencia');

    // Probar editar alerta
    await page.click('.alert-item:first-child .edit-btn');
    await page.fill('[name="maxPrice"]', '600000');
    await page.click('button[type="submit"]');

    // Verificar actualización
    await expect(page.locator('.alert-item')).toContainText('600.000');
  });

  test('inquilino debería poder ver y gestionar contratos activos', async ({ page }) => {
    // Ir a contratos
    await page.click('[data-testid="contracts-menu"]');
    await expect(page).toHaveURL(/\/contracts/);

    // Ver contratos activos
    await page.click('[data-testid="active-contracts"]');

    // Verificar que se muestran contratos
    const contractCards = page.locator('.contract-card');
    await expect(contractCards).toHaveLengthGreaterThan(0);

    // Ver detalles de contrato
    await page.click('.contract-card:first-child .view-details-btn');
    await expect(page).toHaveURL(/\/contracts\/[a-zA-Z0-9]+/);

    // Verificar información del contrato
    await expect(page.locator('.contract-property')).toBeVisible();
    await expect(page.locator('.contract-dates')).toBeVisible();
    await expect(page.locator('.contract-amount')).toBeVisible();
    await expect(page.locator('.contract-status')).toContainText(/activo|active/i);

    // Ver historial de pagos
    await page.click('[data-testid="payment-history"]');
    await expect(page.locator('.payment-record')).toHaveLengthGreaterThan(0);

    // Verificar que se pueden descargar documentos
    await page.click('[data-testid="download-contract"]');
    // Nota: En un test real verificaríamos la descarga del archivo

    // Crear solicitud de mantenimiento
    await page.click('[data-testid="maintenance-request"]');
    await page.selectOption('[name="type"]', 'ELECTRICAL');
    await page.selectOption('[name="priority"]', 'MEDIUM');
    await page.fill('[name="description"]', 'Interruptor de la cocina no funciona correctamente');
    await page.click('button[type="submit"]');

    // Verificar que se creó
    await expect(page.locator('.success-message')).toContainText(/solicitud.*creada/i);
  });
});
