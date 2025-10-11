import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';
import { UserRole } from '../src/types';

async function createTestUsers() {
  console.log('Creando usuarios de prueba...');

  const testUsers = [
    {
      email: 'admin@rent360.cl',
      password: 'admin123',
      name: 'Administrador Sistema',
      role: UserRole.ADMIN,
      phone: '+56 2 2345 6789',
    },
    {
      email: 'propietario@rent360.cl',
      password: 'prop123',
      name: 'María González',
      role: UserRole.OWNER,
      phone: '+56 9 1234 5678',
    },
    {
      email: 'inquilino@rent360.cl',
      password: 'inq123',
      name: 'Carlos Ramírez',
      role: UserRole.TENANT,
      phone: '+56 9 8765 4321',
    },
    {
      email: 'corredor@rent360.cl',
      password: 'corr123',
      name: 'Ana Martínez',
      role: UserRole.BROKER,
      phone: '+56 9 2345 6789',
    },
    {
      email: 'runner@rent360.cl',
      password: 'run123',
      name: 'Pedro Silva',
      role: UserRole.RUNNER,
      phone: '+56 9 3456 7890',
    },
  ];

  try {
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`Usuario ${userData.email} ya existe. Omitiendo...`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await db.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`,
        },
      });

      console.log(`✅ Usuario creado: ${user.name} (${user.email}) - Rol: ${user.role}`);
    }

    console.log('\n🎉 Usuarios de prueba creados exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('----------------------------------------');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`);
    });
    console.log('----------------------------------------');
    console.log('\n🌐 Puedes acceder a:');
    console.log('   - Login: http://localhost:3000/auth/login');
    console.log('   - Registro: http://localhost:3000/auth/register');
    console.log('   - Home: http://localhost:3000');
  } catch (error) {
    console.error('❌ Error al crear usuarios de prueba:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
createTestUsers().catch(console.error);
