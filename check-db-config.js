console.log('🔍 Verificando configuración de base de datos...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada');

if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log('Protocolo:', url.startsWith('postgresql://') ? 'PostgreSQL' : 'Otro');
  console.log(
    'Contiene DigitalOcean:',
    url.includes('digitalocean') || url.includes('do') ? 'Sí' : 'No'
  );
}

console.log('NODE_ENV:', process.env.NODE_ENV || 'desarrollo');

// Verificar si hay .env o .env.local
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

console.log('Archivo .env existe:', fs.existsSync(envPath) ? 'Sí' : 'No');
console.log('Archivo .env.local existe:', fs.existsSync(envLocalPath) ? 'Sí' : 'No');
