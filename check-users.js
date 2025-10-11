// Verificar usuarios en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 VERIFICANDO USUARIOS EN BASE DE DATOS');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      take: 10,
    });

    console.log(`\nTotal de usuarios encontrados: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('Solución: Ejecutar seed para crear usuarios de prueba');
    } else {
      console.log('✅ Usuarios encontrados:');
      users.forEach((user, index) => {
        console.log(
          `${index + 1}. ${user.name} (${user.email}) - Rol: ${user.role} - Activo: ${user.isActive}`
        );
      });

      // Buscar usuario admin
      const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'ADMIN');
      if (adminUsers.length > 0) {
        console.log(`\n✅ Usuarios ADMIN encontrados: ${adminUsers.length}`);
        adminUsers.forEach(admin => {
          console.log(`  - ${admin.name} (${admin.email})`);
        });
      } else {
        console.log('\n❌ No hay usuarios con rol ADMIN');
      }
    }
  } catch (error) {
    console.error('Error al consultar usuarios:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
