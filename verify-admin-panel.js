// Script para verificar que el panel de administración existe y funciona
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando panel de administración...\n');

// Verificar que existe la ruta del admin
const adminPath = path.join(__dirname, 'src/app/admin');
if (fs.existsSync(adminPath)) {
  console.log('✅ Directorio admin existe:', adminPath);

  // Verificar archivos principales
  const mainFiles = ['page.tsx', 'layout.tsx'];
  mainFiles.forEach(file => {
    const filePath = path.join(adminPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Archivo ${file} existe`);
    } else {
      console.log(`❌ Archivo ${file} NO existe`);
    }
  });

  // Listar subdirectorios del admin
  const adminContents = fs.readdirSync(adminPath);
  const subdirs = adminContents.filter(item => {
    const itemPath = path.join(adminPath, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log('\n📁 Subdirectorios del panel admin:');
  subdirs.forEach(subdir => {
    console.log(`   - ${subdir}/`);
  });
} else {
  console.log('❌ Directorio admin NO existe');
}

// Verificar rutas de API de admin
const adminApiPath = path.join(__dirname, 'src/app/api/admin');
if (fs.existsSync(adminApiPath)) {
  console.log('\n✅ API de admin existe');

  const adminApiContents = fs.readdirSync(adminApiPath);
  console.log('📋 Endpoints de admin disponibles:');
  adminApiContents.forEach(item => {
    const itemPath = path.join(adminApiPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      console.log(`   - /api/admin/${item}`);
    }
  });
} else {
  console.log('\n❌ API de admin NO existe');
}

// Verificar si hay algún endpoint para crear usuarios
const userEndpoints = ['src/app/api/admin/users', 'src/app/api/users', 'src/app/api/auth/register'];

console.log('\n👥 Verificación de endpoints para gestión de usuarios:');
userEndpoints.forEach(endpoint => {
  const endpointPath = path.join(__dirname, endpoint);
  if (fs.existsSync(endpointPath)) {
    console.log(`✅ ${endpoint} - EXISTE`);

    // Verificar si hay route.ts
    const routeFile = path.join(endpointPath, 'route.ts');
    if (fs.existsSync(routeFile)) {
      console.log(`   └─ route.ts: ✅`);
    } else {
      console.log(`   └─ route.ts: ❌`);
    }
  } else {
    console.log(`❌ ${endpoint} - NO EXISTE`);
  }
});

console.log('\n🎯 RESUMEN:');
console.log('Para crear el usuario administrador:');
console.log('1. Configure los datos en create-real-users.js');
console.log('2. Ejecute: node create-real-users.js');
console.log('3. Inicie sesión como admin en /auth/login');
console.log('4. Acceda al panel /admin para crear más usuarios');
