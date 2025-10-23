import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { z } from 'zod';

// Función para generar términos y condiciones base para corredores
const generateBrokerContractTerms = (
  propertyTitle: string = '[PROPIEDAD]',
  ownerName: string = '[PROPIETARIO]',
  tenantName: string = '[INQUILINO]',
  brokerName: string = '[CORREDOR]',
  startDate: string = '[FECHA_INICIO]',
  endDate: string = '[FECHA_TERMINO]',
  monthlyRent: string = '[RENTA_MENSUAL]',
  deposit: string = '[DEPÓSITO]',
  commission: string = '[COMISIÓN]'
) => {
  return `CONTRATO DE ARRIENDO DE VIVIENDA MEDIADO POR CORREDOR

Entre las partes que al final aparecen firmando, se ha convenido el siguiente contrato de arriendo de vivienda, mediado por el corredor ${brokerName}, regido por la Ley N° 18.101 y demás normas aplicables.

PRIMERA: OBJETO DEL CONTRATO
El ARRENDADOR da en arriendo al ARRENDATARIO, y este lo recibe, la propiedad ubicada en ${propertyTitle}, para ser destinada exclusivamente a habitación familiar.

SEGUNDA: INTERMEDIACIÓN DEL CORREDOR
El corredor ${brokerName} ha actuado como intermediario en la celebración del presente contrato, cobrando por sus servicios una comisión equivalente a ${commission} pesos chilenos, pagadera conforme a lo establecido en la cláusula quinta.

TERCERA: PLAZO DEL CONTRATO
El presente contrato tendrá una duración de [DURACIÓN] meses, contados desde el ${startDate} hasta el ${endDate}, prorrogándose automáticamente por períodos iguales, salvo aviso de no renovación con anticipación de 90 días.

CUARTA: RENTA Y FORMA DE PAGO
El ARRENDATARIO pagará al ARRENDADOR una renta mensual de ${monthlyRent} pesos chilenos, pagadera por adelantado dentro de los primeros 5 días de cada mes.

El primer pago deberá efectuarse al momento de suscribir el presente contrato.

QUINTA: DEPÓSITO DE GARANTÍA Y COMISIÓN
El ARRENDATARIO entrega en este acto un depósito de garantía equivalente a ${deposit} pesos chilenos.

La comisión del corredor será pagada por el ARRENDADOR en un plazo máximo de 30 días contados desde la firma del presente contrato.

SEXTA: OBLIGACIONES DEL ARRENDADOR
El ARRENDADOR se obliga a:
1. Entregar el inmueble en perfectas condiciones de habitabilidad
2. Mantener el inmueble en condiciones adecuadas durante el contrato
3. Efectuar las reparaciones necesarias para el mantenimiento normal
4. Respetar la privacidad del ARRENDATARIO
5. Permitir el uso pacífico del inmueble

SÉPTIMA: OBLIGACIONES DEL ARRENDATARIO
El ARRENDATARIO se obliga a:
1. Pagar puntualmente la renta convenida
2. Destinar el inmueble exclusivamente a habitación
3. Conservar el inmueble en buen estado
4. Permitir el acceso al inmueble para inspecciones con previo aviso de 24 horas
5. No realizar modificaciones sin autorización escrita
6. No subarrendar total o parcialmente el inmueble
7. Comunicar inmediatamente cualquier daño o desperfecto

OCTAVA: OBLIGACIONES DEL CORREDOR
El corredor se obliga a:
1. Actuar con la diligencia y lealtad debidas
2. Informar verazmente sobre las condiciones del inmueble
3. Facilitar la comunicación entre las partes
4. Mantener la confidencialidad de la información
5. Cumplir con las normas de la Ley N° 18.101

NOVENA: MORA EN EL PAGO
Si el ARRENDATARIO incurriere en mora en el pago de la renta, se aplicarán intereses de mora conforme al artículo 47 de la Ley N° 18.101, equivalentes al 1.5% mensual sobre el monto adeudado.

DÉCIMA: TERMINACIÓN ANTICIPADA
1. El ARRENDADOR podrá terminar el contrato por las causales establecidas en la Ley N° 18.101
2. El ARRENDATARIO podrá terminar el contrato dando aviso con 30 días de anticipación
3. En caso de venta del inmueble, el contrato continúa vigente con el nuevo propietario

DÉCIMA PRIMERA: LEGISLACIÓN APLICABLE
Este contrato se rige por las disposiciones de la Ley N° 18.101, Ley N° 21.461 ("Devuélveme mi Casa") y demás normas del Código Civil aplicables.

DÉCIMA SEGUNDA: DOMICILIO Y NOTIFICACIONES
Para todos los efectos del presente contrato, las partes fijan domicilio en las direcciones que anteceden. Las notificaciones se efectuarán válidamente en dichos domicilios.

EN FE DE LO CUAL, las partes firman el presente contrato en [LUGAR], a los [DÍAS] días del mes de [MES] de [AÑO].

___________________________     ___________________________
ARRENDADOR: ${ownerName}           ARRENDATARIO: ${tenantName}

RUT: [RUT_ARRENDADOR]              RUT: [RUT_ARRENDATARIO]

Domicilio: [DOMICILIO_ARRENDADOR]  Domicilio: [DOMICILIO_ARRENDATARIO]

___________________________
CORREDOR: ${brokerName}

RUT: [RUT_CORREDOR]`;
};

const createContractSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  tenantId: z.string().optional(),
  tenantName: z.string().min(1, 'Tenant name is required'),
  tenantEmail: z.string().email('Valid email is required'),
  tenantPhone: z.string().optional(),
  tenantRUT: z.string().optional(),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerEmail: z.string().email('Valid email is required'),
  ownerPhone: z.string().optional(),
  ownerRUT: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
  depositAmount: z.number().min(0, 'Deposit cannot be negative'),
  commissionAmount: z.number().min(0, 'Commission cannot be negative'),
  terms: z.string().optional(),
  sendToOwner: z.boolean().default(false),
  customMessage: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario sea corredor
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo los corredores pueden acceder a esta funcionalidad' },
        { status: 403 }
      );
    }

    // Obtener contratos del corredor
    const contracts = await db.contract.findMany({
      where: {
        brokerId: user.id,
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
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Contratos del corredor obtenidos', {
      brokerId: user.id,
      contractsCount: contracts.length,
    });

    return NextResponse.json({
      success: true,
      contracts: contracts.map(contract => ({
        id: contract.id,
        propertyTitle: contract.property?.title || 'Sin título',
        propertyAddress: contract.property?.address || 'Sin dirección',
        ownerName: contract.owner?.name || 'Sin propietario',
        tenantName: contract.tenant?.name || 'Sin inquilino',
        monthlyRent: contract.monthlyRent,
        commissionEarned: contract.commission || 0,
        status: contract.status,
        startDate: contract.startDate.toISOString().split('T')[0],
        endDate: contract.endDate.toISOString().split('T')[0],
        createdAt: contract.createdAt.toISOString(),
        signatureStatus: contract.signatureStatus || 'pending',
      })),
    });
  } catch (error) {
    logger.error('Error obteniendo contratos del corredor:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor al obtener contratos',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario sea corredor
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo los corredores pueden crear contratos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createContractSchema.parse(body);

    // Generar términos si no se proporcionaron
    const terms =
      validatedData.terms ||
      generateBrokerContractTerms(
        '[PROPIEDAD - SE ACTUALIZARÁ AL ENVIAR]',
        validatedData.ownerName,
        validatedData.tenantName,
        user.name || 'Corredor',
        validatedData.startDate,
        validatedData.endDate,
        validatedData.monthlyRent.toString(),
        validatedData.depositAmount.toString(),
        validatedData.commissionAmount.toString()
      );

    // Crear el contrato en la base de datos
    const contractData: any = {
      propertyId: validatedData.propertyId,
      brokerId: user.id,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      monthlyRent: validatedData.monthlyRent,
      depositAmount: validatedData.depositAmount,
      commission: validatedData.commissionAmount,
      terms,
      status: 'draft',
      signatureStatus: 'pending',
    };

    // Solo agregar tenantId si existe
    if (validatedData.tenantId) {
      contractData.tenantId = validatedData.tenantId;
    }

    const contract = await db.contract.create({
      data: contractData,
    });

    logger.info('Contrato creado por corredor', {
      brokerId: user.id,
      contractId: contract.id,
      sendToOwner: validatedData.sendToOwner,
    });

    // Si se solicita enviar al propietario, enviar por email
    if (validatedData.sendToOwner) {
      try {
        // Aquí iría la lógica para enviar el contrato por email
        // Por ahora, solo registramos que se debe enviar
        await sendContractToOwner(contract.id, validatedData, validatedData.customMessage);
      } catch (emailError) {
        logger.warn('Error enviando contrato por email:', emailError);
        // No fallar la creación del contrato por error de email
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contrato creado exitosamente',
      contract: {
        id: contract.id,
        status: contract.status,
        signatureStatus: contract.signatureStatus,
      },
    });
  } catch (error) {
    logger.error('Error creando contrato para corredor:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de contrato inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor al crear contrato',
      },
      { status: 500 }
    );
  }
}

// Función para enviar contrato por email al propietario
async function sendContractToOwner(
  contractId: string,
  contractData: z.infer<typeof createContractSchema>,
  customMessage?: string
) {
  // Aquí iría la lógica real de envío por email
  // Por ahora, solo registramos en logs
  logger.info('Enviando contrato por email al propietario', {
    contractId,
    ownerEmail: contractData.ownerEmail,
    ownerName: contractData.ownerName,
    customMessage: customMessage || 'Sin mensaje personalizado',
  });

  // TODO: Implementar envío real de email con:
  // 1. Generar PDF del contrato
  // 2. Crear link de firma electrónica
  // 3. Enviar email con adjunto y link
  // 4. Registrar envío en base de datos
}
