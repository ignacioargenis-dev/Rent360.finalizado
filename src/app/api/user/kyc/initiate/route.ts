import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { KYCService } from '@/lib/kyc-service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-edge';
import { z } from 'zod';

const initiateKYCSchema = z.object({
  documentType: z.enum(['national_id', 'passport', 'drivers_license']).default('national_id'),
  level: z.enum(['basic', 'standard', 'premium']).default('standard'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const validatedData = initiateKYCSchema.parse(body);

    // Verificar que el usuario existe
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        rut: true,
        kycStatus: true,
        kycLevel: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene RUT (requerido para KYC en Chile)
    if (!dbUser.rut) {
      return NextResponse.json(
        { error: 'RUT es requerido para verificación KYC' },
        { status: 400 }
      );
    }

    // Iniciar proceso KYC
    const kycResult = await KYCService.initiateKYC(
      user.id,
      validatedData.level
    );

    if (!kycResult.success) {
      return NextResponse.json(
        { error: kycResult.error || 'Error iniciando KYC' },
        { status: 400 }
      );
    }

    logger.info('KYC iniciado exitosamente', {
      userId: user.id,
      documentType: validatedData.documentType,
      level: validatedData.level,
    });

    return NextResponse.json({
      success: true,
      message: 'Proceso KYC iniciado exitosamente',
      sessionId: kycResult.sessionId,
      requirements: kycResult.requirements,
      expiresAt: kycResult.expiresAt,
    });

  } catch (error) {
    logger.error('Error iniciando KYC:', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
