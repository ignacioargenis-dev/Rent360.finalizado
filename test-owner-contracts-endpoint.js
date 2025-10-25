/**
 * Script de Prueba: Endpoint /api/owner/contracts
 *
 * Simula la llamada que hace el frontend para obtener contratos del propietario
 */

const fetch = require('node-fetch');

async function testEndpoint() {
  console.log('🧪 TEST: Endpoint /api/owner/contracts\n');
  console.log('='.repeat(80));

  const propietarioEmail = 'ignacio.antonio.b@hotmail.com';

  console.log(`\n📋 Simulando petición del propietario: ${propietarioEmail}`);
  console.log('-'.repeat(80));

  try {
    // Primero, hacer login para obtener el token
    console.log('\n1️⃣ Paso 1: Login');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: propietarioEmail,
        password: 'tu_password_aqui', // ⚠️ Reemplazar con la contraseña real
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ ERROR: No se pudo hacer login');
      console.log('   Status:', loginResponse.status);
      console.log(
        '   ⚠️ NOTA: Este script necesita que la aplicación esté corriendo en localhost:3000'
      );
      console.log(
        '   ⚠️ NOTA: Debes reemplazar "tu_password_aqui" con la contraseña real del propietario'
      );
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');

    // Extraer cookies del login
    const cookies = loginResponse.headers.raw()['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    console.log('\n2️⃣ Paso 2: Llamar a /api/owner/contracts');

    const contractsResponse = await fetch('http://localhost:3000/api/owner/contracts', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Cookie: cookieHeader,
      },
    });

    if (!contractsResponse.ok) {
      console.log('❌ ERROR: Falló la petición a /api/owner/contracts');
      console.log('   Status:', contractsResponse.status);
      const errorText = await contractsResponse.text();
      console.log('   Response:', errorText);
      return;
    }

    const contractsData = await contractsResponse.json();

    console.log('\n✅ Respuesta exitosa del endpoint:');
    console.log('-'.repeat(80));
    console.log(`Total de contratos: ${contractsData.total || 0}`);
    console.log(`Contratos en array: ${contractsData.contracts?.length || 0}`);

    if (contractsData.contracts && contractsData.contracts.length > 0) {
      console.log('\n📋 Detalles de los contratos:');
      contractsData.contracts.forEach((contract, index) => {
        console.log(`\nContrato ${index + 1}:`);
        console.log(`  - ID: ${contract.id}`);
        console.log(`  - Número: ${contract.contractNumber}`);
        console.log(`  - Estado: ${contract.status}`);
        console.log(`  - Propiedad: ${contract.property?.title || 'Sin título'}`);
        console.log(`  - Inquilino: ${contract.tenantName || 'Sin nombre'}`);
        console.log(`  - Email inquilino: ${contract.tenantEmail || 'Sin email'}`);
        console.log(`  - Renta mensual: ${contract.monthlyRent || 0}`);
      });
    } else {
      console.log('\n⚠️ No se encontraron contratos en la respuesta');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ El endpoint /api/owner/contracts está funcionando correctamente');
    console.log('📝 Si el propietario no ve contratos en el frontend:');
    console.log(
      '   1. Verificar que el filtro de estado esté en "Todos los Estados" o "Borradores"'
    );
    console.log('   2. Verificar en la consola del navegador si hay errores JavaScript');
    console.log('   3. Verificar en Network del navegador la respuesta del endpoint');
  } catch (error) {
    console.error('\n❌ ERROR durante la prueba:');
    console.error(error.message);
    console.log('\n⚠️ NOTA: Este script requiere que:');
    console.log('   1. La aplicación esté corriendo en localhost:3000');
    console.log('   2. Hayas ejecutado "npm run dev" antes');
    console.log('   3. Hayas reemplazado "tu_password_aqui" con la contraseña real');
  }

  console.log('\n' + '='.repeat(80));
}

// Ejecutar directamente si no hay login
async function testDirecto() {
  console.log('\n🔍 ALTERNATIVA: Verificar directamente en la base de datos');
  console.log('='.repeat(80));

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const propietario = await prisma.user.findUnique({
      where: { email: 'ignacio.antonio.b@hotmail.com' },
    });

    if (!propietario) {
      console.log('❌ Propietario no encontrado');
      return;
    }

    const contracts = await prisma.contract.findMany({
      where: {
        OR: [{ ownerId: propietario.id }, { property: { ownerId: propietario.id } }],
      },
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true, email: true } },
      },
    });

    console.log(`\n✅ Contratos encontrados directamente en BD: ${contracts.length}`);

    contracts.forEach((contract, index) => {
      console.log(`\nContrato ${index + 1}:`);
      console.log(`  - ID: ${contract.id}`);
      console.log(`  - Número: ${contract.contractNumber}`);
      console.log(`  - Estado: ${contract.status}`);
      console.log(`  - Propiedad: ${contract.property?.title || 'Sin título'}`);
      console.log(
        `  - Inquilino: ${contract.tenant?.name || 'Sin nombre'} (${contract.tenant?.email || 'Sin email'})`
      );
    });

    console.log('\n📊 CONCLUSIÓN:');
    console.log(`   El propietario DEBERÍA ver ${contracts.length} contrato(s) en su dashboard`);
    console.log('   Si no los ve, el problema está en el frontend o en la autenticación');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test directo por defecto
testDirecto();
