import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Esquemas de validación
const createCourtProceedingSchema = z.object({
  proceedingType: z.enum([
    'EVICTION_DEMAND',
    'MONITORIO_PROCEDURE',
    'ORDINARY_PROCEDURE',
    'SUMMARY_PROCEDURE',
    'EXECUTION_PROCEDURE',
    'APPEAL',
    'OTHER'
  ]),
  court: z.string().min(1, 'Nombre del tribunal es requerido'),
  judge: z.string().optional(),
  courtFees: z.number().min(0, 'Los gastos de tribunal deben ser mayor o igual a 0'),
  legalFees: z.number().min(0, 'Los honorarios legales deben ser mayor o igual a 0'),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  nextDeadline: z.string().datetime().optional()
});

const updateCourtProceedingSchema = z.object({
  status: z.enum([
    'INITIATED',
    'NOTIFIED',
    'OPPOSITION_PERIOD',
    'EVIDENCE_PERIOD',
    'HEARING_SCHEDULED',
    'HEARING_COMPLETED',
    'JUDGMENT_PENDING',
    'JUDGMENT_ISSUED',
    'EXECUTION_PENDING',
    'EXECUTION_COMPLETED',
    'APPEALED',
    'CLOSED'
  ]).optional(),
  filedDate: z.string().datetime().optional(),
  notificationDate: z.string().datetime().optional(),
  oppositionDeadline: z.string().datetime().optional(),
  hearingDate: z.string().datetime().optional(),
  evidenceDeadline: z.string().datetime().optional(),
  judgmentDeadline: z.string().datetime().optional(),
  outcome: z.enum([
    'FAVORABLE',
    'PARTIALLY_FAVORABLE',
    'UNFAVORABLE',
    'DISMISSED',
    'SETTLEMENT',
    'OTHER'
  ]).optional(),
  judgmentText: z.string().optional(),
  judgmentDate: z.string().datetime().optional(),
  appealDeadline: z.string().datetime().optional(),
  appealFiled: z.boolean().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  nextDeadline: z.string().datetime().optional()
});

