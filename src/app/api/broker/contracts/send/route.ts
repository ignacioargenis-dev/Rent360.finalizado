import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { z } from 'zod';

const sendContractSchema = z.object({
  contractId: z.string().min(1, 'Contract ID is required'),
  recipientEmail: z.string().email('Valid email is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  customMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario sea corredor
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo los corredores pueden enviar contratos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = sendContractSchema.parse(body);

    // Verificar que el contrato pertenece al corredor
    const contract = await db.contract.findFirst({
      where: {
        id: validatedData.contractId,
        brokerId: user.id,
      },
      include: {
        property: {
          select: {
            title: true,
            address: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o no tienes permisos para enviarlo' },
        { status: 404 }
      );
    }

    // Generar link de firma única
    const signatureToken = generateSignatureToken();
    const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-contract/${contract.id}?token=${signatureToken}`;

    // Guardar el token de firma en la base de datos
    await db.contract.update({
      where: { id: contract.id },
      data: {
        signatureToken,
        signatureExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      },
    });

    // Enviar email básico con link de firma
    const emailResult = await sendContractEmail({
      to: validatedData.recipientEmail,
      recipientName: validatedData.recipientName,
      contractId: contract.id,
      propertyTitle: contract.property?.title || 'Propiedad',
      signatureUrl,
      customMessage: validatedData.customMessage || '',
      brokerName: user.name || 'Corredor',
    });

    // Registrar envío en audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CONTRACT_SENT_TO_OWNER',
        entityType: 'CONTRACT',
        entityId: contract.id,
        oldValues: '{}',
        newValues: JSON.stringify({
          sentTo: validatedData.recipientEmail,
          sentAt: new Date().toISOString(),
          signatureToken,
          signatureExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      },
    });

    logger.info('Contrato enviado exitosamente', {
      contractId: contract.id,
      brokerId: user.id,
      sentTo: validatedData.recipientEmail,
      signatureToken,
    });

    return NextResponse.json({
      success: true,
      message: 'Contrato enviado exitosamente al propietario',
      signatureUrl,
      emailSent: emailResult.success,
    });
  } catch (error) {
    logger.error('Error enviando contrato:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de envío inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor al enviar contrato',
      },
      { status: 500 }
    );
  }
}

// Función para generar token único de firma
function generateSignatureToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

// Función para enviar email (simulada)
async function sendContractEmail(data: {
  to: string;
  recipientName: string;
  contractId: string;
  propertyTitle: string;
  signatureUrl: string;
  customMessage?: string;
  brokerName: string;
}) {
  try {
    // Aquí iría la integración real con un servicio de email
    // Por ejemplo: SendGrid, AWS SES, etc.

    const emailContent = {
      to: data.to,
      subject: `Contrato de Arriendo - ${data.propertyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Contrato de Arriendo</h2>
          <p>Estimado/a ${data.recipientName},</p>

          <p>Le envío el contrato de arriendo para la propiedad: <strong>${data.propertyTitle}</strong></p>

          ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}

          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📝 Firma Electrónica</h3>
            <p>Para firmar el contrato de manera segura, haga clic en el siguiente enlace:</p>
            <a href="${data.signatureUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
              Firmar Contrato Digitalmente
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Este enlace es único y expira en 30 días por seguridad.
            </p>
          </div>

          <p>Si tiene alguna pregunta, puede contactarme directamente.</p>

          <p>Atentamente,<br>
          ${data.brokerName}<br>
          Corredor Inmobiliario</p>

          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Este es un mensaje automático de Rent360. Por favor, no responda directamente a este email.
          </p>
        </div>
      `,
      // Sin adjuntos por ahora
      attachments: [],
    };

    logger.info('Email de contrato preparado para envío', {
      to: data.to,
      contractId: data.contractId,
    });

    // Simular envío exitoso
    return { success: true, messageId: 'simulated_' + Date.now() };
  } catch (error) {
    logger.error('Error preparando email de contrato:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
