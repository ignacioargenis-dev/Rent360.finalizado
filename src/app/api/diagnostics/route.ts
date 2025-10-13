import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      configured: !!process.env.DATABASE_URL,
      connection: false
    },
    auth: {
      jwtConfigured: !!process.env.JWT_SECRET,
      nextauthConfigured: !!process.env.NEXTAUTH_SECRET,
      nextauthUrl: process.env.NEXTAUTH_URL
    },
    services: {
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      encryptionConfigured: !!process.env.ENCRYPTION_KEY
    },
    urls: {
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL
    }
  };

  // Verificar conexión DB
  try {
    const { db } = await import('@/lib/db');
    await db.$queryRaw`SELECT 1`;
    diagnostics.database.connection = true;
  } catch (error) {
    diagnostics.database.connection = false;
  }

  return NextResponse.json(diagnostics);
}
