import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    console.log('🚀 Ejecutando migraciones de Prisma...');

    // Ejecutar migraciones de Prisma
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      timeout: 120000, // 2 minutos timeout
    });

    console.log('✅ Migraciones ejecutadas exitosamente');
    console.log('STDOUT:', stdout);

    if (stderr) {
      console.log('STDERR:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Migraciones ejecutadas correctamente',
      output: stdout,
      errors: stderr || null,
    });

  } catch (error: any) {
    console.error('❌ Error ejecutando migraciones:', error);

    return NextResponse.json({
      success: false,
      message: 'Error ejecutando migraciones',
      error: error.message,
      output: error.stdout || null,
      errors: error.stderr || null,
    }, { status: 500 });
  }
}
