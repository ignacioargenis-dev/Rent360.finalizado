import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contractId = params.id;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token de firma requerido' }, { status: 400 });
    }

    // Buscar contrato por ID y token de firma
    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
        signatureToken: token,
        OR: [{ signatureExpiresAt: null }, { signatureExpiresAt: { gt: new Date() } }],
      },
      include: {
        property: {
          select: {
            title: true,
            address: true,
            city: true,
          },
        },
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
        broker: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o enlace expirado' },
        { status: 404 }
      );
    }

    // Verificar que el contrato esté en estado correcto para firma
    if (contract.signatureStatus === 'signed') {
      return NextResponse.json({ error: 'Este contrato ya ha sido firmado' }, { status: 400 });
    }

    // Obtener información del propietario (por ahora solo desde relaciones)
    let ownerName = 'Propietario';
    let ownerEmail = '';

    // Si hay un brokerId, obtener nombre del corredor
    let brokerName = contract.broker ? contract.broker.name : 'Sin corredor';

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        propertyTitle: contract.property?.title || 'Propiedad',
        propertyAddress: contract.property?.address || 'Dirección no especificada',
        tenantName: contract.tenant?.name || 'No especificado',
        tenantEmail: contract.tenant?.email || '',
        ownerName,
        ownerEmail,
        brokerName,
        monthlyRent: contract.monthlyRent,
        startDate: contract.startDate.toISOString().split('T')[0],
        endDate: contract.endDate.toISOString().split('T')[0],
        terms: contract.terms,
        status: contract.status,
        signatureStatus: contract.signatureStatus,
        signatureToken: contract.signatureToken,
        signatureExpiresAt: contract.signatureExpiresAt?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error obteniendo contrato para firma:', {
      error: error instanceof Error ? error.message : String(error),
      contractId: params.id,
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contractId = params.id;
    const body = await request.json();
    const { token, signerName, signerRUT, signature, acceptTerms } = body;

    if (!token || !signerName || !signerRUT || !acceptTerms) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben estar completos' },
        { status: 400 }
      );
    }

    // Verificar contrato y token
    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
        signatureToken: token,
        signatureStatus: { not: 'signed' },
        OR: [{ signatureExpiresAt: null }, { signatureExpiresAt: { gt: new Date() } }],
      },
      include: {
        property: {
          select: {
            title: true,
          },
        },
        broker: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado, expirado o ya firmado' },
        { status: 404 }
      );
    }

    // Actualizar contrato con firma electrónica
    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: {
        signatureStatus: 'signed',
        signedAt: new Date(),
      },
    });

    // Registrar en audit log
    await db.auditLog.create({
      data: {
        userId: contract.brokerId || 'system', // Usar brokerId si existe, sino 'system'
        action: 'CONTRACT_SIGNED_ELECTRONICALLY',
        entityType: 'CONTRACT',
        entityId: contractId,
        oldValues: JSON.stringify({ signatureStatus: contract.signatureStatus }),
        newValues: JSON.stringify({
          signatureStatus: 'signed',
          signerName,
          signerRUT,
          signedAt: updatedContract.signedAt,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      },
    });

    // TODO: Integrar con el sistema de firma electrónica existente
    // El sistema ya tiene proveedores configurados: FirmaPro, TrustFactory, FirmaYa
    // Para contratos, se debe usar firma electrónica avanzada/calificada

    logger.info('Contrato firmado electrónicamente', {
      contractId,
      signerName,
      signerRUT,
      signedAt: updatedContract.signedAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Contrato firmado exitosamente con firma electrónica',
      contract: {
        id: updatedContract.id,
        signatureStatus: updatedContract.signatureStatus,
        signedAt: updatedContract.signedAt,
      },
    });
  } catch (error) {
    logger.error('Error procesando firma electrónica:', {
      error: error instanceof Error ? error.message : String(error),
      contractId: params.id,
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor al procesar la firma',
      },
      { status: 500 }
    );
  }
}
