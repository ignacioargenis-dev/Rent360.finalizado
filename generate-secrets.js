// Script para generar secrets seguros
const crypto = require('crypto');

// Generar JWT Secret (32 bytes = 64 caracteres hex)
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
const nextAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('🔐 Secrets generados para producción:');
console.log('');
console.log('JWT_SECRET:', jwtSecret);
console.log('JWT_REFRESH_SECRET:', jwtRefreshSecret);
console.log('NEXTAUTH_SECRET:', nextAuthSecret);
console.log('');
console.log('📋 Copia estos valores y configúralos en DigitalOcean App Platform');
console.log('   Ve a tu App → Environment Variables → Add Variable');
