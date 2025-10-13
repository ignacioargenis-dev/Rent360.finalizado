import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validar que DATABASE_URL esté configurada
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL es obligatorio. Configure la variable de entorno DATABASE_URL.');
}

// Configuración optimizada para producción
const prismaConfig: any = {
  log:
    process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
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

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Función mejorada para verificar conexión DB con timeout
export async function ensureDatabaseConnection(): Promise<boolean> {
  try {
    // Timeout de conexión más corto para evitar bloqueos en producción
    await Promise.race([
      db.$connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // No intentar reconectar automáticamente en producción - dejar que el sistema se recupere
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    // Solo intentar reconectar en desarrollo
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

// Note: process.on is not available in Edge Runtime, so we skip this in production builds
// The Prisma client will be disconnected automatically when the process ends
