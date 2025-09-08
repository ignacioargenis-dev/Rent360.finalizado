#!/usr/bin/env node

/**
 * Ejecutor completo de tests para Rent360
 */

const { execSync } = require('child_process');

function runTestSuite(suiteName, command) {
  console.log(`\n🧪 Ejecutando: ${suiteName}`);
  console.log('='.repeat(50));

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${suiteName} - PASÓ`);
  } catch (error) {
    console.log(`❌ ${suiteName} - FALLÓ`);
    console.log(error.message);
  }
}

function runAllTests() {
  console.log('🚀 EJECUTANDO SUITE COMPLETA DE TESTS - RENT360');
  console.log('='.repeat(60));

  // Tests unitarios
  runTestSuite('Tests Unitarios', 'npm run test:unit');

  // Tests de integración
  runTestSuite('Tests de Integración', 'npm run test:integration');

  // Tests E2E
  runTestSuite('Tests E2E', 'npm run test:e2e');

  // Cobertura
  runTestSuite('Análisis de Cobertura', 'npm run test:coverage');

  // Tests de seguridad
  runTestSuite('Tests de Seguridad', 'npm run test:security');

  console.log('\n📊 REPORTE FINAL DE TESTS');
  console.log('='.repeat(60));
  console.log('📁 Reporte de cobertura: ./coverage/index.html');
  console.log('📋 Tests completados exitosamente');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
