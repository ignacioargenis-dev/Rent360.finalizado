import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || (process.env.NODE_ENV === 'production' 
          ? 'file:./prod.db' 
          : 'file:./dev.db'),
      },
    },
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
globalForPrisma.prisma = db;
}
