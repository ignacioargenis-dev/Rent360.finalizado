import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    console.log('🔍 Verificando base de datos rent360_prod...');

    // Intentar conectar a rent360_prod
    const prisma = new PrismaClient();

    try {
      await prisma.$connect();
      console.log('✅ Base de datos rent360_prod ya existe y es accesible');

      // Verificar si hay tablas (lo que indica que las migraciones ya se ejecutaron)
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`;

      if ((result as any)[0].count > 0) {
        console.log('✅ Las tablas ya existen en la base de datos');
        return NextResponse.json({
          success: true,
          message: 'Base de datos rent360_prod ya existe y está configurada',
          databaseExists: true,
          tablesExist: true,
        });
      } else {
        console.log('⚠️ Base de datos existe pero no tiene tablas');
        return NextResponse.json({
          success: false,
          message: 'Base de datos existe pero necesita migraciones. Ejecuta /api/init-db después de crear la BD manualmente.',
          databaseExists: true,
          tablesExist: false,
        });
      }

    } catch (connectionError: any) {
      console.log('❌ Error conectando a rent360_prod:', connectionError.message);

      if (connectionError.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          message: 'Base de datos rent360_prod no existe. Créala manualmente en DigitalOcean.',
          databaseExists: false,
          instructions: 'Ve a tu base de datos en DigitalOcean → Console → Ejecuta: CREATE DATABASE rent360_prod;'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Error desconocido conectando a la base de datos',
          error: connectionError.message,
          databaseExists: false,
        });
      }
    } finally {
      await prisma.$disconnect();
    }

  } catch (error: any) {
    console.error('❌ Error en verificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    }, { status: 500 });
  }
}
