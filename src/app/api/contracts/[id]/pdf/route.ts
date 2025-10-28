import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const contractId = params.id;

    // Buscar el contrato
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            type: true,
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
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar permisos: solo propietario, inquilino o broker pueden descargar
    const hasPermission =
      contract.ownerId === user.id ||
      contract.tenantId === user.id ||
      contract.brokerId === user.id ||
      user.role === 'ADMIN';

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para descargar este contrato' },
        { status: 403 }
      );
    }

    // Generar HTML del contrato
    const htmlContent = generateContractHTML(contract);

    // Usar puppeteer para generar PDF real
    logger.info('Iniciando generación de PDF para contrato:', contractId);

    const puppeteer = await import('puppeteer');

    // Configuración especial para diferentes entornos
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    };

    // En desarrollo, usar configuración más simple
    if (process.env.NODE_ENV === 'development') {
      launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    }

    logger.info('Configuración de Puppeteer:', {
      env: process.env.NODE_ENV,
      args: launchOptions.args,
    });

    const browser = await puppeteer.default.launch(launchOptions);

    try {
      logger.info('Creando nueva página en Puppeteer');
      const page = await browser.newPage();

      logger.info('Configurando contenido HTML');
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Agregar un pequeño delay para asegurar que el contenido se renderice
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.info('Generando PDF');
      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      });

      logger.info('PDF generado exitosamente, tamaño:', pdfBuffer.length);
      await browser.close();

      // Devolver el PDF real
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="contrato-${contract.contractNumber || contract.id}.pdf"`,
        },
      });
    } catch (pdfError) {
      logger.error('Error generando PDF:', {
        error: pdfError instanceof Error ? pdfError.message : String(pdfError),
        contractId: params.id,
      });
      await browser.close();
      throw pdfError;
    }
  } catch (error) {
    logger.error('Error completo generando PDF del contrato:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      contractId: params.id,
      userId: user.id,
      userRole: user.role,
      nodeEnv: process.env.NODE_ENV,
    });

    // Proporcionar mensaje de error más específico
    let errorMessage = 'Error interno del servidor al generar el PDF';

    if (error instanceof Error) {
      if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Error de conexión al generar el PDF. Intente nuevamente.';
      } else if (error.message.includes('Browser has been closed')) {
        errorMessage = 'Error en el proceso de generación de PDF. Intente nuevamente.';
      } else if (error.message.includes('Page crashed')) {
        errorMessage = 'Error al renderizar el PDF. Intente nuevamente.';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Función para generar HTML del contrato
function generateContractHTML(contract: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Contrato de Arrendamiento</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .terms { background: #f9f9f9; padding: 15px; border-left: 4px solid #007acc; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CONTRATO DE ARRENDAMIENTO</h1>
            <h2>Número: ${contract.contractNumber || contract.id}</h2>
        </div>

        <div class="section">
            <h3>INFORMACIÓN GENERAL</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Fecha de Inicio:</span>
                    <span class="value">${new Date(contract.startDate).toLocaleDateString('es-ES')}</span>
                </div>
                <div class="info-item">
                    <span class="label">Fecha de Término:</span>
                    <span class="value">${new Date(contract.endDate).toLocaleDateString('es-ES')}</span>
                </div>
                <div class="info-item">
                    <span class="label">Renta Mensual:</span>
                    <span class="value">$${contract.monthlyRent?.toLocaleString('es-ES') || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Depósito Garantía:</span>
                    <span class="value">$${contract.depositAmount?.toLocaleString('es-ES') || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>PROPIEDAD</h3>
            <div class="info-item">
                <span class="label">Dirección:</span>
                <span class="value">${contract.property?.address || contract.property?.title || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="label">Ciudad:</span>
                <span class="value">${contract.property?.city || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="label">Tipo:</span>
                <span class="value">${contract.property?.type || 'N/A'}</span>
            </div>
        </div>

        <div class="section">
            <h3>PARTES CONTRATANTES</h3>

            <div style="margin-bottom: 20px;">
                <h4>PROPIETARIO</h4>
                <div class="info-item">
                    <span class="label">Nombre:</span>
                    <span class="value">${contract.owner?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Email:</span>
                    <span class="value">${contract.owner?.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">RUT:</span>
                    <span class="value">${contract.owner?.rut || 'N/A'}</span>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h4>INQUILINO</h4>
                <div class="info-item">
                    <span class="label">Nombre:</span>
                    <span class="value">${contract.tenant?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Email:</span>
                    <span class="value">${contract.tenant?.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">RUT:</span>
                    <span class="value">${contract.tenantRut || contract.tenant?.rut || 'N/A'}</span>
                </div>
            </div>

            ${
              contract.broker
                ? `
            <div>
                <h4>CORREDOR</h4>
                <div class="info-item">
                    <span class="label">Nombre:</span>
                    <span class="value">${contract.broker.name}</span>
                </div>
                <div class="info-item">
                    <span class="label">Email:</span>
                    <span class="value">${contract.broker.email}</span>
                </div>
            </div>
            `
                : ''
            }
        </div>

        <div class="section">
            <h3>TÉRMINOS Y CONDICIONES</h3>
            <div class="terms">
                ${contract.terms || 'Los términos específicos del contrato serán detallados en el documento completo.'}
            </div>
        </div>

        <div class="section">
            <h3>ESTADO DEL CONTRATO</h3>
            <div class="info-item">
                <span class="label">Estado Actual:</span>
                <span class="value">${getStatusText(contract.status)}</span>
            </div>
            <div class="info-item">
                <span class="label">Fecha de Creación:</span>
                <span class="value">${new Date(contract.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
            <p>Este documento fue generado automáticamente por Rent360 el ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
    </body>
    </html>
  `;
}

// Función auxiliar para obtener el texto del estado
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    DRAFT: 'Borrador',
    PENDING: 'Pendiente de Firma',
    ACTIVE: 'Activo',
    EXPIRED: 'Expirado',
    TERMINATED: 'Terminado',
  };
  return statusMap[status] || status;
}
