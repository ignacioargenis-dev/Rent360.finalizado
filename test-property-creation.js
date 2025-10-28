// Script para probar la creación de propiedades y diagnosticar el error
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

async function testPropertyCreation() {
  console.log('🏠 Probando creación de propiedades...\n');

  // Primero, verificar que hay usuarios OWNER disponibles
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Verificar usuarios OWNER
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER', isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log('👥 Usuarios OWNER disponibles:');
    if (owners.length === 0) {
      console.log('❌ No hay usuarios OWNER activos para crear propiedades');
      console.log('💡 Necesitas crear un usuario OWNER primero');
      return;
    }

    owners.forEach((owner, index) => {
      console.log(`${index + 1}. ${owner.email} - ${owner.name} (ID: ${owner.id})`);
    });

    // Usar el primer OWNER disponible
    const testOwner = owners[0];
    console.log(`\n🎯 Usando OWNER: ${testOwner.email}\n`);

    // Crear datos de prueba para la propiedad
    const propertyData = {
      title: 'Propiedad de Prueba - Test Creation',
      description:
        'Esta es una propiedad de prueba para diagnosticar el error de creación. Incluye descripción detallada para validar el procesamiento.',
      address: 'Calle de Prueba 123',
      city: 'Santiago',
      commune: 'Providencia',
      region: 'Metropolitana',
      price: 500000,
      deposit: 500000,
      bedrooms: 2,
      bathrooms: 1,
      area: 60,
      type: 'APARTMENT',
      features: JSON.stringify(['Wifi', 'Estacionamiento']),
      furnished: 'false',
      petFriendly: 'true',
      parkingSpaces: '1',
    };

    console.log('📝 Datos de propiedad a crear:');
    Object.entries(propertyData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    // Crear FormData simulado
    const FormData = require('form-data');
    const formData = new FormData();

    // Agregar todos los campos
    Object.entries(propertyData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Agregar ownerId (esto es crítico)
    formData.append('ownerId', testOwner.id);

    console.log('🔐 Enviando con ownerId:', testOwner.id);
    console.log('🌐 URL: https://rent360management-2yxgz.ondigitalocean.app/api/properties');
    console.log('');

    // Hacer la petición HTTP
    const https = require('https');
    const url = require('url');

    const parsedUrl = url.parse(
      'https://rent360management-2yxgz.ondigitalocean.app/api/properties'
    );

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Rent360-Test-Script/1.0',
      },
    };

    console.log('📡 Enviando petición POST...');

    const req = https.request(options, res => {
      console.log(`📡 Respuesta del servidor: ${res.statusCode} ${res.statusMessage}`);

      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📄 Respuesta completa:');
        console.log(data);
        console.log('');

        try {
          const jsonResponse = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Propiedad creada exitosamente!');
            console.log('🏠 ID de propiedad:', jsonResponse.property?.id || 'No disponible');
          } else {
            console.log('❌ Error en creación:', jsonResponse.error || jsonResponse.message);
          }
        } catch (e) {
          console.log('❌ Error parseando respuesta JSON');
          console.log('Respuesta raw:', data);
        }
      });
    });

    req.on('error', error => {
      console.error('❌ Error en la petición HTTP:', error.message);
    });

    // Enviar el FormData
    formData.pipe(req);
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPropertyCreation();
