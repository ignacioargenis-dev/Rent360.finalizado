import { PrismaClient } from '@prisma/client';

// Validar que DATABASE_URL esté configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está configurada en las variables de entorno');
  process.exit(1);
}

// Usar las variables de entorno automáticamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL as string,
    },
  },
});

async function main() {
  // Email del usuario a eliminar (puede pasarse como argumento)
  const email = process.argv[2] || 'servicio@gmail.com';

  console.log(`🗑️  Buscando usuario con email: ${email}...`);

  try {
    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!user) {
      console.log(`❌ No se encontró usuario con email: ${email}`);
      process.exit(1);
      return;
    }

    console.log(`✅ Usuario encontrado:`, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasServiceProvider: !!user.serviceProvider,
      hasMaintenanceProvider: !!user.maintenanceProvider,
    });

    // Eliminar el usuario (esto eliminará automáticamente los perfiles relacionados por cascade)
    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Usuario ${email} eliminado exitosamente junto con sus perfiles relacionados.`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
