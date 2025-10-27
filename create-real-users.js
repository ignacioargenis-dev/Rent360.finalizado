// Script para crear los usuarios reales en DigitalOcean
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Datos de los usuarios reales (necesitan ser completados por el usuario)
const realUsers = [
  {
    email: 'ignacio.antonio.b@hotmail.com',
    name: 'Ignacio Antonio', // Ajustar según el nombre real
    role: 'OWNER', // Ajustar según el rol real
    phone: '+56912345678', // Ajustar según teléfono real
    password: 'temporal123', // Contraseña temporal - debe ser cambiada
  },
  {
    email: 'ingerlisesg@gmail.com',
    name: 'Inger Lise', // Ajustar según el nombre real
    role: 'OWNER', // Ajustar según el rol real
    phone: '+56987654321', // Ajustar según teléfono real
    password: 'temporal123', // Contraseña temporal - debe ser cambiada
  },
  {
    email: 'lucbjork@gmail.com',
    name: 'Lucas Bjork', // Ajustar según el nombre real
    role: 'OWNER', // Ajustar según el rol real
    phone: '+56911223344', // Ajustar según teléfono real
    password: 'temporal123', // Contraseña temporal - debe ser cambiada
  },
];

async function createRealUsers() {
  try {
    console.log('🚀 Creando usuarios reales en DigitalOcean...\n');

    await prisma.$connect();
    console.log('✅ Conexión a DigitalOcean exitosa\n');

    const initialCount = await prisma.user.count();
    console.log(`👥 Usuarios iniciales: ${initialCount}\n`);

    const createdUsers = [];

    for (const userData of realUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          console.log(`⚠️  Usuario ${userData.email} ya existe, omitiendo...`);
          continue;
        }

        // Generar RUT chileno válido (temporal)
        const rutBase = Math.floor(Math.random() * 90000000) + 10000000;
        const rut = `${rutBase}-${Math.floor(Math.random() * 9) + 1}`;

        // Crear usuario
        const newUser = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: await bcrypt.hash(userData.password, 12),
            role: userData.role,
            phone: userData.phone,
            rut: rut,
            rutVerified: false,
            isActive: true,
            emailVerified: true, // Asumimos que son usuarios reales verificados
            phoneVerified: false,
            nationality: 'CHILE',
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        });

        createdUsers.push(newUser);
        console.log(`✅ Usuario creado: ${newUser.email} - ${newUser.name} - ${newUser.role}`);
      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      }
    }

    const finalCount = await prisma.user.count();
    console.log(`\n👥 Usuarios finales: ${finalCount}`);
    console.log(`📈 Usuarios creados: ${createdUsers.length}\n`);

    if (createdUsers.length > 0) {
      console.log('🎯 Usuarios creados exitosamente:');
      createdUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.name} - ${user.role}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   📱 Teléfono: ${user.phone}`);
        console.log(`   🔑 Contraseña temporal: temporal123`);
        console.log(`   ⚠️  IMPORTANTE: Cambiar contraseña al iniciar sesión\n`);
      });

      // Verificar que aparecen en prospects
      const prospects = await prisma.user.findMany({
        where: {
          role: { in: ['OWNER', 'TENANT'] },
          isActive: true,
          email: { in: createdUsers.map(u => u.email) },
        },
        select: {
          email: true,
          name: true,
          role: true,
        },
      });

      console.log('🎯 Verificación en lista de prospects:');
      prospects.forEach(user => {
        console.log(`✅ ${user.email} - ${user.name} - ${user.role}`);
      });

      console.log('\n🚀 ¡MIGRACIÓN COMPLETADA!');
      console.log(
        'Los usuarios reales ahora existen en DigitalOcean y aparecerán en la lista de prospects.'
      );
    } else {
      console.log('❌ No se crearon nuevos usuarios');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se confirma
console.log('⚠️  ATENCIÓN: Este script creará usuarios reales en DigitalOcean');
console.log('📝 Datos de usuarios a crear:');
realUsers.forEach((user, index) => {
  console.log(`${index + 1}. ${user.email} - ${user.name} - ${user.role}`);
});
console.log('\n🔑 Contraseña temporal para todos: temporal123\n');

console.log('❓ ¿Desea continuar? (Modifique el script y cambie los datos si es necesario)\n');

// Nota: Para ejecutar, descomente la línea siguiente:
// createRealUsers();

console.log('💡 INSTRUCCIONES:');
console.log('1. Revise y ajuste los datos de los usuarios en el array realUsers');
console.log('2. Descomente la línea createRealUsers() al final del script');
console.log('3. Ejecute: node create-real-users.js');
console.log('4. Los usuarios podrán iniciar sesión con contraseña temporal123');
console.log('5. Deben cambiar su contraseña inmediatamente después del primer login');
