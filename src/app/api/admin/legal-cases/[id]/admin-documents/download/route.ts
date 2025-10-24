import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import archiver from 'archiver';
import { Readable } from 'stream';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const caseId = params.id;

    // Obtener el caso legal
    const legalCase = await db.legalCase.findUnique({
      where: { id: caseId },
      include: {
        contract: {
          include: {
            property: {
              include: {
                owner: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!legalCase) {
      return NextResponse.json({ error: 'Caso legal no encontrado' }, { status: 404 });
    }

    // Crear un archivo ZIP con documentos administrativos
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Configurar headers para descarga
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set(
      'Content-Disposition',
      `attachment; filename="Expediente_Admin_${legalCase.caseNumber}.zip"`
    );

    // Crear stream de respuesta
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', chunk => {
          controller.enqueue(chunk);
        });

        archive.on('end', () => {
          controller.close();
        });

        archive.on('error', err => {
          controller.error(err);
        });
      },
    });

    // Agregar documentos al archivo ZIP
    try {
      // Documento de resumen del caso
      const caseSummary = `
CASO LEGAL: ${legalCase.caseNumber}
=====================================

INFORMACIÓN DEL CASO:
- Número de Caso: ${legalCase.caseNumber}
- Tipo: ${legalCase.caseType}
- Estado: ${legalCase.status}
- Fase Actual: ${legalCase.currentPhase}
- Fecha de Creación: ${legalCase.createdAt.toISOString().split('T')[0]}
- Fecha de Última Actualización: ${legalCase.updatedAt.toISOString().split('T')[0]}

DESCRIPCIÓN:
${legalCase.notes || 'Sin descripción'}

DETALLES DEL CONTRATO:
- ID del Contrato: ${legalCase.contract.id}
- Propiedad: ${legalCase.contract.property.title}
- Dirección: ${legalCase.contract.property.address}
- Propietario: ${legalCase.contract.property.owner?.name || 'No especificado'}
- Email del Propietario: ${legalCase.contract.property.owner?.email || 'No especificado'}
- Inquilino: ${legalCase.contract.tenant?.name || 'No especificado'}
- Email del Inquilino: ${legalCase.contract.tenant?.email || 'No especificado'}
- Renta Mensual: $${legalCase.contract.monthlyRent}

ESTADO ACTUAL:
- Estado: ${legalCase.status}
- Fase: ${legalCase.currentPhase}
- Prioridad: ${legalCase.priority}
- Monto en Disputa: $${legalCase.totalAmount || 'No especificado'}

NOTAS ADMINISTRATIVAS:
${legalCase.internalNotes || 'No hay notas administrativas registradas.'}

FECHA DE GENERACIÓN: ${new Date().toISOString()}
GENERADO POR: ${user.name || user.email}
      `.trim();

      archive.append(caseSummary, { name: '01_Resumen_Caso.txt' });

      // Documento de información del contrato
      const contractInfo = `
INFORMACIÓN DEL CONTRATO
========================

CONTRATO ID: ${legalCase.contract.id}
PROPIEDAD: ${legalCase.contract.property.title}
DIRECCIÓN: ${legalCase.contract.property.address}

PROPIETARIO:
- Nombre: ${legalCase.contract.property.owner?.name || 'No especificado'}
- Email: ${legalCase.contract.property.owner?.email || 'No especificado'}
- Teléfono: ${legalCase.contract.property.owner?.phone || 'No disponible'}

INQUILINO:
- Nombre: ${legalCase.contract.tenant?.name || 'No especificado'}
- Email: ${legalCase.contract.tenant?.email || 'No especificado'}
- Teléfono: ${legalCase.contract.tenant?.phone || 'No disponible'}

DETALLES FINANCIEROS:
- Renta Mensual: $${legalCase.contract.monthlyRent}
- Depósito: $${legalCase.contract.depositAmount || 'No especificado'}
- Fecha de Inicio: ${legalCase.contract.startDate.toISOString().split('T')[0]}
- Fecha de Fin: ${legalCase.contract.endDate?.toISOString().split('T')[0] || 'Indefinido'}

ESTADO DEL CONTRATO: ${legalCase.contract.status}
      `.trim();

      archive.append(contractInfo, { name: '02_Informacion_Contrato.txt' });

      // Documento de seguimiento administrativo
      const adminTracking = `
SEGUIMIENTO ADMINISTRATIVO
==========================

CASO: ${legalCase.caseNumber}
FECHA DE GENERACIÓN: ${new Date().toISOString()}
GENERADO POR: ${user.name || user.email}

HISTORIAL DE ESTADOS:
- Estado Actual: ${legalCase.status}
- Fase Actual: ${legalCase.currentPhase}
- Prioridad: ${legalCase.priority}

ACCIONES RECOMENDADAS:
1. Revisar documentación del caso
2. Contactar a las partes involucradas si es necesario
3. Actualizar el estado según corresponda
4. Documentar cualquier comunicación adicional

PRÓXIMOS PASOS:
- Seguimiento programado según la fase actual
- Revisión de documentos pendientes
- Comunicación con el equipo legal si es necesario

NOTAS ADICIONALES:
${legalCase.internalNotes || 'No hay notas adicionales.'}
      `.trim();

      archive.append(adminTracking, { name: '03_Seguimiento_Administrativo.txt' });

      // Finalizar el archivo
      archive.finalize();
    } catch (error) {
      logger.error('Error creando documentos administrativos:', {
        error: error instanceof Error ? error.message : String(error),
        caseId,
      });
      throw error;
    }

    return new Response(stream, { headers });
  } catch (error) {
    logger.error('Error descargando documentos administrativos:', {
      error: error instanceof Error ? error.message : String(error),
      caseId: params.id,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
