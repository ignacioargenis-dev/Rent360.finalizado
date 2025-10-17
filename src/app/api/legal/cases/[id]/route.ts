import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const caseId = params.id;

    const legalCase = await db.legalCase.findUnique({
      where: { id: caseId },
      include: {
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                region: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
          },
        },
        // documents: {
        //   select: {
        //     id: true,
        //     name: true,
        //     fileName: true,
        //     filePath: true,
        //     fileSize: true,
        //     mimeType: true,
        //     createdAt: true,
        //   },
        //   orderBy: {
        //     createdAt: 'desc',
        //   },
        // },
        // auditLogs: {
        //   select: {
        //     id: true,
        //     action: true,
        //     details: true,
        //     createdAt: true,
        //     userId: true,
        //     user: {
        //       select: {
        //         name: true,
        //         email: true,
        //       },
        //     },
        //   },
        //   orderBy: {
        //     createdAt: 'desc',
        //   },
        //   take: 10,
        // },
      },
    });

    if (!legalCase) {
      return NextResponse.json({ error: 'Caso legal no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    const canAccess =
      user.role === 'ADMIN' ||
      (user.role === 'OWNER' && legalCase.contract?.ownerId === user.id) ||
      (user.role === 'BROKER' && legalCase.contract?.brokerId === user.id) ||
      (user.role === 'TENANT' && legalCase.contract?.tenantId === user.id);

    if (!canAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ legalCase });
  } catch (error) {
    logger.error('Error fetching legal case:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const caseId = params.id;
    const body = await request.json();

    // Verificar permisos de edición
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado para editar casos legales' },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;
    }
    if (body.priority) {
      updateData.priority = body.priority;
    }
    if (body.currentPhase) {
      updateData.currentPhase = body.currentPhase;
    }
    if (body.totalDebt !== undefined) {
      updateData.totalDebt = parseFloat(body.totalDebt);
    }
    if (body.accumulatedInterest !== undefined) {
      updateData.accumulatedInterest = parseFloat(body.accumulatedInterest);
    }
    if (body.legalFees !== undefined) {
      updateData.legalFees = parseFloat(body.legalFees);
    }
    if (body.courtFees !== undefined) {
      updateData.courtFees = parseFloat(body.courtFees);
    }
    if (body.totalAmount !== undefined) {
      updateData.totalAmount = parseFloat(body.totalAmount);
    }
    if (body.notes) {
      updateData.notes = body.notes;
    }
    if (body.assignedLawyer) {
      updateData.assignedLawyer = body.assignedLawyer;
    }
    if (body.courtDate) {
      updateData.courtDate = new Date(body.courtDate);
    }
    if (body.settlementOffer !== undefined) {
      updateData.settlementOffer = parseFloat(body.settlementOffer);
    }
    if (body.mediationStatus) {
      updateData.mediationStatus = body.mediationStatus;
    }
    if (body.nextDeadline) {
      updateData.nextDeadline = new Date(body.nextDeadline);
    }

    const updatedCase = await db.legalCase.update({
      where: { id: caseId },
      data: updateData,
      include: {
        contract: {
          include: {
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
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Crear log de auditoría
    // await db.auditLog.create({
    //   data: {
    //     entityType: 'LEGAL_CASE',
    //     entityId: caseId,
    //     action: 'UPDATE',
    //     details: `Caso legal actualizado por ${user.name}`,
    //     userId: user.id,
    //   },
    // });

    return NextResponse.json({ legalCase: updatedCase });
  } catch (error) {
    logger.error('Error updating legal case:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const caseId = params.id;

    // Verificar permisos de archivo
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado para archivar casos legales' },
        { status: 403 }
      );
    }

    // Marcar como archivado en lugar de eliminar
    const archivedCase = await db.legalCase.update({
      where: { id: caseId },
      data: {
        status: 'CLOSED',
        currentPhase: 'ARCHIVED',
      },
    });

    // Crear log de auditoría
    // await db.auditLog.create({
    //   data: {
    //     entityType: 'LEGAL_CASE',
    //     entityId: caseId,
    //     action: 'ARCHIVE',
    //     details: `Caso legal archivado por ${user.name}`,
    //     userId: user.id,
    //   },
    // });

    return NextResponse.json({ message: 'Caso archivado exitosamente', legalCase: archivedCase });
  } catch (error) {
    logger.error('Error archiving legal case:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
