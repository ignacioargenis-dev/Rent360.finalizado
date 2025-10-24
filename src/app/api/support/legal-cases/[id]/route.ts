import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const updateLegalCaseSchema = z.object({
  status: z.enum(['PRE_JUDICIAL', 'JUDICIAL', 'EXECUTION', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  currentPhase: z.string().optional(),
  nextDeadline: z.string().datetime().optional(),
  notes: z.string().optional(),
  legalFees: z.number().min(0).optional(),
  courtFees: z.number().min(0).optional(),
  accumulatedInterest: z.number().min(0).optional(),
  extrajudicialSentDate: z.string().datetime().optional(),
  demandFiledDate: z.string().datetime().optional(),
  hearingDate: z.string().datetime().optional(),
  judgmentDate: z.string().datetime().optional(),
  evictionDate: z.string().datetime().optional(),
  caseClosedDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const caseId = params.id;

    const legalCase = await db.legalCase.findUnique({
      where: { id: caseId },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            monthlyRent: true,
            depositAmount: true,
            startDate: true,
            endDate: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                commune: true,
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
            payments: {
              select: {
                id: true,
                amount: true,
                dueDate: true,
                paidDate: true,
                status: true,
              },
              orderBy: { dueDate: 'desc' },
              take: 10,
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
            city: true,
            commune: true,
          },
        },
        owner: {
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
            phone: true,
          },
        },
        extrajudicialNotices: {
          orderBy: { sentDate: 'desc' },
        },
        courtProceedings: {
          orderBy: { filedDate: 'desc' },
        },
        legalPayments: {
          orderBy: { dueDate: 'desc' },
        },
        legalAuditLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        legalNotifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!legalCase) {
      return NextResponse.json({ error: 'Caso legal no encontrado.' }, { status: 404 });
    }

    // Calcular métricas adicionales
    const overduePayments = legalCase.contract.payments.filter(
      p => p.status === 'OVERDUE' || (p.dueDate < new Date() && !p.paidDate)
    );

    const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const daysSinceFirstDefault = Math.floor(
      (Date.now() - new Date(legalCase.firstDefaultDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    logger.info('Detalles completos de caso legal obtenidos por soporte', {
      userId: user.id,
      role: user.role,
      caseId,
      caseNumber: legalCase.caseNumber,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...legalCase,
        metrics: {
          overduePaymentsCount: overduePayments.length,
          totalOverdueAmount: totalOverdue,
          daysSinceFirstDefault,
          hasCourtProceedings: legalCase.courtProceedings.length > 0,
          pendingPayments: legalCase.legalPayments.filter(p => p.status === 'PENDING').length,
        },
      },
    });
  } catch (error) {
    logger.error('Error obteniendo detalles del caso legal para soporte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const caseId = params.id;
    const body = await request.json();
    const validatedData = updateLegalCaseSchema.parse(body);

    // Verificar que el caso existe
    const existingCase = await db.legalCase.findUnique({
      where: { id: caseId },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Caso legal no encontrado.' }, { status: 404 });
    }

    // Preparar datos de actualización filtrando valores undefined
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Solo incluir campos que tienen valores definidos
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority;
    }
    if (validatedData.currentPhase !== undefined) {
      updateData.currentPhase = validatedData.currentPhase;
    }
    if (validatedData.nextDeadline !== undefined) {
      updateData.nextDeadline = validatedData.nextDeadline;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.legalFees !== undefined) {
      updateData.legalFees = validatedData.legalFees;
    }
    if (validatedData.courtFees !== undefined) {
      updateData.courtFees = validatedData.courtFees;
    }
    if (validatedData.accumulatedInterest !== undefined) {
      updateData.accumulatedInterest = validatedData.accumulatedInterest;
    }
    if (validatedData.extrajudicialSentDate !== undefined) {
      updateData.extrajudicialSentDate = validatedData.extrajudicialSentDate;
    }
    if (validatedData.demandFiledDate !== undefined) {
      updateData.demandFiledDate = validatedData.demandFiledDate;
    }
    if (validatedData.hearingDate !== undefined) {
      updateData.hearingDate = validatedData.hearingDate;
    }
    if (validatedData.judgmentDate !== undefined) {
      updateData.judgmentDate = validatedData.judgmentDate;
    }
    if (validatedData.evictionDate !== undefined) {
      updateData.evictionDate = validatedData.evictionDate;
    }
    if (validatedData.caseClosedDate !== undefined) {
      updateData.caseClosedDate = validatedData.caseClosedDate;
    }

    // Las fechas ya están convertidas en el paso anterior si eran válidas

    // Recalcular totalAmount si se actualizan fees o interest
    if (
      validatedData.legalFees !== undefined ||
      validatedData.courtFees !== undefined ||
      validatedData.accumulatedInterest !== undefined
    ) {
      const legalFees = validatedData.legalFees ?? existingCase.legalFees;
      const courtFees = validatedData.courtFees ?? existingCase.courtFees;
      const accumulatedInterest =
        validatedData.accumulatedInterest ?? existingCase.accumulatedInterest;

      updateData.totalAmount = existingCase.totalDebt + legalFees + courtFees + accumulatedInterest;
    }

    // Si se marca como cerrado, establecer fecha de cierre
    if (validatedData.status === 'CLOSED' && existingCase.status !== 'CLOSED') {
      updateData.caseClosedDate = new Date();
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
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Crear entrada de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: caseId,
        userId: user.id,
        action: 'CASE_UPDATED',
        details: `Caso legal actualizado por ${user.role.toLowerCase()}`,
        previousValue: JSON.stringify({
          status: existingCase.status,
          priority: existingCase.priority,
          notes: existingCase.notes,
        }),
        newValue: JSON.stringify(updateData),
      },
    });

    logger.info('Caso legal actualizado por soporte/admin', {
      userId: user.id,
      role: user.role,
      caseId,
      caseNumber: updatedCase.caseNumber,
      changes: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Caso legal actualizado exitosamente.',
      data: updatedCase,
    });
  } catch (error) {
    logger.error('Error actualizando caso legal por soporte:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
