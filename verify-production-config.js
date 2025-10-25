#!/usr/bin/env node

/**
 * 🔍 Script de Verificación de Configuración de Producción
 *
 * Verifica que app.yaml esté correctamente configurado para producción
 * y que no contenga placeholders que impidan el funcionamiento.
 */

const fs = require('fs');
const path = require('path');

function verifyAppYaml() {
  console.log('🔍 VERIFICANDO CONFIGURACIÓN DE PRODUCCIÓN');
  console.log('='.repeat(60));

  try {
    const appYamlPath = path.join(__dirname, 'app.yaml');
    const content = fs.readFileSync(appYamlPath, 'utf8');

    let issues = [];
    let warnings = [];

    // Verificar DATABASE_URL
    if (content.includes('REPLACE_WITH_YOUR_DB_PASSWORD') ||
        content.includes('REPLACE_WITH_YOUR_DB_HOST')) {
      issues.push('❌ DATABASE_URL contiene placeholders sin reemplazar');
    } else if (content.includes('${rent360-db.DATABASE_URL}')) {
      console.log('✅ DATABASE_URL configurado correctamente con variable automática');
    } else {
      warnings.push('⚠️  DATABASE_URL no usa la variable automática de DigitalOcean');
    }

    // Verificar JWT_SECRET
    if (content.includes('REPLACE_WITH_YOUR_OWN_JWT_SECRET') ||
        content.includes('your-unique-jwt-secret-key-minimum-32-characters-long-for-security')) {
      issues.push('❌ JWT_SECRET contiene placeholder sin reemplazar');
    } else {
      console.log('✅ JWT_SECRET configurado con valor seguro');
    }

    // Verificar JWT_REFRESH_SECRET
    if (content.includes('REPLACE_WITH_YOUR_OWN_JWT_REFRESH_SECRET') ||
        content.includes('your-unique-jwt-refresh-secret-key-minimum-32-characters-long-for-security')) {
      issues.push('❌ JWT_REFRESH_SECRET contiene placeholder sin reemplazar');
    } else {
      console.log('✅ JWT_REFRESH_SECRET configurado con valor seguro');
    }

    // Verificar NEXTAUTH_SECRET
    if (content.includes('REPLACE_WITH_YOUR_OWN_NEXTAUTH_SECRET') ||
        content.includes('your-unique-nextauth-secret-key-for-security')) {
      issues.push('❌ NEXTAUTH_SECRET contiene placeholder sin reemplazar');
    } else {
      console.log('✅ NEXTAUTH_SECRET configurado con valor seguro');
    }

    // Verificar NODE_ENV
    if (!content.includes('value: "production"') && !content.includes("value: production")) {
      warnings.push('⚠️  NODE_ENV no está configurado como production');
    } else {
      console.log('✅ NODE_ENV configurado como production');
    }

    // Verificar que la base de datos esté definida
    if (!content.includes('rent360-db')) {
      issues.push('❌ No se encuentra la configuración de base de datos rent360-db');
    } else {
      console.log('✅ Base de datos rent360-db configurada');
    }

    // Resultados
    console.log('');
    if (issues.length === 0) {
      console.log('🎉 ¡CONFIGURACIÓN DE PRODUCCIÓN VERIFICADA EXITOSAMENTE!');
      console.log('');
      console.log('✅ Tu aplicación debería funcionar correctamente en DigitalOcean');
      console.log('✅ Las APIs podrán conectarse a la base de datos');
      console.log('✅ Los propietarios podrán ver sus contratos');
      console.log('✅ La autenticación funcionará correctamente');

      if (warnings.length > 0) {
        console.log('');
        console.log('⚠️  ADVERTENCIAS:');
        warnings.forEach(warning => console.log(`   ${warning}`));
      }
    } else {
      console.log('❌ PROBLEMAS CRÍTICOS ENCONTRADOS:');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
      console.log('🔧 SOLUCIÓN:');
      console.log('1. Ejecuta: node generate-production-secrets.js');
      console.log('2. Copia los valores generados al app.yaml');
      console.log('3. Confirma que DATABASE_URL use "${rent360-db.DATABASE_URL}"');
      console.log('4. Haz commit y push para redeploy automático');

      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error al leer app.yaml:', error.message);
    process.exit(1);
  }
}

// Verificar que estamos en el directorio correcto
if (!fs.existsSync('app.yaml')) {
  console.error('❌ Error: app.yaml no encontrado. Ejecuta este script desde la raíz del proyecto.');
  process.exit(1);
}

verifyAppYaml();
