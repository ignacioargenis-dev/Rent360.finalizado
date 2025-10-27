// Script para probar el registro en PRODUCCIÓN (DigitalOcean)
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno de DigitalOcean
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

async function testProductionRegistration() {
  console.log('🌐 Probando registro en PRODUCCIÓN (DigitalOcean)...\n');

  // URL de producción
  const baseUrl = 'https://rent360management-2yxgz.ondigitalocean.app';

  // Datos de prueba para registro
  const testUser = {
    name: 'Usuario Producción Test',
    email: `prod-test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    role: 'TENANT',
    rut: '98765432-1',
    phone: '+56912345678',
  };

  console.log('📝 Datos de registro para producción:');
  console.log(`   - Email: ${testUser.email}`);
  console.log(`   - Nombre: ${testUser.name}`);
  console.log(`   - Rol: ${testUser.role}`);
  console.log(`   - URL: ${baseUrl}/api/auth/register`);
  console.log('');

  try {
    // 1. Probar registro en producción
    console.log('1️⃣ PASO 1: Registrando usuario en producción...');

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Rent360-Test-Script/1.0',
      },
      body: JSON.stringify({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        role: testUser.role,
        rut: testUser.rut,
        phone: testUser.phone,
      }),
    });

    console.log(
      `📡 Respuesta del servidor: ${registerResponse.status} ${registerResponse.statusText}`
    );

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.log('❌ Error en registro:');
      console.log('Código:', registerResponse.status);
      console.log('Respuesta:', errorText.substring(0, 500));
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ Registro exitoso en producción!');
    console.log('📄 Respuesta:', JSON.stringify(registerData, null, 2));
    console.log('');

    // 2. Verificar que se creó en DigitalOcean
    console.log('2️⃣ PASO 2: Verificando creación en DigitalOcean...');

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.$connect();
    console.log('✅ Conexión a DigitalOcean exitosa');

    // Buscar el usuario recién creado
    const createdUser = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (createdUser) {
      console.log('✅ USUARIO CREADO EXITOSAMENTE EN DIGITALOCEAN!');
      console.log(`   ├─ ID: ${createdUser.id}`);
      console.log(`   ├─ Email: ${createdUser.email}`);
      console.log(`   ├─ Nombre: ${createdUser.name}`);
      console.log(`   ├─ Rol: ${createdUser.role}`);
      console.log(`   ├─ Activo: ${createdUser.isActive}`);
      console.log(`   ├─ Email verificado: ${createdUser.emailVerified}`);
      console.log(`   └─ Creado: ${createdUser.createdAt}`);
      console.log('');

      // 3. Probar login
      console.log('3️⃣ PASO 3: Probando login en producción...');

      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Rent360-Test-Script/1.0',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      console.log(`📡 Respuesta de login: ${loginResponse.status} ${loginResponse.statusText}`);

      if (loginResponse.ok) {
        console.log('✅ LOGIN EXITOSO EN PRODUCCIÓN!');
        console.log('Esto confirma que el registro público funciona correctamente.');
        console.log('');
      } else {
        const loginError = await loginResponse.text();
        console.log('⚠️ Login falló, pero el usuario existe en BD:', loginError.substring(0, 200));
      }

      // Limpiar usuario de prueba
      await prisma.user.delete({
        where: { id: createdUser.id },
      });
      console.log('🧹 Usuario de prueba eliminado');
    } else {
      console.log('❌ ERROR CRÍTICO: Usuario NO encontrado en DigitalOcean');
      console.log('Esto significa que el registro público NO está guardando en la BD correcta');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testProductionRegistration();
