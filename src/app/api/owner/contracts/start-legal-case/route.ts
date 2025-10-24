import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { NotificationService } from '@/lib/notification-service';
import { z } from 'zod';

const startLegalCaseSchema = z.object({
  contractId: z.string(),
  caseType: z.enum(['NON_PAYMENT', 'CONTRACT_BREACH', 'PROPERTY_DAMAGE', 'OTHER']),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  evidenceFiles: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = startLegalCaseSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verificar que el contrato existe y pertenece al propietario
    const contract = await db.contract.findFirst({
      where: {
        id: validatedData.contractId,
        ownerId: user.id,
      },
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
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o no tienes permisos sobre él.' },
        { status: 404 }
      );
    }

    // Verificar que no exista ya un caso legal activo para este contrato
    const existingCase = await db.legalCase.findFirst({
      where: {
        contractId: validatedData.contractId,
        status: { in: ['ACTIVE', 'PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingCase) {
      return NextResponse.json(
        { error: 'Ya existe un caso legal activo para este contrato.' },
        { status: 400 }
      );
    }

    // Crear el caso legal
    const legalCase = await db.legalCase.create({
      data: {
        caseNumber: `LEGAL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        caseType: validatedData.caseType,
        contractId: validatedData.contractId,
        ownerId: user.id,
        tenantId: contract.tenantId || '',
        brokerId: contract.brokerId,
        status: 'PRE_JUDICIAL',
        currentPhase: 'PRE_JUDICIAL',
        priority: validatedData.priority,
        totalDebt: contract.monthlyRent || 0, // Monto adeudado aproximado
        firstDefaultDate: new Date(), // Fecha de primer impago
        notes: validatedData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Crear entrada en el audit log
    await db.legalAuditLog.create({
      data: {
        legalCaseId: legalCase.id,
        userId: user.id,
        action: 'CASE_INITIATED',
        details: `Caso legal iniciado por propietario: ${validatedData.description}`,
      },
    });

    // Crear notificación inicial
    await db.legalNotification.create({
      data: {
        legalCaseId: legalCase.id,
        userId: user.id,
        notificationType: 'CASE_INITIATED',
        title: 'Caso Legal Iniciado',
        message: `Se ha iniciado un caso legal (${validatedData.caseType}) para el contrato ${contract.contractNumber}. Nuestro equipo legal revisará el caso.`,
        sentAt: new Date(),
        status: 'pending',
      },
    });

    // TODO: Implementar sistema de notificaciones para casos legales
    // Por ahora, el caso se registra pero no se envían notificaciones automáticas

    return NextResponse.json({
      success: true,
      message: 'Caso legal iniciado exitosamente',
      legalCase: {
        id: legalCase.id,
        caseNumber: legalCase.caseNumber,
        caseType: legalCase.caseType,
        status: legalCase.status,
        currentPhase: legalCase.currentPhase,
        priority: legalCase.priority,
        createdAt: legalCase.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error iniciando caso legal:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function getCaseTypeLabel(caseType: string): string {
  switch (caseType) {
    case 'NON_PAYMENT':
      return 'Incumplimiento de pago';
    case 'CONTRACT_BREACH':
      return 'Incumplimiento contractual';
    case 'PROPERTY_DAMAGE':
      return 'Daño a la propiedad';
    case 'OTHER':
      return 'Otro';
    default:
      return caseType;
  }
}
