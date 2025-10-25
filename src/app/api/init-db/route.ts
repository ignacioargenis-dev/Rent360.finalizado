import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    console.log('🚀 Endpoint de inicialización de BD llamado');

    // Ejecutar el script de inicialización
    const { stdout, stderr } = await execAsync('node init-production-db.js', {
      cwd: process.cwd(),
      timeout: 60000, // 60 segundos timeout
    });

    console.log('✅ Script ejecutado exitosamente');
    console.log('STDOUT:', stdout);

    if (stderr) {
      console.log('STDERR:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada correctamente',
      output: stdout,
      errors: stderr || null,
    });

  } catch (error: any) {
    console.error('❌ Error inicializando base de datos:', error);

    return NextResponse.json({
      success: false,
      message: 'Error inicializando base de datos',
      error: error.message,
      output: error.stdout || null,
      errors: error.stderr || null,
    }, { status: 500 });
  }
}
