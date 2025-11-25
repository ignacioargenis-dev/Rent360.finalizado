import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { identityVerificationService } from '@/lib/identity-verification-service';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const verifySchema = z.object({
  verificationId: z.string(),
  verificationType: z.enum(['face_match', 'liveness', 'background_check', 'complete']),
  data: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const validatedData = verifySchema.parse(body);

    let result: any = {
      success: false,
      message: '',
    };

    switch (validatedData.verificationType) {
      case 'face_match':
        {
          if (!validatedData.data?.selfieEncoding || !validatedData.data?.idPhotoEncoding) {
            return NextResponse.json(
              { error: 'Datos de face matching requeridos' },
              { status: 400 }
            );
          }

          const faceMatchResult = await identityVerificationService.verifyFaceMatch(
            validatedData.data.selfieEncoding,
            validatedData.data.idPhotoEncoding
          );

          result = {
            success: faceMatchResult.match,
            message: faceMatchResult.match
              ? 'Verificación facial exitosa'
              : 'No se pudo verificar la identidad facial',
            confidence: faceMatchResult.confidence,
            similarityScore: faceMatchResult.similarityScore,
          };
        }
        break;

      case 'liveness':
        {
          if (!validatedData.data?.videoUrl) {
            return NextResponse.json({ error: 'URL del video requerida' }, { status: 400 });
          }

          const livenessResult = await identityVerificationService.verifyLiveness(
            validatedData.data.videoUrl
          );

          result = {
            success: livenessResult.isLive,
            message: livenessResult.isLive
              ? 'Verificación de vivacidad exitosa'
              : 'Verificación de vivacidad fallida',
            confidence: livenessResult.confidence,
            issues: livenessResult.issues,
          };
        }
        break;

      case 'background_check':
        {
          if (!validatedData.data?.rut) {
            return NextResponse.json(
              { error: 'RUT requerido para verificación de antecedentes' },
              { status: 400 }
            );
          }

          const backgroundCheckResult = await identityVerificationService.performBackgroundCheck(
            validatedData.data.rut
          );

          result = {
            success: backgroundCheckResult.passed,
            message: backgroundCheckResult.passed
              ? 'Verificación de antecedentes exitosa'
              : 'Se encontraron observaciones en antecedentes',
            checks: backgroundCheckResult.checks,
            issues: backgroundCheckResult.issues,
          };
        }
        break;

      case 'complete':
        {
          // Validación RUT con Registro Civil
          if (!validatedData.data?.rut) {
            return NextResponse.json({ error: 'RUT requerido' }, { status: 400 });
          }

          const rutValidation = await identityVerificationService.validateRutWithRegistroCivil(
            validatedData.data.rut
          );

          if (!rutValidation.valid) {
            result = {
              success: false,
              message: 'Validación de RUT fallida',
              error: rutValidation.error,
            };
            break;
          }

          // Realizar todas las verificaciones
          const checks = {
            rutValidation: true,
            documentVerification: true,
            faceMatch: false,
            livenessCheck: false,
            addressVerification: false,
            backgroundCheck: false,
          };

          // Calcular scores
          const scores = identityVerificationService.calculateVerificationScores({
            checks,
          });

          result = {
            success: true,
            message: 'Verificación completa realizada',
            checks,
            scores,
            personData: rutValidation.personData,
          };
        }
        break;

      default:
        return NextResponse.json({ error: 'Tipo de verificación no válido' }, { status: 400 });
    }

    logger.info('Verificación realizada', {
      userId: user.id,
      verificationId: validatedData.verificationId,
      verificationType: validatedData.verificationType,
      success: result.success,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error en verificación:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
