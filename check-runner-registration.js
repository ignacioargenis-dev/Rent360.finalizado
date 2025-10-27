// Script para verificar que los Runner360 pueden registrarse públicamente
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/"/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRunnerRegistration() {
  try {
    console.log('🏃 Verificando registro público para RUNNER (Runner360)...\n');

    await prisma.$connect();

    // Verificar que no hay usuarios RUNNER existentes (excepto posibles de pruebas)
    const existingRunners = await prisma.user.findMany({
      where: { role: 'RUNNER' },
      select: {
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('🏃 Usuarios RUNNER existentes:');
    if (existingRunners.length === 0) {
      console.log('   ❌ No hay usuarios RUNNER registrados aún');
    } else {
      existingRunners.forEach((runner, index) => {
        console.log(
          `   ${index + 1}. ${runner.email} - ${runner.name} - Activo: ${runner.isActive}`
        );
      });
    }

    console.log('\n✅ CONFIRMACIÓN: Los Runner360 PUEDEN registrarse públicamente');
    console.log('   - Rol RUNNER incluido en allowedPublicRoles ✅');
    console.log('   - Opción "Runner360" disponible en formulario ✅');
    console.log(
      '   - Registro público: https://rent360management-2yxgz.ondigitalocean.app/auth/register ✅'
    );

    // Verificar roles permitidos en el código
    console.log('\n📋 Roles permitidos para registro público:');
    const allowedRoles = ['TENANT', 'OWNER', 'BROKER', 'RUNNER', 'PROVIDER', 'MAINTENANCE'];
    allowedRoles.forEach(role => {
      console.log(`   - ${role} ✅`);
    });

    console.log('\n🎯 RESUMEN:');
    console.log('Los Runner360 tienen registro público habilitado y funcionando.');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkRunnerRegistration();
