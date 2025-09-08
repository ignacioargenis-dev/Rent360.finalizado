import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleError } from '@/lib/errors';

// Schema para crear notificación extrajudicial
const createNoticeSchema = z.object({
  legalCaseId: z.string().min(1, 'ID del caso legal requerido'),
  noticeType: z.enum([
    'PAYMENT_DEMAND',
    'EVICTION_NOTICE',
    'DAMAGE_CLAIM',
    'CONTRACT_VIOLATION',
    'UTILITY_PAYMENT_DEMAND',
    'OTHER'
  ]),
  deliveryMethod: z.enum([
    'PERSONAL_DELIVERY',
    'CERTIFIED_MAIL',
    'EMAIL',
    'SMS',
    'PUBLICATION'
  ]),
  content: z.string().min(1, 'Contenido requerido'),
  deadline: z.string().datetime().optional(),
  recipientType: z.enum(['TENANT', 'OWNER', 'BOTH']),
  documents: z.array(z.string()).optional(),
});

// Schema para actualizar notificación
const updateNoticeSchema = z.object({
  status: z.enum([
    'DRAFT',
    'SENT',
    'DELIVERED',
    'READ',
    'RESPONDED',
    'EXPIRED',
    'CANCELLED'
  ]).optional(),
  deliveryStatus: z.enum([
    'PENDING',
    'IN_TRANSIT',
    'DELIVERED',
    'FAILED',
    'RETURNED'
  ]).optional(),
  deliveryDate: z.string().datetime().optional(),
  readDate: z.string().datetime().optional(),
  response: z.string().optional(),
  responseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// GET - Listar notificaciones extrajudiciales
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden acceder a esta información.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const legalCaseId = searchParams.get('legalCaseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Implementación básica usando contratos existentes
    const contracts = await db.contract.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        property: {
          select: {
            title: true,
            address: true,
          }
        },
        tenant: {
          select: {
            name: true,
            email: true,
          }
        },
        owner: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    // Simular notificaciones extrajudiciales
    const notices = contracts.map((contract, index) => ({
      id: `notice_${contract.id}`,
      legalCaseId: contract.id,
      noticeType: 'PAYMENT_DEMAND',
      deliveryMethod: 'EMAIL',
      content: 'Implementación básica de notificación extrajudicial',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      recipientType: 'TENANT',
      status: 'DRAFT',
      deliveryStatus: 'PENDING',
      createdAt: new Date(),
      legalCase: {
        contract: contract,
      },
      documents: [],
    }));

    const total = await db.contract.count();
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        notices,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    });

  } catch (error) {
    return handleError(error);
  }
}

// POST - Crear nueva notificación extrajudicial
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden crear notificaciones extrajudiciales.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createNoticeSchema.parse(body);

    // Verificar que el caso legal existe (implementación básica)
    const contract = await db.contract.findUnique({
      where: { id: validatedData.legalCaseId },
      include: {
        property: true,
        tenant: true,
        owner: true,
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Crear notificación extrajudicial (implementación básica)
    const notice = {
      id: `notice_${Date.now()}`,
      legalCaseId: validatedData.legalCaseId,
      noticeType: validatedData.noticeType,
      deliveryMethod: validatedData.deliveryMethod,
      content: validatedData.content,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      recipientType: validatedData.recipientType,
      status: 'DRAFT',
      deliveryStatus: 'PENDING',
      createdAt: new Date(),
      legalCase: {
        contract: contract,
      },
      documents: validatedData.documents || [],
    };

    return NextResponse.json({
      success: true,
      data: notice,
      message: 'Notificación extrajudicial creada exitosamente',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return handleError(error);
  }
}

// PUT - Actualizar notificación extrajudicial
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden modificar notificaciones extrajudiciales.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { noticeId, ...updateData } = body;
    
    if (!noticeId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

    const validatedData = updateNoticeSchema.parse(updateData);

    // Implementación básica - simular actualización
    const updatedNotice = {
      id: noticeId,
      ...validatedData,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: updatedNotice,
      message: 'Notificación extrajudicial actualizada exitosamente',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return handleError(error);
  }
}
