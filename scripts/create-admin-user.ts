import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createRealAdmin() {
  console.log('🚀 Creando usuario administrador real...');

  // Solicitar datos del admin
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise(resolve => {
      readline.question(question, resolve);
    });
  };

  try {
    console.log('\n📝 Información del nuevo administrador:');

    const name = await askQuestion('Nombre completo: ');
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Contraseña (mínimo 8 caracteres): ');

    // Validaciones básicas
    if (!name || name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    readline.close();

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario administrador real
    const adminUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        rut: '99.999.999-9', // RUT genérico para admin
        phone: '+56999999999',
        rutVerified: true,
        phoneVerified: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/[^a-zA-Z0-9\s]/g, ''))}&background=DC2626&color=fff`,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('\n✅ ¡Administrador creado exitosamente!');
    console.log('=====================================');
    console.log(`👤 Nombre: ${adminUser.name}`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔐 Rol: ${adminUser.role}`);
    console.log(`📅 Creado: ${adminUser.createdAt.toLocaleString('es-CL')}`);
    console.log('=====================================');
    console.log('\n🔑 Credenciales de acceso:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Dashboard: /admin/dashboard');
    console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');
  } catch (error) {
    console.error(
      '\n❌ Error al crear administrador:',
      error instanceof Error ? error.message : String(error)
    );
    readline.close();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createRealAdmin().catch(console.error);
}

export { createRealAdmin };
