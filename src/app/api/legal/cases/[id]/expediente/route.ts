import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const caseId = params.id;

    // Obtener el caso legal con toda la información
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
                type: true,
                bedrooms: true,
                bathrooms: true,
                area: true,
                price: true,
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
      (user.role === 'BROKER' && legalCase.contract?.brokerId === user.id);

    if (!canAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Generar el expediente en formato HTML
    const expedienteHTML = generateExpedienteHTML(legalCase);

    // Crear un archivo temporal
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `expediente-${legalCase.caseNumber}-${timestamp}.html`;

    // En un entorno real, aquí se generaría un PDF
    // Por ahora, devolvemos el HTML como respuesta
    return new Response(expedienteHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logger.error('Error generating expediente:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function generateExpedienteHTML(legalCase: any): string {
  const contract = legalCase.contract;
  const property = contract?.property;
  const tenant = contract?.tenant;
  const owner = contract?.owner;
  const broker = contract?.broker;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expediente Legal - ${legalCase.caseNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #555; }
        .info-value { color: #333; }
        .documents-list { list-style: none; padding: 0; }
        .documents-list li { padding: 5px 0; border-bottom: 1px solid #eee; }
        .audit-log { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .audit-entry { margin-bottom: 10px; padding: 5px; border-left: 3px solid #007bff; }
        .financial-summary { background: #e8f4fd; padding: 15px; border-radius: 5px; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-active { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-resolved { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="header">
        <h1>EXPEDIENTE LEGAL</h1>
        <h2>Caso: ${legalCase.caseNumber}</h2>
        <p>Generado el: ${new Date().toLocaleDateString('es-CL')}</p>
    </div>

    <div class="section">
        <h2>📋 Información del Caso</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Número de Caso:</span>
                <span class="info-value">${legalCase.caseNumber}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Tipo de Caso:</span>
                <span class="info-value">${legalCase.caseType}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="info-value status-badge status-${legalCase.status.toLowerCase()}">${legalCase.status}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fase Actual:</span>
                <span class="info-value">${legalCase.currentPhase}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Prioridad:</span>
                <span class="info-value">${legalCase.priority}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha de Creación:</span>
                <span class="info-value">${new Date(legalCase.createdAt).toLocaleDateString('es-CL')}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🏠 Información de la Propiedad</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Título:</span>
                <span class="info-value">${property?.title || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Dirección:</span>
                <span class="info-value">${property?.address || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Ciudad:</span>
                <span class="info-value">${property?.city || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Región:</span>
                <span class="info-value">${property?.region || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Tipo:</span>
                <span class="info-value">${property?.type || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Habitaciones:</span>
                <span class="info-value">${property?.bedrooms || 'N/A'}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>👥 Partes Involucradas</h2>
        <div class="info-grid">
            <div>
                <h3>Propietario</h3>
                <div class="info-item">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">${owner?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${owner?.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">${owner?.phone || 'N/A'}</span>
                </div>
            </div>
            <div>
                <h3>Inquilino</h3>
                <div class="info-item">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">${tenant?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${tenant?.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">${tenant?.phone || 'N/A'}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>💰 Resumen Financiero</h2>
        <div class="financial-summary">
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Deuda Total:</span>
                    <span class="info-value">$${legalCase.totalDebt?.toLocaleString('es-CL') || '0'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Intereses Acumulados:</span>
                    <span class="info-value">$${legalCase.accumulatedInterest?.toLocaleString('es-CL') || '0'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Honorarios Legales:</span>
                    <span class="info-value">$${legalCase.legalFees?.toLocaleString('es-CL') || '0'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Costas Judiciales:</span>
                    <span class="info-value">$${legalCase.courtFees?.toLocaleString('es-CL') || '0'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Monto Total:</span>
                    <span class="info-value"><strong>$${legalCase.totalAmount?.toLocaleString('es-CL') || '0'}</strong></span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📄 Documentos del Caso</h2>
        <ul class="documents-list">
            <li>No hay documentos registrados</li>
        </ul>
    </div>

    <div class="section">
        <h2>📝 Historial de Auditoría</h2>
        <div class="audit-log">
            <p>No hay registros de auditoría</p>
        </div>
    </div>

    <div class="section">
        <h2>📝 Notas del Caso</h2>
        <p>${legalCase.notes || 'No hay notas registradas'}</p>
    </div>

    <div class="section">
        <h2>📅 Fechas Importantes</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Primera Fecha de Incumplimiento:</span>
                <span class="info-value">${legalCase.firstDefaultDate ? new Date(legalCase.firstDefaultDate).toLocaleDateString('es-CL') : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Próxima Fecha Límite:</span>
                <span class="info-value">${legalCase.nextDeadline ? new Date(legalCase.nextDeadline).toLocaleDateString('es-CL') : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha de Audiencia:</span>
                <span class="info-value">${legalCase.courtDate ? new Date(legalCase.courtDate).toLocaleDateString('es-CL') : 'N/A'}</span>
            </div>
        </div>
    </div>

    <footer style="margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px;">
        <p><strong>Rent360 - Sistema de Gestión Inmobiliaria</strong></p>
        <p>Expediente generado automáticamente el ${new Date().toLocaleString('es-CL')}</p>
    </footer>
</body>
</html>
  `;
}
