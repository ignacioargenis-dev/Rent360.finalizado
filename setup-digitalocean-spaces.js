#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuración por defecto
const DEFAULT_CONFIG = {
  region: 'nyc3',
  bucket: 'rent360-images',
  endpoint: 'https://nyc3.digitaloceanspaces.com',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

async function setupDigitalOceanSpaces() {
  console.log('🚀 Configuración de DigitalOcean Spaces para Rent360');
  console.log('==================================================\n');

  console.log('PASO 1: Crear DigitalOcean Space');
  console.log('--------------------------------');
  console.log('1. Ve a https://cloud.digitalocean.com/spaces');
  console.log('2. Haz clic en "Create" > "Spaces"');
  console.log('3. Configura:');
  console.log('   - Name: rent360-images');
  console.log('   - Region: NYC3 (o la más cercana)');
  console.log('   - File listing: Private');
  console.log('   - CDN: Enabled (opcional, mejora performance)');
  console.log('\n');

  await askQuestion('¿Ya creaste el Space? Presiona Enter para continuar...\n');

  console.log('\nPASO 2: Generar Access Keys');
  console.log('---------------------------');
  console.log('1. Ve a https://cloud.digitalocean.com/account/api/spaces');
  console.log('2. Haz clic en "Generate New Key"');
  console.log('3. Nombre: "rent360-spaces-key"');
  console.log('4. Copia el Access Key y Secret Key\n');

  const accessKey = await askQuestion('Ingresa tu Access Key: ');
  const secretKey = await askQuestion('Ingresa tu Secret Key: ');

  if (!accessKey || !secretKey) {
    console.error('❌ Access Key y Secret Key son requeridos');
    process.exit(1);
  }

  console.log('\nPASO 3: Configurar permisos del Space');
  console.log('-------------------------------------');
  console.log('1. Ve al Space creado (rent360-images)');
  console.log('2. Ve a Settings > CORS Policies');
  console.log('3. Agrega esta política CORS:');
  console.log(
    JSON.stringify(
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
        AllowedOrigins: ['*'],
        ExposeHeaders: [],
        MaxAgeSeconds: 3000,
      },
      null,
      2
    )
  );
  console.log('\n');

  await askQuestion('¿Configuraste CORS? Presiona Enter para continuar...\n');

  console.log('\nPASO 4: Configurar variables de entorno');
  console.log('----------------------------------------');

  const envConfig = {
    DO_SPACES_ACCESS_KEY: accessKey,
    DO_SPACES_SECRET_KEY: secretKey,
    DO_SPACES_BUCKET: DEFAULT_CONFIG.bucket,
    DO_SPACES_REGION: DEFAULT_CONFIG.region,
    DO_SPACES_ENDPOINT: DEFAULT_CONFIG.endpoint,
    CLOUD_STORAGE_PROVIDER: 'digitalocean_spaces',
  };

  // Verificar si existe .env.local o .env
  const envFiles = ['.env.local', '.env', '.env.production'];
  let envFile = null;

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      envFile = file;
      break;
    }
  }

  if (!envFile) {
    envFile = '.env.local';
    console.log(`Creando archivo ${envFile}...`);
  } else {
    console.log(`Actualizando archivo existente ${envFile}...`);
  }

  // Leer archivo existente si existe
  let existingContent = '';
  if (fs.existsSync(envFile)) {
    existingContent = fs.readFileSync(envFile, 'utf8');
  }

  // Agregar/actualizar variables
  let updatedContent = existingContent;
  for (const [key, value] of Object.entries(envConfig)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;

    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(regex, newLine);
    } else {
      updatedContent += `\n${newLine}`;
    }
  }

  // Limpiar líneas vacías extras
  updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  fs.writeFileSync(envFile, updatedContent, 'utf8');
  console.log(`✅ Variables de entorno guardadas en ${envFile}`);

  console.log('\nPASO 5: Probar conexión');
  console.log('-----------------------');

  try {
    // Intentar importar y probar la conexión
    const { getCloudStorageService } = require('./src/lib/cloud-storage');

    console.log('🔍 Probando conexión con DigitalOcean Spaces...');

    const cloudStorage = getCloudStorageService();

    // Intentar crear un archivo de prueba
    const testKey = 'test-connection.txt';
    const testResult = await cloudStorage.uploadFile(
      Buffer.from('Test connection - ' + new Date().toISOString()),
      testKey,
      'text/plain'
    );

    console.log('✅ Conexión exitosa!');
    console.log(`📁 Archivo de prueba creado: ${testResult.url}`);

    // Limpiar archivo de prueba
    await cloudStorage.deleteFile(testKey);
    console.log('🧹 Archivo de prueba eliminado');
  } catch (error) {
    console.error('❌ Error en la conexión:', error.message);
    console.log('\n🔧 Solución posible:');
    console.log('1. Verifica que las credenciales sean correctas');
    console.log('2. Asegúrate de que el Space existe');
    console.log('3. Verifica los permisos del Space');
    console.log('4. Revisa la configuración CORS');
    process.exit(1);
  }

  console.log('\n🎉 ¡Configuración completada exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Ejecutar migración: node migrate-images-to-cloud.js');
  console.log('2. Actualizar código: reemplazar route.ts con route-cloud.ts');
  console.log('3. Hacer deploy a producción');

  console.log('\n💰 Costo estimado: ~$1.25/mes');
  console.log('⚡ Beneficio: 99.9% disponibilidad + escalabilidad infinita');

  rl.close();
}

// Ejecutar configuración
setupDigitalOceanSpaces().catch(error => {
  console.error('❌ Error en configuración:', error);
  rl.close();
  process.exit(1);
});
