import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { identityVerificationService } from '@/lib/identity-verification-service';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const statusQuerySchema = z.object({
  verificationId: z.string().optional(),
  level: z.enum(['basic', 'intermediate', 'advanced']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get('verificationId');
    const level = searchParams.get('level') as 'basic' | 'intermediate' | 'advanced' | null;

    // Si se proporciona verificationId, obtener estado de esa verificación específica
    if (verificationId) {
      // En producción, buscar en la base de datos
      // Por ahora, devolver mock data
      logger.info('Obteniendo estado de verificación', {
        userId: user.id,
        verificationId,
      });

      return NextResponse.json({
        success: true,
        verification: {
          id: verificationId,
          userId: user.id,
          status: 'pending',
          level: 'intermediate',
          progress: {
            completed: 2,
            total: 4,
            percentage: 50,
          },
          checks: {
            rutValidation: true,
            documentVerification: true,
            faceMatch: false,
            livenessCheck: false,
            addressVerification: false,
          },
          scores: {
            identityScore: 50,
            trustScore: 45,
            riskScore: 35,
          },
          requiredDocuments: [
            {
              type: 'cedula_identidad',
              uploaded: true,
              verified: true,
            },
            {
              type: 'selfie',
              uploaded: false,
              verified: false,
            },
            {
              type: 'proof_of_address',
              uploaded: false,
              verified: false,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    // Si se proporciona level, devolver requisitos para ese nivel
    if (level) {
      const requirements = identityVerificationService.getRequirementsForLevel(level);

      logger.info('Obteniendo requisitos de verificación', {
        userId: user.id,
        level,
      });

      return NextResponse.json({
        success: true,
        level,
        requirements,
      });
    }

    // Si no se proporciona ningún parámetro, devolver todas las verificaciones del usuario
    logger.info('Obteniendo todas las verificaciones del usuario', {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      verifications: [
        {
          id: `ver_${Date.now()}`,
          status: 'pending',
          level: 'intermediate',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    logger.error('Error obteniendo estado de verificación:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
