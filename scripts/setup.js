#!/usr/bin/env node

/**
 * Script de configuración automática para Rent360
 * Este script configura el entorno de desarrollo automáticamente
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando Rent360...\n');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function checkNodeVersion() {
  logStep(1, 'Verificando versión de Node.js');

  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 18) {
    logError(`Node.js ${nodeVersion} detectado. Se requiere Node.js 18 o superior.`);
    process.exit(1);
  }

  logSuccess(`Node.js ${nodeVersion} detectado`);
}

function installDependencies() {
  logStep(2, 'Instalando dependencias');

  try {
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependencias instaladas correctamente');
  } catch (error) {
    logError('Error al instalar dependencias');
    process.exit(1);
  }
}

function setupEnvironment() {
  logStep(3, 'Configurando variables de entorno');

  const envExamplePath = path.join(process.cwd(), 'env.example');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envExamplePath)) {
    logError('Archivo env.example no encontrado');
    process.exit(1);
  }

  if (fs.existsSync(envLocalPath)) {
    logWarning('Archivo .env.local ya existe. ¿Deseas sobrescribirlo? (y/N)');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('', answer => {
      rl.close();
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        copyEnvFile();
      } else {
        logSuccess('Archivo .env.local preservado');
        setupDatabase();
      }
    });
  } else {
    copyEnvFile();
  }
}

function copyEnvFile() {
  const envExamplePath = path.join(process.cwd(), 'env.example');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  try {
    fs.copyFileSync(envExamplePath, envLocalPath);
    logSuccess('Archivo .env.local creado');

    // Generar secretos JWT seguros
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const crypto = require('crypto');

    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

    const updatedContent = envContent
      .replace(/JWT_SECRET="[^"]*"/, `JWT_SECRET="${jwtSecret}"`)
      .replace(/JWT_REFRESH_SECRET="[^"]*"/, `JWT_REFRESH_SECRET="${jwtRefreshSecret}"`);

    fs.writeFileSync(envLocalPath, updatedContent);
    logSuccess('Secretos JWT generados automáticamente');

    setupDatabase();
  } catch (error) {
    logError('Error al crear archivo .env.local');
    process.exit(1);
  }
}

function setupDatabase() {
  logStep(4, 'Configurando base de datos');

  try {
    // Generar cliente de Prisma
    execSync('npm run db:generate', { stdio: 'inherit' });
    logSuccess('Cliente de Prisma generado');

    // Sincronizar esquema con la base de datos
    execSync('npm run db:push', { stdio: 'inherit' });
    logSuccess('Esquema de base de datos sincronizado');

    createSeedData();
  } catch (error) {
    logError('Error al configurar la base de datos');
    process.exit(1);
  }
}

function createSeedData() {
  logStep(5, 'Creando datos de prueba');

  try {
    execSync('npm run seed', { stdio: 'inherit' });
    logSuccess('Datos de prueba creados');

    finalizeSetup();
  } catch (error) {
    logWarning('Error al crear datos de prueba (continuando...)');
    finalizeSetup();
  }
}

function finalizeSetup() {
  logStep(6, 'Finalizando configuración');

  logSuccess('¡Configuración completada!');
  log('\n🎉 Rent360 está listo para usar', 'bright');

  log('\n📋 Próximos pasos:', 'yellow');
  log('1. Revisa y configura las variables en .env.local');
  log('2. Ejecuta: npm run dev');
  log('3. Abre: http://localhost:3000');

  log('\n👥 Usuarios de prueba:', 'yellow');
  log('• Admin: admin@rent360.cl / 12345678 (Carlos Rodríguez)');
  log('• Propietario: propietario@rent360.cl / 12345678 (María González)');
  log('• Inquilino: inquilino@rent360.cl / 12345678 (Pedro Sánchez)');
  log('• Corredor: corredor@rent360.cl / 12345678 (Ana Martínez)');
  log('• Runner: runner@rent360.cl / 12345678 (Diego López)');
  log('• Soporte: soporte@rent360.cl / 12345678 (Soporte Rent360)');
  log('• Proveedor: proveedor@rent360.cl / 12345678 (ServicioExpress Ltda)');
  log('• Mantención: mantenimiento@rent360.cl / 12345678 (Mantención Total SpA)');

  log('\n📚 Documentación:', 'yellow');
  log('• README.md - Guía de instalación');
  log('• DOCUMENTATION.md - Documentación técnica');

  log('\n🔧 Scripts disponibles:', 'yellow');
  log('• npm run dev - Servidor de desarrollo');
  log('• npm run build - Construir para producción');
  log('• npm run db:studio - Abrir Prisma Studio');
  log('• npm run lint - Verificar código');

  log('\n✨ ¡Disfruta desarrollando con Rent360!', 'bright');
}

// Ejecutar configuración
try {
  checkNodeVersion();
  installDependencies();
  setupEnvironment();
} catch (error) {
  logError('Error durante la configuración');
  console.error(error);
  process.exit(1);
}
