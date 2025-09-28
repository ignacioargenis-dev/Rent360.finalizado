import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Validar que DATABASE_URL esté configurada
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL es obligatorio. Configure la variable de entorno DATABASE_URL.');
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
globalForPrisma.prisma = db;
}
