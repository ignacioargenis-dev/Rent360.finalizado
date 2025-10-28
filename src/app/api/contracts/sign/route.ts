import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema de validación para firma
const signatureSchema = z.object({
  contractId: z.string().min(1, 'ID de contrato requerido'),
  signerId: z.string().min(1, 'ID del firmante requerido'),
  signatureType: z.enum(['DIGITAL', 'ADVANCED', 'QUALIFIED']),
  otpCode: z.string().optional(),
  certificateData: z
    .object({
      certificateNumber: z.string(),
      issuer: z.string(),
      validFrom: z.string(),
      validTo: z.string(),
    })
    .optional(),
});

// Configuración de proveedores de firma electrónica
type SignatureProviderKey = 'ADVANCED' | 'QUALIFIED';
const SIGNATURE_PROVIDERS: Record<
  SignatureProviderKey,
  {
    name: string;
    apiUrl: string | undefined;
    apiKey: string | undefined;
    secretKey: string | undefined;
  }
> = {
  ADVANCED: {
    name: 'Firma Electrónica Avanzada',
    apiUrl: process.env.ADVANCED_SIGNATURE_API_URL,
    apiKey: process.env.ADVANCED_SIGNATURE_API_KEY,
    secretKey: process.env.ADVANCED_SIGNATURE_SECRET_KEY,
  },
  QUALIFIED: {
    name: 'Firma Electrónica Cualificada',
    apiUrl: process.env.QUALIFIED_SIGNATURE_API_URL,
    apiKey: process.env.QUALIFIED_SIGNATURE_API_KEY,
    secretKey: process.env.QUALIFIED_SIGNATURE_SECRET_KEY,
  },
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = signatureSchema.parse(body);

    const { contractId, signerId, signatureType, otpCode, certificateData } = validatedData;

    // Verificar que el contrato existe
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        property: true,
        owner: true,
        tenant: true,
        broker: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario tiene permisos para firmar
    const canSign =
      user.id === contract.ownerId ||
      user.id === contract.tenantId ||
      user.id === contract.brokerId ||
      user.role === 'ADMIN';

    if (!canSign) {
      return NextResponse.json(
        { error: 'No tienes permisos para firmar este contrato' },
        { status: 403 }
      );
    }

    // Verificar que el contrato está en estado válido para firma
    if (contract.status !== 'DRAFT' && contract.status !== ('PENDING' as any)) {
      return NextResponse.json(
        { error: 'El contrato no está en estado válido para firma' },
        { status: 400 }
      );
    }

    // Obtener configuración del proveedor (normalizar DIGITAL -> ADVANCED)
    const providerKey: SignatureProviderKey =
      signatureType === 'DIGITAL' ? 'ADVANCED' : signatureType;
    const provider = SIGNATURE_PROVIDERS[providerKey];
    if (!provider || !provider.apiUrl || !provider.apiKey) {
      return NextResponse.json(
        { error: 'Proveedor de firma electrónica no configurado' },
        { status: 500 }
      );
    }

    // Generar documento para firma
    const documentContent = generateContractDocument(contract);
    const documentHash = generateDocumentHash(documentContent);

    // Crear solicitud de firma
    const signatureRequest = {
      documentHash,
      documentContent,
      signerId,
      contractId,
      signatureType,
      timestamp: new Date().toISOString(),
      metadata: {
        contractNumber: contract.contractNumber,
        propertyAddress: contract.property?.address,
        ownerName: contract.owner?.name,
        tenantName: contract.tenant?.name,
      },
    };

    // Enviar a proveedor de firma electrónica
    const signatureResponse = await sendToSignatureProvider(
      provider,
      signatureRequest,
      otpCode,
      certificateData
    );

    if (!signatureResponse.success) {
      return NextResponse.json(
        { error: signatureResponse.error || 'Error en el proceso de firma' },
        { status: 400 }
      );
    }

    // Guardar firma en base de datos
    const signature = await db.contractSignature.create({
      data: {
        contractId,
        signerId,
        signatureType,
        signatureHash: signatureResponse.signatureHash,
        certificateData: certificateData ? JSON.stringify(certificateData) : null,
        signedAt: new Date(),
        signatureProvider: provider.name,
        signatureData: JSON.stringify(signatureResponse),
        documentName: `Contrato ${contract.contractNumber}`,
        documentHash: signatureResponse.documentHash || signatureResponse.signatureHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        signers: JSON.stringify([signerId]),
      },
    });

    // Actualizar estado del contrato
    const allSignatures = await db.contractSignature.findMany({
      where: { contractId },
    });

    const requiredSignatures: string[] = [];
    if (contract.ownerId) {
      requiredSignatures.push(contract.ownerId);
    }
    if (contract.tenantId) {
      requiredSignatures.push(contract.tenantId);
    }
    if (contract.brokerId) {
      requiredSignatures.push(contract.brokerId);
    }

    const isFullySigned = requiredSignatures.every(signerId =>
      allSignatures.some(sig => sig.signerId === signerId)
    );

    await db.contract.update({
      where: { id: contractId },
      data: {
        status: isFullySigned ? 'ACTIVE' : ('PENDING' as any),
        signedAt: isFullySigned ? new Date() : null,
      },
    });

    // Crear notificación
    await db.notification.create({
      data: {
        userId: contract.ownerId || '',
        title: 'Contrato Firmado',
        message: `El contrato ${contract.contractNumber} ha sido firmado por ${user.name}`,
        type: 'CONTRACT' as any,
        data: JSON.stringify({ contractId, signerId: user.id }),
      },
    });

    return NextResponse.json({
      message: 'Firma procesada exitosamente',
      signature: {
        id: signature.id,
        signatureHash: signature.signatureHash,
        signedAt: signature.signedAt,
        isFullySigned,
      },
    });
  } catch (error) {
    logger.error('Error en firma electrónica:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error as Error);
  }
}

