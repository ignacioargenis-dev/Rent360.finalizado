import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Validar que DATABASE_URL esté configurada
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL es obligatorio. Configure la variable de entorno DATABASE_URL.');
}

// Configuración optimizada para producción
const prismaConfig: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  errorFormat: 'pretty',
};

// Configuración específica para producción
if (process.env.NODE_ENV === 'production') {
  prismaConfig.transactionOptions = {
    maxWait: 20000, // 20 segundos
    timeout: 15000, // 15 segundos
  };
}

// Crear instancia de Prisma con configuración optimizada
const createPrismaClient = () => {
  return new PrismaClient(prismaConfig);
};

export const db =
  globalForPrisma.prisma ??
  createPrismaClient();

// Función para verificar y reconectar la base de datos
export async function ensureDatabaseConnection(): Promise<boolean> {
  try {
    await db.$connect();
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    try {
      console.log('🔄 Attempting to reconnect...');
      await db.$disconnect();
      await db.$connect();
      console.log('✅ Database reconnected successfully');
      return true;
    } catch (reconnectError) {
      console.error('❌ Database reconnection failed:', reconnectError);
      return false;
    }
  }
}

// Función para verificar el estado de la conexión
export async function checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
  const startTime = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return { status: 'healthy', responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Database health check failed:', error);
    return { status: 'unhealthy', responseTime };
  }
}

if (process.env.NODE_ENV !== 'production') {
globalForPrisma.prisma = db;
}

if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    console.log('🔄 Prisma client disconnecting...');
    await db.$disconnect();
  });
}