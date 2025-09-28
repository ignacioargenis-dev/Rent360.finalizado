import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Configurar DATABASE_URL con valor por defecto para desarrollo
const DATABASE_URL = process.env.DATABASE_URL || (process.env.NODE_ENV === 'production'
  ? 'postgresql://user:password@localhost:5432/rent360_prod'
  : 'file:./rent360.db');

// Validar que DATABASE_URL esté configurada (solo en producción)
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL es obligatorio en producción. Configure la variable de entorno DATABASE_URL.');
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
globalForPrisma.prisma = db;
}
