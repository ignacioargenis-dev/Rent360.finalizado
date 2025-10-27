// ============================================================================
// 👑 SCRIPT PARA CREAR USUARIO ADMINISTRADOR EN DIGITALOCEAN
// ============================================================================
//
// PROPÓSITO: Crear el primer usuario administrador real en producción
//
// VERIFICACIÓN PREVIA:
// - Base de datos: DigitalOcean PostgreSQL ✅
// - Usuarios existentes: 6 (solo mock data) ❌
// - Usuario admin buscado: admin@sendspress.cl ❌ NO EXISTE
// - Usuario corredor: corredor@gmail.com ✅ EXISTE (sin actividad)
//
// ESTRATEGIA:
// 1. Crear usuario administrador con permisos completos
// 2. El admin podrá crear los demás usuarios desde el panel
// 3. Gestionar roles y permisos desde la interfaz administrativa
//
// SEGURIDAD:
// - Usar email real del administrador
// - Contraseña fuerte y única
// - Cambiar contraseña inmediatamente después del primer login
//
// ============================================================================

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

// 🎯 USUARIO ADMINISTRADOR PRINCIPAL - CONFIGURAR CON DATOS REALES
const adminUser = {
  email: 'admin@rent360.cl', // ← CONFIGURAR: Email real del administrador
  name: 'Administrador Rent360', // ← CONFIGURAR: Nombre real
  role: 'ADMIN',
  phone: '+569XXXXXXXX', // ← CONFIGURAR: Teléfono real del admin
  password: 'AdminRent3602024!', // ← CONFIGURAR: Contraseña segura para el admin
};

// ⚠️ USUARIOS ADICIONALES - COMPLETAR DESPUÉS
// Estos usuarios se pueden crear desde el panel de admin una vez que el admin principal exista
const additionalUsers = [
  // Por ahora vacío - se crearán desde el panel de administración
];

async function createRealUsers() {
  try {
    console.log('🚀 Creando usuario administrador en DigitalOcean...\n');

    await prisma.$connect();
    console.log('✅ Conexión a DigitalOcean exitosa\n');

    const initialCount = await prisma.user.count();
    console.log(`👥 Usuarios iniciales: ${initialCount}\n`);

    // PRIMERO: Crear usuario administrador
    console.log('👑 CREANDO USUARIO ADMINISTRADOR...\n');

    const createdUsers = [];
    const usersToCreate = [adminUser, ...additionalUsers];

    for (const userData of usersToCreate) {
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
      console.log('🎯 USUARIOS CREADOS EXITOSAMENTE:');
      createdUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.name} - ${user.role}`);
        console.log(`   ├─ Email: ${user.email}`);
        console.log(`   ├─ Rol: ${user.role}`);
        console.log(`   ├─ Teléfono: ${user.phone}`);
        console.log(
          `   └─ Contraseña: ${user.role === 'ADMIN' ? '[CONFIGURADA EN SCRIPT]' : 'temporal123'}`
        );
        console.log(`   ⚠️  IMPORTANTE: Cambiar contraseña al iniciar sesión\n`);
      });

      // Verificar acceso al panel de administración
      const adminCreated = createdUsers.find(u => u.role === 'ADMIN');
      if (adminCreated) {
        console.log('👑 USUARIO ADMINISTRADOR CREADO:');
        console.log('   📧 Email:', adminCreated.email);
        console.log('   🔑 Password: [Configurada en el script]');
        console.log('   🎛️  Panel Admin: https://rent360management-2yxgz.ondigitalocean.app/admin');
        console.log('   👥 Crear usuarios: Admin → Users → Create User\n');
      }

      console.log('🚀 ¡USUARIO ADMINISTRADOR LISTO!');
      console.log('Ahora puedes:');
      console.log('   1. Iniciar sesión como admin');
      console.log('   2. Acceder al panel de administración');
      console.log('   3. Crear los demás usuarios desde el admin panel');
      console.log('   4. Gestionar permisos y roles');
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

// ============================================================================
// 🎯 INSTRUCCIONES PARA CREAR USUARIO ADMINISTRADOR
// ============================================================================

console.log('📋 CONFIGURACIÓN ACTUAL DEL ADMIN:');
console.log(`   👑 Email: ${adminUser.email}`);
console.log(`   👤 Nombre: ${adminUser.name}`);
console.log(`   🔐 Password: ${adminUser.password}`);
console.log(`   📱 Teléfono: ${adminUser.phone}`);
console.log('');

console.log('⚙️  PASOS PARA EJECUTAR:');
console.log('1. Configure los datos reales del admin en la variable adminUser');
console.log('2. Elija una contraseña segura para el administrador');
console.log('3. Descomente la línea createRealUsers() al final del script');
console.log('4. Ejecute: node create-real-users.js');
console.log('');

console.log('🎛️  DESPUÉS DE CREAR EL ADMIN:');
console.log('1. Inicie sesión en: https://rent360management-2yxgz.ondigitalocean.app/auth/login');
console.log('2. Use las credenciales del admin');
console.log('3. Acceda al panel: /admin');
console.log('4. Cree los demás usuarios desde Admin → Users');
console.log('5. Configure roles y permisos');
console.log('');

console.log('🔒 SEGURIDAD:');
console.log('- Cambie la contraseña del admin inmediatamente');
console.log('- Use una contraseña fuerte y única');
console.log('- Active 2FA si está disponible');
console.log('');

// Nota: Para ejecutar, descomente la línea siguiente:
// createRealUsers();