// Función para generar documento del contrato
function generateContractDocument(contract: any): string {
  const template = `
CONTRATO DE ARRIENDO DE INMUEBLE

Número de Contrato: ${contract.contractNumber}
Fecha de Celebración: ${new Date().toLocaleDateString('es-CL')}

1. PARTES CONTRATANTES

ARRENDADOR:
Nombre: ${contract.owner?.name}
RUT: ${contract.owner?.rut || 'No especificado'}
Email: ${contract.owner?.email}

ARRENDATARIO:
Nombre: ${contract.tenant?.name}
RUT: ${contract.tenant?.rut || 'No especificado'}
Email: ${contract.tenant?.email}

${
  contract.broker
    ? `
CORREDOR:
Nombre: ${contract.broker.name}
RUT: ${contract.broker.rut || 'No especificado'}
Email: ${contract.broker.email}
`
    : ''
}

2. INMUEBLE ARRENDADO

Dirección: ${contract.property?.address}
Comuna: ${contract.property?.commune}
Ciudad: ${contract.property?.city}
Región: ${contract.property?.region}
Superficie: ${contract.property?.area} m²
Dormitorios: ${contract.property?.bedrooms}
Baños: ${contract.property?.bathrooms}

3. CONDICIONES DEL ARRIENDO

Monto Mensual: $${contract.monthlyRent.toLocaleString('es-CL')}
Depósito: $${contract.depositAmount.toLocaleString('es-CL')}
Fecha de Inicio: ${new Date(contract.startDate).toLocaleDateString('es-CL')}
Fecha de Término: ${new Date(contract.endDate).toLocaleDateString('es-CL')}

4. OBLIGACIONES DEL ARRENDATARIO

- Pagar puntualmente el arriendo mensual
- Mantener el inmueble en buen estado
- No realizar modificaciones sin autorización
- Comunicar cualquier daño o desperfecto
- Respetar las normas de convivencia

5. OBLIGACIONES DEL ARRENDADOR

- Entregar el inmueble en buen estado
- Realizar las reparaciones necesarias
- Respetar la privacidad del arrendatario
- Mantener las instalaciones comunes

6. TÉRMINOS Y CONDICIONES

Este contrato se rige por la Ley de Arrendamiento de Inmuebles Urbanos (Ley N° 18.101) y sus modificaciones.

${contract.terms || ''}

7. FIRMAS

ARRENDADOR: _____________________
Fecha: _____________________

ARRENDATARIO: _____________________
Fecha: _____________________

${
  contract.broker
    ? `
CORREDOR: _____________________
Fecha: _____________________
`
    : ''
}
  `;

  return template.trim();
}

// Función para generar hash del documento
function generateDocumentHash(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Función para enviar a proveedor de firma
async function sendToSignatureProvider(
  provider: any,
  request: any,
  otpCode?: string,
  certificateData?: any
): Promise<any> {
  try {
    const response = await fetch(`${provider.apiUrl}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
        'X-API-Secret': provider.secretKey,
      },
      body: JSON.stringify({
        ...request,
        otpCode,
        certificateData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Error en proveedor de firma',
      };
    }

    const result = await response.json();
    return {
      success: true,
      signatureHash: result.signatureHash,
      certificate: result.certificate,
      timestamp: result.timestamp,
    };
  } catch (error) {
    logger.error('Error con proveedor de firma:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Error de conexión con proveedor de firma',
    };
  }
}
