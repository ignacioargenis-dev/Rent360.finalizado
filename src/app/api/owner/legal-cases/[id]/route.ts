import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const updateLegalCaseSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const caseId = params.id;

    const legalCase = await db.legalCase.findUnique({
      where: {
        id: caseId,
        ownerId: user.id, // Solo puede ver sus propios casos
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            monthlyRent: true,
            depositAmount: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                rut: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rut: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        extrajudicialNotices: {
          orderBy: { sentDate: 'desc' },
          take: 5,
        },
        courtProceedings: {
          orderBy: { filedDate: 'desc' },
          take: 5,
        },
        legalPayments: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
        },
        legalNotifications: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!legalCase) {
      return NextResponse.json({ error: 'Caso legal no encontrado.' }, { status: 404 });
    }

    // Calcular fechas importantes
    const courtDate = legalCase.nextDeadline
      ? new Date(legalCase.nextDeadline).toISOString().split('T')[0]
      : null;

    const riskLevel = calculateRiskLevel(legalCase);

    logger.info('Detalles de caso legal obtenidos por propietario', {
      ownerId: user.id,
      caseId,
      caseNumber: legalCase.caseNumber,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...legalCase,
        courtDate,
        riskLevel,
        daysSinceFirstDefault: Math.floor(
          (Date.now() - new Date(legalCase.firstDefaultDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    logger.error('Error obteniendo detalles del caso legal:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const caseId = params.id;
    const body = await request.json();
    const validatedData = updateLegalCaseSchema.parse(body);

    // Verificar que el caso pertenece al propietario
    const existingCase = await db.legalCase.findUnique({
      where: {
        id: caseId,
        ownerId: user.id,
      },
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado o no tienes permisos.' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización filtrando valores undefined
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    // Actualizar caso legal
    const updatedCase = await db.legalCase.update({
      where: { id: caseId },
      data: updateData,
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Caso legal actualizado por propietario', {
      ownerId: user.id,
      caseId,
      changes: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Caso legal actualizado exitosamente.',
      data: updatedCase,
    });
  } catch (error) {
    logger.error('Error actualizando caso legal:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function calculateRiskLevel(legalCase: any): 'low' | 'medium' | 'high' | 'critical' {
  const daysSinceDefault = Math.floor(
    (Date.now() - new Date(legalCase.firstDefaultDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalAmount = legalCase.totalAmount || 0;

  if (daysSinceDefault > 180 || totalAmount > 5000000) {
    return 'critical';
  } else if (daysSinceDefault > 90 || totalAmount > 2000000) {
    return 'high';
  } else if (daysSinceDefault > 30 || totalAmount > 500000) {
    return 'medium';
  } else {
    return 'low';
  }
}
