import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { signatureService } from '@/lib/signature';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { SignatureType } from '@/lib/signature/types';
import { SignatureStatus } from '@/lib/signature/types';
import { db } from '@/lib/db';

// Schema para crear firma
const createSignatureSchema = z.object({
  documentId: z.string().min(1, 'ID de documento requerido'),
  documentName: z.string().min(1, 'Nombre de documento requerido'),
  documentHash: z.string().min(1, 'Hash del documento requerido'),
  signers: z.array(z.object({
    rut: z.string().min(1, 'RUT requerido'),
    email: z.string().email('Email válido requerido'),
    name: z.string().min(1, 'Nombre requerido'),
    phone: z.string().optional(),
    order: z.number().min(1, 'Orden debe ser mayor a 0'),
    isRequired: z.boolean().default(true)
  })).min(1, 'Al menos un firmante requerido'),
  type: z.nativeEnum(SignatureType).default(SignatureType.QUALIFIED),
  provider: z.string().optional(), // Si no se especifica, se selecciona automáticamente
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

// Schema para consultar firmas
const getSignaturesSchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().default('10').transform(Number).pipe(z.number().min(1).max(100)),
  status: z.nativeEnum(SignatureStatus).optional(),
  documentId: z.string().optional(),
  userId: z.string().optional()
});

/**
 * GET /api/signatures - Listar firmas del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      documentId: searchParams.get('documentId') || undefined,
      userId: searchParams.get('userId') || undefined
    };

    const validatedParams = getSignaturesSchema.parse(queryParams);

    // Filtrar por usuario actual si no es admin
    const filters = {
      ...validatedParams,
      userId: user.role === 'ADMIN' ? validatedParams.userId : user.id
    };

    // Obtener firmas desde la base de datos
    const skip = (filters.page - 1) * filters.limit;

    const whereClause: any = {};

    // Solo mostrar firmas del usuario actual si no es admin
    if (user.role !== 'ADMIN') {
      whereClause.signerId = user.id;
    } else if (filters.userId) {
      whereClause.signerId = filters.userId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.documentId) {
      // Buscar por contractId que contiene el documentId
      whereClause.contractId = filters.documentId;
    }

    const signatures = await db.contractSignature.findMany({
      where: whereClause,
      include: {
        contract: {
          include: {
            property: {
              select: { id: true, title: true, address: true }
            }
          }
        },
        signer: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit
    });

    const totalCount = await db.contractSignature.count({ where: whereClause });

    logger.info('Firmas consultadas exitosamente:', {
      userId: user.id,
      filters,
      count: signatures.length,
      totalCount
    });

    return NextResponse.json({
      data: signatures,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / filters.limit)
      }
    });

  } catch (error) {
    logger.error('Error consultando firmas:', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/signatures - Crear nueva solicitud de firma
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = createSignatureSchema.parse(body);

    // Verificar que el documento existe
    const document = await db.document.findUnique({
      where: { id: validatedData.documentId }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos básicos (documento debe existir)
    // Los documentos nuevos no tienen campo status, se asume que están activos

    // Crear solicitud de firma usando el servicio unificado
    const signatureResult = await signatureService.createSignatureRequest(
      validatedData.documentId,
      validatedData.signers,
      validatedData.provider
    );

    if (!signatureResult.success) {
      logger.error('Error creando solicitud de firma:', {
        userId: user.id,
        documentId: validatedData.documentId,
        error: signatureResult.message
      });

      return NextResponse.json(
        { error: signatureResult.message },
        { status: 400 }
      );
    }

    // Verificar que tenemos un ID válido
    if (!signatureResult.signatureId) {
      logger.error('No se recibió signatureId del servicio de firmas');
      return NextResponse.json(
        { error: 'Error interno al crear la firma' },
        { status: 500 }
      );
    }

    // Guardar en base de datos
    const dbSignature = await db.signatureRequest.create({
      data: {
        id: signatureResult.signatureId,
        documentId: validatedData.documentId,
        type: validatedData.type,
        status: signatureResult.status,
        provider: signatureResult.provider,
        ...(signatureResult.metadata?.expiresAt && {
          expiresAt: new Date(signatureResult.metadata.expiresAt)
        }),
        metadata: JSON.stringify(signatureResult.metadata || {}),
        signers: {
          create: validatedData.signers.map(signer => ({
            email: signer.email,
            name: signer.name || '',
            role: determineSignerRole(signer, validatedData.signers.length),
            status: 'pending',
            metadata: JSON.stringify({
              rut: signer.rut,
              phone: signer.phone || '',
              order: signer.order,
              isRequired: signer.isRequired
            })
          }))
        }
      },
      include: {
        signers: true
      }
    });

    logger.info('Solicitud de firma creada exitosamente:', {
      signatureId: signatureResult.signatureId,
      userId: user.id,
      documentId: validatedData.documentId,
      provider: signatureResult.provider,
      signersCount: validatedData.signers.length
    });

    return NextResponse.json({
      success: true,
      signatureId: signatureResult.signatureId,
      status: signatureResult.status,
      provider: signatureResult.provider,
      message: signatureResult.message,
      databaseRecord: {
        id: dbSignature.id,
        documentId: dbSignature.documentId,
        status: dbSignature.status,
        provider: dbSignature.provider,
        signers: dbSignature.signers
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creando firma:', {
      error: error instanceof Error ? error.message : String(error)
    });

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

/**
 * Determinar el rol del firmante basado en su posición
 */
function determineSignerRole(signer: any, totalSigners: number): string {
  if (signer.role) {
    return signer.role;
  }

  // Lógica por defecto basada en el orden
  if (signer.order === 1) return 'OWNER'; // Propietario/Arrendador
  if (signer.order === 2) return 'TENANT'; // Inquilino/Arrendatario
  return 'GUARANTOR'; // Fiador u otro rol
}