// POST /api/legal/cases/[id]/court-proceedings - Crear procedimiento judicial
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = createCourtProceedingSchema.parse(body);

    // Verificar que el caso legal existe
    const legalCase = await db.legalCase.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            broker: true
          }
        }
      }
    });

    if (!legalCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo propietario, corredor o admin pueden crear procedimientos judiciales
    const canCreateProceeding = 
      user.role === 'ADMIN' ||
      user.id === legalCase.ownerId ||
      (legalCase.brokerId && user.id === legalCase.brokerId);

    if (!canCreateProceeding) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear procedimientos judiciales para este caso' },
        { status: 403 }
      );
    }

    // Verificar que el caso esté en fase apropiada para procedimientos judiciales
    if (!['WAITING_RESPONSE', 'DEMAND_PREPARATION'].includes(legalCase.status)) {
      return NextResponse.json(
        { error: 'El caso legal no está en fase para iniciar procedimientos judiciales' },
        { status: 400 }
      );
    }

    // Generar número único de expediente si no se proporciona
    const proceedingNumber = validatedData.proceedingType === 'MONITORIO_PROCEDURE' 
      ? `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      : `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear el procedimiento judicial
    const courtProceeding = await db.courtProceeding.create({
      data: {
        legalCaseId: params.id,
        proceedingType: validatedData.proceedingType,
        proceedingNumber,
        court: validatedData.court,
        judge: validatedData.judge ?? null,
        courtFees: validatedData.courtFees,
        legalFees: validatedData.legalFees,
        totalCosts: validatedData.courtFees + validatedData.legalFees,
        notes: validatedData.notes ?? null,
        nextAction: validatedData.nextAction ?? null,
        nextDeadline: validatedData.nextDeadline ? new Date(validatedData.nextDeadline) : null
      }
    });

    // Actualizar el estado del caso legal
    await db.legalCase.update({
      where: { id: params.id },
      data: {
        status: 'DEMAND_FILED',
        demandFiledDate: new Date(),
        currentPhase: 'COURT_FILING',
        legalFees: validatedData.legalFees,
        courtFees: validatedData.courtFees,
        totalAmount: legalCase.totalAmount + validatedData.courtFees + validatedData.legalFees,
        nextDeadline: validatedData.nextDeadline ? new Date(validatedData.nextDeadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días por defecto
      }
    });

    // Crear log de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: params.id,
        userId: user.id,
        action: 'COURT_PROCEDING_CREATED',
        details: `Procedimiento judicial creado: ${validatedData.proceedingType}`,
        newValue: JSON.stringify(courtProceeding)
      }
    });

    // Enviar notificaciones
    await db.legalNotification.createMany({
      data: [
        {
          legalCaseId: params.id,
          userId: legalCase.contract.tenantId,
          notificationType: 'COURT_ORDER',
          title: 'Demanda Judicial Presentada',
          message: `Se ha presentado una demanda judicial relacionada con su contrato. Por favor revise los documentos y consulte con un abogado.`,
          priority: 'high',
          status: 'pending',
          actionRequired: true,
          actionDeadline: validatedData.nextDeadline ? new Date(validatedData.nextDeadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          legalCaseId: params.id,
          userId: legalCase.ownerId,
          notificationType: 'STATUS_UPDATE',
          title: 'Procedimiento Judicial Iniciado',
          message: `Se ha iniciado exitosamente el procedimiento judicial. El siguiente paso es esperar la notificación del tribunal.`,
          priority: 'medium',
          status: 'pending'
        }
      ]
    });

    logger.info('Procedimiento judicial creado exitosamente', {
      context: 'legal.court-proceedings.create',
      userId: user.id,
      caseId: params.id,
      proceedingId: courtProceeding.id,
      proceedingType: validatedData.proceedingType
    });

    return NextResponse.json({
      success: true,
      data: courtProceeding,
      message: 'Procedimiento judicial creado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al crear procedimiento judicial', {
      context: 'legal.court-proceedings.create',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/legal/cases/[id]/court-proceedings - Obtener procedimientos judiciales
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    // Verificar que el caso legal existe
    const legalCase = await db.legalCase.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            broker: true
          }
        }
      }
    });

    if (!legalCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo participantes del caso pueden ver los procedimientos
    const canViewProceedings = 
      user.role === 'ADMIN' ||
      user.id === legalCase.tenantId ||
      user.id === legalCase.ownerId ||
      (legalCase.brokerId && user.id === legalCase.brokerId);

    if (!canViewProceedings) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver los procedimientos judiciales de este caso' },
        { status: 403 }
      );
    }

    // Obtener procedimientos judiciales
    const courtProceedings = await db.courtProceeding.findMany({
      where: { legalCaseId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    logger.info('Procedimientos judiciales obtenidos exitosamente', {
      context: 'legal.court-proceedings.list',
      userId: user.id,
      caseId: params.id,
      count: courtProceedings.length
    });

    return NextResponse.json({
      success: true,
      data: courtProceedings
    });

  } catch (error) {
    logger.error('Error al obtener procedimientos judiciales', {
      context: 'legal.court-proceedings.list',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/legal/cases/[id]/court-proceedings - Actualizar procedimiento judicial
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = updateCourtProceedingSchema.parse(body);

    // Verificar que el caso legal existe
    const legalCase = await db.legalCase.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            broker: true
          }
        }
      }
    });

    if (!legalCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo propietario, corredor o admin pueden actualizar procedimientos
    const canUpdateProceeding = 
      user.role === 'ADMIN' ||
      user.id === legalCase.ownerId ||
      (legalCase.brokerId && user.id === legalCase.brokerId);

    if (!canUpdateProceeding) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar procedimientos judiciales de este caso' },
        { status: 403 }
      );
    }

    // Obtener el procedimiento más reciente
    const latestProceeding = await db.courtProceeding.findFirst({
      where: { legalCaseId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestProceeding) {
      return NextResponse.json(
        { error: 'No se encontró procedimiento judicial para actualizar' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (validatedData.status) {
      updateData.status = validatedData.status;
    }
    if (validatedData.filedDate) {
      updateData.filedDate = new Date(validatedData.filedDate);
    }
    if (validatedData.notificationDate) {
      updateData.notificationDate = new Date(validatedData.notificationDate);
    }
    if (validatedData.oppositionDeadline) {
      updateData.oppositionDeadline = new Date(validatedData.oppositionDeadline);
    }
    if (validatedData.hearingDate) {
      updateData.hearingDate = new Date(validatedData.hearingDate);
    }
    if (validatedData.evidenceDeadline) {
      updateData.evidenceDeadline = new Date(validatedData.evidenceDeadline);
    }
    if (validatedData.judgmentDeadline) {
      updateData.judgmentDeadline = new Date(validatedData.judgmentDeadline);
    }
    if (validatedData.outcome) {
      updateData.outcome = validatedData.outcome;
    }
    if (validatedData.judgmentText) {
      updateData.judgmentText = validatedData.judgmentText;
    }
    if (validatedData.judgmentDate) {
      updateData.judgmentDate = new Date(validatedData.judgmentDate);
    }
    if (validatedData.appealDeadline) {
      updateData.appealDeadline = new Date(validatedData.appealDeadline);
    }
    if (validatedData.appealFiled !== undefined) {
      updateData.appealFiled = validatedData.appealFiled;
    }
    if (validatedData.notes) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.nextAction) {
      updateData.nextAction = validatedData.nextAction;
    }
    if (validatedData.nextDeadline) {
      updateData.nextDeadline = new Date(validatedData.nextDeadline);
    }

    // Actualizar el procedimiento
    const updatedProceeding = await db.courtProceeding.update({
      where: { id: latestProceeding.id },
      data: updateData
    });

    // Actualizar el estado del caso legal según el estado del procedimiento
    let caseStatusUpdate: any = {};
    
    if (validatedData.status === 'HEARING_SCHEDULED') {
      caseStatusUpdate = {
        status: 'HEARING_SCHEDULED',
        currentPhase: 'HEARING',
        hearingDate: validatedData.hearingDate
      };
    } else if (validatedData.status === 'JUDGMENT_ISSUED') {
      caseStatusUpdate = {
        status: 'JUDGMENT_ISSUED',
        currentPhase: 'JUDGMENT',
        judgmentDate: validatedData.judgmentDate
      };
    } else if (validatedData.status === 'EXECUTION_COMPLETED') {
      caseStatusUpdate = {
        status: 'EVICTION_ORDERED',
        currentPhase: 'EVICTION',
        evictionDate: new Date()
      };
    }

    if (Object.keys(caseStatusUpdate).length > 0) {
      await db.legalCase.update({
        where: { id: params.id },
        data: caseStatusUpdate
      });
    }

    // Crear log de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: params.id,
        userId: user.id,
        action: 'COURT_PROCEDING_UPDATED',
        details: `Procedimiento judicial actualizado: ${validatedData.status || 'varios campos'}`,
        previousValue: JSON.stringify(latestProceeding),
        newValue: JSON.stringify(updatedProceeding)
      }
    });

    // Enviar notificaciones según el estado
    if (validatedData.status === 'HEARING_SCHEDULED') {
      await db.legalNotification.createMany({
        data: [
          {
            legalCaseId: params.id,
            userId: legalCase.contract.tenantId,
            notificationType: 'HEARING_SCHEDULED',
            title: 'Audiencia Programada',
            message: `Se ha programado una audiencia judicial para su caso. Por favor asista en la fecha y hora indicada.`,
            priority: 'high',
            status: 'pending',
            actionRequired: true,
            ...(validatedData.hearingDate ? { actionDeadline: new Date(validatedData.hearingDate) } : {})
          },
          {
            legalCaseId: params.id,
            userId: legalCase.ownerId,
            notificationType: 'HEARING_SCHEDULED',
            title: 'Audiencia Programada',
            message: `Se ha programado una audiencia judicial para su caso. Por favor asista en la fecha y hora indicada.`,
            priority: 'high',
            status: 'pending',
            actionRequired: true,
            ...(validatedData.hearingDate ? { actionDeadline: new Date(validatedData.hearingDate) } : {})
          }
        ]
      });
    } else if (validatedData.status === 'JUDGMENT_ISSUED') {
      await db.legalNotification.createMany({
        data: [
          {
            legalCaseId: params.id,
            userId: legalCase.contract.tenantId,
            notificationType: 'JUDGMENT_ISSUED',
            title: 'Sentencia Emitida',
            message: `Se ha emitido la sentencia judicial para su caso. Por favor revise los detalles.`,
            priority: 'high',
            status: 'pending',
            actionRequired: true
          },
          {
            legalCaseId: params.id,
            userId: legalCase.ownerId,
            notificationType: 'JUDGMENT_ISSUED',
            title: 'Sentencia Emitida',
            message: `Se ha emitido la sentencia judicial para su caso. Por favor revise los detalles.`,
            priority: 'high',
            status: 'pending',
            actionRequired: true
          }
        ]
      });
    }

    logger.info('Procedimiento judicial actualizado exitosamente', {
      context: 'legal.court-proceedings.update',
      userId: user.id,
      caseId: params.id,
      proceedingId: updatedProceeding.id
    });

    return NextResponse.json({
      success: true,
      data: updatedProceeding,
      message: 'Procedimiento judicial actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al actualizar procedimiento judicial', {
      context: 'legal.court-proceedings.update',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
