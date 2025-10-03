import { PrismaClient } from '@prisma/client';
import { generateTokens } from '../src/lib/auth';
import { logger } from '../src/lib/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface SeedUser {
  email: string;
  name: string;
  role: string;
}

async function generateTokensForSeedUsers() {
  console.log('Generando tokens JWT para usuarios de seed...');

  // Usuarios de seed definidos en el script de seed
  const seedUsers: SeedUser[] = [
    { email: 'admin@rent360.cl', name: 'Carlos Rodríguez', role: 'ADMIN' },
    { email: 'propietario@rent360.cl', name: 'María González', role: 'OWNER' },
    { email: 'inquilino@rent360.cl', name: 'Pedro Sánchez', role: 'TENANT' },
    { email: 'corredor@rent360.cl', name: 'Ana Martínez', role: 'BROKER' },
    { email: 'runner@rent360.cl', name: 'Diego López', role: 'RUNNER' },
    { email: 'soporte@rent360.cl', name: 'Soporte Rent360', role: 'SUPPORT' },
    { email: 'proveedor@rent360.cl', name: 'ServicioExpress Ltda', role: 'PROVIDER' },
    { email: 'mantenimiento@rent360.cl', name: 'Mantención Total SpA', role: 'MAINTENANCE' },
  ];

  const tokensData: Array<{
    email: string;
    name: string;
    role: string;
    accessToken: string;
    refreshToken: string;
  }> = [];

  try {
    for (const seedUser of seedUsers) {
      // Buscar usuario en la base de datos
      const user = await prisma.user.findUnique({
        where: { email: seedUser.email },
      });

      if (!user) {
        console.log(`Usuario ${seedUser.email} no encontrado en la base de datos`);
        continue;
      }

      // Generar tokens para el usuario
      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.email,
        user.role,
        user.name
      );

      tokensData.push({
        email: user.email,
        name: user.name,
        role: user.role,
        accessToken,
        refreshToken,
      });

      console.log(`Tokens generados para ${user.email}`);
    }

    // Guardar tokens en un archivo JSON para desarrollo
    const tokensFilePath = path.join(process.cwd(), 'seed-tokens.json');
    fs.writeFileSync(tokensFilePath, JSON.stringify(tokensData, null, 2));

    console.log(`Tokens guardados en ${tokensFilePath}`);
    console.log('\n=== TOKENS PARA DESARROLLO ===');
    console.log('Copia estos tokens en las cookies del navegador para testing:');
    console.log('');

    tokensData.forEach((tokenData, index) => {
      console.log(`${index + 1}. ${tokenData.name} (${tokenData.email})`);
      console.log(`   Access Token: ${tokenData.accessToken}`);
      console.log(`   Refresh Token: ${tokenData.refreshToken}`);
      console.log('');
    });

    console.log('=== INSTRUCCIONES ===');
    console.log('1. Copia el access token del usuario que quieres usar');
    console.log('2. En el navegador, abre DevTools (F12)');
    console.log('3. Ve a Application > Cookies > localhost (o tu dominio)');
    console.log('4. Crea una cookie llamada "auth-token" con el valor del access token');
    console.log('5. Crea una cookie llamada "refresh-token" con el valor del refresh token');
    console.log('6. Recarga la página');
  } catch (error) {
    console.error('Error generando tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateTokensForSeedUsers();
}

export { generateTokensForSeedUsers };
