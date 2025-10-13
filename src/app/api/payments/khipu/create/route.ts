import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Definir tipos locales para enums de Prisma
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIAL' | 'OVERDUE';
type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CHECK' | 'OTHER' | 'KHIPU' | 'DIGITAL_WALLET';

interface KhipuPaymentRequest {
  amount: number
  currency: string
  subject: string
  body: string
  return_url: string
  cancel_url: string
  notify_url: string
  payer_email?: string | undefined
  payer_name?: string | undefined
  contract_id?: string | undefined
  user_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body: KhipuPaymentRequest = await request.json();
    
    // Validar datos requeridos
    if (!body.amount || !body.subject || !body.return_url || !body.cancel_url || !body.notify_url) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 },
      );
    }

    // Configuración de Khipu desde variables de entorno
    const KHIPU_API_URL = process.env.KHIPU_API_URL || 'https://khipu.com/api/2.0/payments';
    const KHIPU_SECRET_KEY = process.env.KHIPU_SECRET_KEY;
    const KHIPU_RECEIVER_ID = process.env.KHIPU_RECEIVER_ID;
    const KHIPU_ENVIRONMENT = process.env.KHIPU_ENVIRONMENT || 'test';

    // Validar configuración de Khipu
    if (!KHIPU_SECRET_KEY || !KHIPU_RECEIVER_ID) {
      logger.error('Khipu configuration missing:', { 
        hasSecretKey: !!KHIPU_SECRET_KEY, 
        hasReceiverId: !!KHIPU_RECEIVER_ID, 
      });
      return NextResponse.json(
        { 
          error: 'Configuración de pagos no disponible',
          code: 'PAYMENT_CONFIG_ERROR',
        },
        { status: 503 },
      );
    }

    // Crear payment ID único
    const paymentId = `rent360_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Preparar datos para Khipu
    const khipuData = {
      receiver_id: KHIPU_RECEIVER_ID,
      subject: body.subject,
      amount: body.amount.toString(),
      currency: body.currency || 'CLP',
      body: body.body,
      notify_url: body.notify_url,
      return_url: body.return_url,
      cancel_url: body.cancel_url,
      custom: JSON.stringify({
        payment_id: paymentId,
        contract_id: body.contract_id,
        user_id: body.user_id,
        platform: 'rent360',
      }),
      payer_email: body.payer_email,
      payer_name: body.payer_name,
      expires_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      transaction_id: paymentId,
    };

    // Enviar solicitud a Khipu
    const response = await fetch(KHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KHIPU_SECRET_KEY}`,
      },
      body: JSON.stringify(khipuData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Error de Khipu', { error: errorData instanceof Error ? errorData.message : String(errorData) });
      return NextResponse.json(
        { 
          error: 'Error al crear pago en Khipu', 
          details: errorData,
          code: 'KHIPU_API_ERROR',
        },
        { status: 500 },
      );
    }

    const khipuResponse = await response.json();

    // Validar respuesta de Khipu
    if (!khipuResponse.payment_url && !khipuResponse.simplified_transfer_url) {
      logger.error('Invalid Khipu response', { error: khipuResponse instanceof Error ? khipuResponse.message : String(khipuResponse) });
      return NextResponse.json(
        { 
          error: 'Respuesta inválida del proveedor de pagos',
          code: 'INVALID_PAYMENT_RESPONSE',
        },
        { status: 500 },
      );
    }

    // Guardar información del pago en la base de datos
    const paymentData: any = {
      paymentNumber: paymentId,
      amount: body.amount,
      dueDate: new Date(),
      status: 'PENDING',
      method: 'DIGITAL_WALLET',
      transactionId: khipuResponse.payment_id,
      notes: `Pago Khipu: ${body.subject}`,
    };

    // Solo agregar contractId si existe
    if (body.contract_id) {
      paymentData.contractId = body.contract_id;
    }

    const payment = await db.payment.create({
      data: paymentData,
    });

    // Retornar respuesta con datos del pago
    return NextResponse.json({
      success: true,
      payment_id: paymentId,
      khipu_payment_id: khipuResponse.payment_id,
      payment_url: khipuResponse.payment_url || khipuResponse.simplified_transfer_url,
      amount: body.amount,
      currency: body.currency,
      status: 'pending',
      expires_at: khipuResponse.expires_date,
      created_at: new Date().toISOString(),
      database_payment_id: payment.id,
    });

  } catch (error) {
    logger.error('Error en creación de pago Khipu:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
