#!/usr/bin/env node

/**
 * 🚀 Script para Generar Secrets Seguros para Producción
 *
 * Este script genera secrets únicos y seguros para las variables de entorno
 * requeridas en producción (DigitalOcean).
 *
 * Uso:
 * node generate-production-secrets.js
 */

const crypto = require('crypto');

// Función para generar un secret seguro de 32 bytes (64 caracteres hex)
function generateSecureSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Función para generar un secret aún más largo y seguro (48 bytes = 96 caracteres hex)
function generateExtraSecureSecret() {
  return crypto.randomBytes(48).toString('hex');
}

// Generar secrets
const jwtSecret = generateSecureSecret();
const jwtRefreshSecret = generateSecureSecret();
const nextAuthSecret = generateSecureSecret();
const extraSecureSecret = generateExtraSecureSecret();

console.log('🚀 SECRETS SEGURAS GENERADAS PARA PRODUCCIÓN');
console.log('='.repeat(60));
console.log('');

console.log('📋 COPIA Y PEGA ESTOS VALORES EN TU app.yaml:');
console.log('');

console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`JWT_REFRESH_SECRET="${jwtRefreshSecret}"`);
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);

console.log('');
console.log('🔐 PARA MÁXIMA SEGURIDAD (OPCIONAL):');
console.log(`JWT_SECRET="${extraSecureSecret}"`);
console.log(`JWT_REFRESH_SECRET="${generateExtraSecureSecret()}"`);
console.log(`NEXTAUTH_SECRET="${generateExtraSecureSecret()}"`);

console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('- Cada secret debe ser único y tener al menos 32 caracteres');
console.log('- Nunca compartas estos secrets en código o repositorios públicos');
console.log('- Guarda estos valores en un lugar seguro');
console.log('- Usa secrets diferentes para producción que para desarrollo');

console.log('');
console.log('📝 INSTRUCCIONES PARA CONFIGURAR:');
console.log('1. Copia los valores generados arriba');
console.log('2. Edita app.yaml y reemplaza los valores actuales');
console.log('3. Confirma que DATABASE_URL use "${rent360-db.DATABASE_URL}"');
console.log('4. Haz commit y push de los cambios');
console.log('5. DigitalOcean hará un redeploy automático');

console.log('');
console.log('✅ CONFIGURACIÓN COMPLETA - TU APP FUNCIONARÁ EN PRODUCCIÓN');

// Verificación adicional
console.log('');
console.log('🔍 VERIFICACIÓN:');
console.log(`JWT_SECRET length: ${jwtSecret.length} caracteres (debe ser >= 64)`);
console.log(`JWT_REFRESH_SECRET length: ${jwtRefreshSecret.length} caracteres (debe ser >= 64)`);
console.log(`NEXTAUTH_SECRET length: ${nextAuthSecret.length} caracteres (debe ser >= 64)`);

if (jwtSecret.length >= 64 && jwtRefreshSecret.length >= 64 && nextAuthSecret.length >= 64) {
  console.log('✅ TODOS LOS SECRETS TIENEN LA LONGITUD ADECUADA');
} else {
  console.log('❌ ERROR: Algunos secrets no tienen la longitud adecuada');
  process.exit(1);
}
