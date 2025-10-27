// Script para verificar exactamente dónde están los usuarios que dice el usuario que existen
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

async function verifyUserExistence() {
  try {
    console.log('🔍 VERIFICACIÓN COMPLETA DE EXISTENCIA DE USUARIOS\n');

    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // Verificar configuración actual
    console.log(
      `📍 DATABASE_URL actual: ${process.env.DATABASE_URL ? 'Configurada' : 'NO CONFIGURADA'}`
    );
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      if (url.includes('digitalocean')) {
        console.log('🎯 Base de datos: DigitalOcean PostgreSQL');
      } else if (url.startsWith('postgresql://')) {
        console.log('🎯 Base de datos: PostgreSQL (otro proveedor)');
      } else if (url.startsWith('file:')) {
        console.log('🎯 Base de datos: SQLite');
      } else {
        console.log('🎯 Base de datos: Desconocida');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('RESULTADOS DE LA INVESTIGACIÓN:');
    console.log('='.repeat(60));

    // 1. Verificar usuarios totales
    const totalUsers = await prisma.user.count();
    console.log(`\n1. 👥 TOTAL DE USUARIOS EN BD: ${totalUsers}`);

    // 2. Listar todos los usuarios
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n2. 📋 LISTA COMPLETA DE USUARIOS:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ├─ Nombre: ${user.name || 'Sin nombre'}`);
      console.log(`   ├─ Rol: ${user.role}`);
      console.log(`   ├─ Activo: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   ├─ Email verificado: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`   ├─ Último login: ${user.lastLogin || 'Nunca'}`);
      console.log(`   ├─ Propiedades: ${user._count.properties}`);
      console.log(
        `   ├─ Contratos: ${user._count.contractsAsOwner + user._count.contractsAsTenant}`
      );
      console.log(`   └─ Creado: ${user.createdAt}`);
      console.log('');
    });

    // 3. Verificar usuarios específicos
    const targetUsers = [
      'ignacio.antonio.b@hotmail.com',
      'ingerlisesg@gmail.com',
      'lucbjork@gmail.com',
    ];
    console.log('3. 🎯 BÚSQUEDA DE USUARIOS ESPECÍFICOS:');
    let foundCount = 0;
    targetUsers.forEach(email => {
      const user = allUsers.find(u => u.email === email);
      if (user) {
        console.log(`   ✅ ENCONTRADO: ${email} - ${user.name} - ${user.role}`);
        foundCount++;
      } else {
        console.log(`   ❌ NO ENCONTRADO: ${email}`);
      }
    });

    if (foundCount === 0) {
      console.log('\n   🚨 RESULTADO: NINGUNO de los usuarios específicos existe en la BD actual');
    }

    // 4. Verificar actividad del sistema
    const propertiesCount = await prisma.property.count();
    const contractsCount = await prisma.contract.count();
    const messagesCount = await prisma.message.count();

    console.log('\n4. 📊 ACTIVIDAD DEL SISTEMA:');
    console.log(`   ├─ Propiedades: ${propertiesCount}`);
    console.log(`   ├─ Contratos: ${contractsCount}`);
    console.log(`   └─ Mensajes: ${messagesCount}`);

    // 5. Verificar usuarios con actividad real
    const activeUsers = allUsers.filter(
      u =>
        u._count.properties > 0 ||
        u._count.contractsAsOwner > 0 ||
        u._count.contractsAsTenant > 0 ||
        u.lastLogin !== null
    );

    console.log('\n5. 🔥 USUARIOS CON ACTIVIDAD REAL:');
    if (activeUsers.length === 0) {
      console.log('   ❌ No hay usuarios con actividad real');
      console.log('   💡 Esto significa que ningún usuario ha usado realmente el sistema');
    } else {
      activeUsers.forEach(user => {
        console.log(
          `   ✅ ${user.email} - Actividad: Props(${user._count.properties}) Contratos(${user._count.contractsAsOwner + user._count.contractsAsTenant}) Login(${user.lastLogin || 'Nunca'})`
        );
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNÓSTICO FINAL:');
    console.log('='.repeat(60));

    if (totalUsers === 6 && foundCount === 0) {
      console.log('🎯 CONCLUSIÓN: Los usuarios mencionados NO existen en la base de datos actual');
      console.log('');
      console.log('💡 POSIBLES EXPLICACIONES:');
      console.log('   1. Los usuarios existen en otra base de datos PostgreSQL (no DigitalOcean)');
      console.log('   2. Los usuarios se crearon en una instancia anterior del sistema');
      console.log('   3. Hay un problema de configuración donde Next.js usa otra BD');
      console.log('   4. Los usuarios están hardcodeados en el frontend');
      console.log('   5. Hay un problema de cache/autenticación en el navegador');
      console.log('');
      console.log('🔧 SOLUCIÓN PROPUESTA:');
      console.log('   - Crear los usuarios reales usando el script create-real-users.js');
      console.log('   - Verificar configuración de base de datos en producción');
      console.log('   - Limpiar cache del navegador');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

verifyUserExistence();
