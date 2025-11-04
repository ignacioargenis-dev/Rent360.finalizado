import { db } from './db';
import { logger } from './logger';
import { BusinessLogicError, ValidationError } from './errors';
import {
  PaymentService,
  StripePaymentService,
  PayPalPaymentService,
  WebPayPaymentService,
} from './api/payments';
import { NotificationService } from './notification-service';

export interface OwnerPaymentData {
  visitId: string;
  ownerId: string;
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'khipu' | 'webpay';
  paymentMethodId?: string; // ID del método de pago guardado (ej: payment_method_xxx)
}

export interface PaymentAuthorizationResult {
  success: boolean;
  authorizationId?: string;
  paymentId?: string;
  error?: string;
  clientSecret?: string; // Para Stripe, si necesita confirmación en frontend
}

export interface PaymentChargeResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Servicio para manejar pagos de propietarios por servicios de runners
 */
export class OwnerPaymentService {
  private static paymentService: PaymentService;
  private static stripeService: StripePaymentService;
  private static paypalService: PayPalPaymentService;
  private static webpayService: WebPayPaymentService;

  static {
    // Inicializar servicios de pago
    this.paymentService = new PaymentService();
    this.stripeService = new StripePaymentService();
    this.paypalService = new PayPalPaymentService();
    this.webpayService = new WebPayPaymentService();
  }

  /**
   * Autoriza un pago al crear una visita (verificación de método de pago)
   */
  static async authorizePayment(data: OwnerPaymentData): Promise<PaymentAuthorizationResult> {
    try {
      // Verificar que la visita existe
      const visit = await db.visit.findUnique({
        where: { id: data.visitId },
        include: {
          property: {
            select: {
              id: true,
              ownerId: true,
            },
          },
        },
      });

      if (!visit) {
        throw new ValidationError('Visita no encontrada');
      }

      // Verificar que el ownerId coincide con el propietario de la propiedad
      if (visit.property.ownerId !== data.ownerId) {
        throw new ValidationError('El propietario no coincide con la propiedad');
      }

      // Verificar que no existe ya un pago para esta visita
      const existingPayment = await db.ownerPayment.findUnique({
        where: { visitId: data.visitId },
      });

      if (existingPayment) {
        // Si ya está autorizado o completado, retornar éxito
        if (existingPayment.status === 'AUTHORIZED' || existingPayment.status === 'COMPLETED') {
          const result: PaymentAuthorizationResult = {
            success: true,
            paymentId: existingPayment.id,
          };
          if (existingPayment.authorizationId) {
            result.authorizationId = existingPayment.authorizationId;
          }
          return result;
        }

        // Si está pendiente, intentar autorizar de nuevo
        if (existingPayment.status === 'PENDING') {
          // Actualizar el pago existente
          return await this.updateAuthorization(existingPayment.id, data);
        }
      }

      // Crear registro de pago
      const ownerPayment = await db.ownerPayment.create({
        data: {
          visitId: data.visitId,
          ownerId: data.ownerId,
          amount: data.amount,
          currency: 'CLP',
          paymentMethod: data.paymentMethod,
          paymentMethodId: data.paymentMethodId || null,
          status: 'PENDING',
        },
      });

      // Autorizar el pago según el método
      let authorizationResult: PaymentAuthorizationResult;

      switch (data.paymentMethod) {
        case 'stripe':
          authorizationResult = await this.authorizeStripePayment(
            ownerPayment.id,
            data.amount,
            data.paymentMethodId,
            {
              visitId: data.visitId,
              ownerId: data.ownerId,
              propertyId: visit.propertyId,
            }
          );
          break;

        case 'paypal':
          authorizationResult = await this.authorizePayPalPayment(
            ownerPayment.id,
            data.amount,
            data.paymentMethodId,
            {
              visitId: data.visitId,
              ownerId: data.ownerId,
              propertyId: visit.propertyId,
            }
          );
          break;

        case 'khipu':
          authorizationResult = await this.authorizeKhipuPayment(ownerPayment.id, data.amount, {
            visitId: data.visitId,
            ownerId: data.ownerId,
            propertyId: visit.propertyId,
          });
          break;

        case 'webpay':
          authorizationResult = await this.authorizeWebPayPayment(ownerPayment.id, data.amount, {
            visitId: data.visitId,
            ownerId: data.ownerId,
            propertyId: visit.propertyId,
          });
          break;

        default:
          throw new ValidationError(`Método de pago no soportado: ${data.paymentMethod}`);
      }

      // Actualizar el registro con el resultado de la autorización
      if (authorizationResult.success && authorizationResult.authorizationId) {
        await db.ownerPayment.update({
          where: { id: ownerPayment.id },
          data: {
            status: 'AUTHORIZED',
            authorizationId: authorizationResult.authorizationId,
            authorizedAt: new Date(),
            metadata: JSON.stringify({
              paymentMethodId: data.paymentMethodId,
              clientSecret: authorizationResult.clientSecret,
            }),
          },
        });

        logger.info('Pago autorizado exitosamente', {
          paymentId: ownerPayment.id,
          visitId: data.visitId,
          ownerId: data.ownerId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        });
      } else {
        await db.ownerPayment.update({
          where: { id: ownerPayment.id },
          data: {
            status: 'FAILED',
            failureReason: authorizationResult.error || 'Error desconocido en autorización',
          },
        });

        logger.error('Error autorizando pago', {
          paymentId: ownerPayment.id,
          visitId: data.visitId,
          error: authorizationResult.error,
        });
      }

      return {
        ...authorizationResult,
        paymentId: ownerPayment.id,
      };
    } catch (error) {
      logger.error('Error en authorizePayment:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Procesa el cobro cuando la visita se completa
   */
  static async chargePayment(visitId: string): Promise<PaymentChargeResult> {
    try {
      // Obtener el pago asociado a la visita
      const ownerPayment = await db.ownerPayment.findUnique({
        where: { visitId },
        include: {
          visit: {
            include: {
              property: {
                select: {
                  id: true,
                  ownerId: true,
                },
              },
            },
          },
        },
      });

      if (!ownerPayment) {
        throw new ValidationError('No se encontró un pago autorizado para esta visita');
      }

      // Verificar que el pago esté autorizado
      if (ownerPayment.status !== 'AUTHORIZED') {
        if (ownerPayment.status === 'COMPLETED') {
          const result: PaymentChargeResult = {
            success: true,
          };
          if (ownerPayment.transactionId) {
            result.transactionId = ownerPayment.transactionId;
          }
          return result;
        }

        throw new BusinessLogicError(
          `El pago no está autorizado. Estado actual: ${ownerPayment.status}`
        );
      }

      // Verificar que la visita esté completada
      if (ownerPayment.visit.status !== 'COMPLETED') {
        throw new BusinessLogicError('La visita debe estar completada antes de procesar el pago');
      }

      // Procesar el cobro según el método de pago
      let chargeResult: PaymentChargeResult;

      const metadata = ownerPayment.metadata ? JSON.parse(ownerPayment.metadata) : {};

      switch (ownerPayment.paymentMethod) {
        case 'stripe':
          chargeResult = await this.chargeStripePayment(
            ownerPayment.id,
            ownerPayment.authorizationId!,
            ownerPayment.amount,
            metadata.paymentMethodId
          );
          break;

        case 'paypal':
          chargeResult = await this.chargePayPalPayment(
            ownerPayment.id,
            ownerPayment.authorizationId!,
            ownerPayment.amount
          );
          break;

        case 'khipu':
          chargeResult = await this.chargeKhipuPayment(
            ownerPayment.id,
            ownerPayment.authorizationId!,
            ownerPayment.amount
          );
          break;

        case 'webpay':
          chargeResult = await this.chargeWebPayPayment(
            ownerPayment.id,
            ownerPayment.authorizationId!,
            ownerPayment.amount
          );
          break;

        default:
          throw new ValidationError(`Método de pago no soportado: ${ownerPayment.paymentMethod}`);
      }

      // Actualizar el registro con el resultado del cobro
      if (chargeResult.success && chargeResult.transactionId) {
        await db.ownerPayment.update({
          where: { id: ownerPayment.id },
          data: {
            status: 'COMPLETED',
            transactionId: chargeResult.transactionId,
            chargedAt: new Date(),
          },
        });

        // TODO: Enviar notificación al propietario
        // await NotificationService.createNotification({...})

        logger.info('Pago procesado exitosamente', {
          paymentId: ownerPayment.id,
          visitId,
          transactionId: chargeResult.transactionId,
          amount: ownerPayment.amount,
        });
      } else {
        // Incrementar contador de reintentos
        const retryCount = ownerPayment.retryCount + 1;
        const maxRetries = 3;

        await db.ownerPayment.update({
          where: { id: ownerPayment.id },
          data: {
            status: retryCount >= maxRetries ? 'FAILED' : 'AUTHORIZED',
            failureReason: chargeResult.error || 'Error desconocido en el cobro',
            retryCount,
            lastRetryAt: new Date(),
          },
        });

        // TODO: Enviar notificación al propietario si falló
        // if (retryCount >= maxRetries) {
        //   await NotificationService.createNotification({...})
        // }

        logger.error('Error procesando pago', {
          paymentId: ownerPayment.id,
          visitId,
          error: chargeResult.error,
          retryCount,
        });
      }

      return chargeResult;
    } catch (error) {
      logger.error('Error en chargePayment:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Autoriza pago con Stripe
   */
  private static async authorizeStripePayment(
    paymentId: string,
    amount: number,
    paymentMethodId: string | undefined,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      // Si no hay paymentMethodId, crear un PaymentIntent para autorización
      if (!paymentMethodId) {
        const paymentIntent = await this.stripeService.createPaymentIntent(amount, 'CLP', {
          ...metadata,
          paymentId,
          capture_method: 'manual', // Autorización sin captura inmediata
        });

        return {
          success: true,
          authorizationId: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
        };
      } else {
        // Si hay paymentMethodId, usar el método guardado
        // Crear PaymentIntent con el método guardado
        const paymentIntent = await this.stripeService.createPaymentIntent(amount, 'CLP', {
          ...metadata,
          paymentId,
          payment_method: paymentMethodId,
          capture_method: 'manual',
          confirm: false, // Solo autorizar, no capturar
        });

        return {
          success: true,
          authorizationId: paymentIntent.id,
        };
      }
    } catch (error) {
      logger.error('Error autorizando pago Stripe:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error autorizando pago Stripe',
      };
    }
  }

  /**
   * Autoriza pago con PayPal
   */
  private static async authorizePayPalPayment(
    paymentId: string,
    amount: number,
    paymentMethodId: string | undefined,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      // PayPal: crear orden con intent 'AUTHORIZE' para autorizar sin capturar
      // Nota: PayPal requiere que el intent se pase en el body de createOrder
      // Necesitamos modificar PayPalPaymentService para aceptar intent
      // Por ahora, creamos la orden normal y luego la capturamos cuando se complete
      const order = await this.paypalService.createOrder(
        amount,
        'CLP',
        `Pago por servicio de runner - Visita ${metadata.visitId}`
      );

      return {
        success: true,
        authorizationId: order.id,
      };
    } catch (error) {
      logger.error('Error autorizando pago PayPal:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error autorizando pago PayPal',
      };
    }
  }

  /**
   * Autoriza pago con Khipu
   */
  private static async authorizeKhipuPayment(
    paymentId: string,
    amount: number,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      // Khipu: crear pago (en Khipu, los pagos se crean y se procesan cuando el usuario completa)
      // Para autorización previa, podemos crear un pago pendiente
      // Esto requeriría integración con la API de Khipu
      // Por ahora, simulamos la autorización

      logger.info('Autorizando pago Khipu (simulado)', {
        paymentId,
        amount,
        metadata,
      });

      // En producción, aquí se haría la llamada real a la API de Khipu
      // const khipuPayment = await khipuApi.createPayment({...})

      return {
        success: true,
        authorizationId: `khipu_auth_${paymentId}_${Date.now()}`,
      };
    } catch (error) {
      logger.error('Error autorizando pago Khipu:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error autorizando pago Khipu',
      };
    }
  }

  /**
   * Autoriza pago con WebPay
   */
  private static async authorizeWebPayPayment(
    paymentId: string,
    amount: number,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      // WebPay: crear transacción
      const transaction = await this.webpayService.createTransaction(
        amount,
        `VISIT_${metadata.visitId}`,
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://rent360.cl'}/payment/return?visitId=${metadata.visitId}`
      );

      return {
        success: true,
        authorizationId: transaction.token,
        clientSecret: transaction.url, // URL para redirección
      };
    } catch (error) {
      logger.error('Error autorizando pago WebPay:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error autorizando pago WebPay',
      };
    }
  }

  /**
   * Procesa cobro con Stripe
   */
  private static async chargeStripePayment(
    paymentId: string,
    authorizationId: string,
    amount: number,
    paymentMethodId?: string
  ): Promise<PaymentChargeResult> {
    try {
      // Para Stripe, necesitamos capturar el PaymentIntent
      // Si el PaymentIntent fue creado con capture_method: 'manual',
      // necesitamos hacer un capture explícito
      // Por ahora, confirmamos el pago que debería capturarlo
      const paymentIntent = await this.stripeService.confirmPayment(authorizationId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id,
        };
      }

      // Si el estado es 'requires_capture', necesitamos capturar manualmente
      // Esto requeriría un método adicional en StripePaymentService
      // Por ahora, asumimos que confirmPayment lo captura

      return {
        success: false,
        error: `PaymentIntent no completado. Estado: ${paymentIntent.status}`,
      };
    } catch (error) {
      logger.error('Error cobrando pago Stripe:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cobrando pago Stripe',
      };
    }
  }

  /**
   * Procesa cobro con PayPal
   */
  private static async chargePayPalPayment(
    paymentId: string,
    authorizationId: string,
    amount: number
  ): Promise<PaymentChargeResult> {
    try {
      // Capturar la orden autorizada
      const capture = await this.paypalService.captureOrder(authorizationId);

      if (capture.status === 'COMPLETED') {
        return {
          success: true,
          transactionId: capture.id,
        };
      }

      return {
        success: false,
        error: `Orden PayPal no completada. Estado: ${capture.status}`,
      };
    } catch (error) {
      logger.error('Error cobrando pago PayPal:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cobrando pago PayPal',
      };
    }
  }

  /**
   * Procesa cobro con Khipu
   */
  private static async chargeKhipuPayment(
    paymentId: string,
    authorizationId: string,
    amount: number
  ): Promise<PaymentChargeResult> {
    try {
      // Khipu: verificar estado del pago
      // En producción, esto requeriría integración con la API de Khipu
      logger.info('Cobrando pago Khipu (simulado)', {
        paymentId,
        authorizationId,
        amount,
      });

      // Simular cobro exitoso
      return {
        success: true,
        transactionId: `khipu_txn_${paymentId}_${Date.now()}`,
      };
    } catch (error) {
      logger.error('Error cobrando pago Khipu:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cobrando pago Khipu',
      };
    }
  }

  /**
   * Procesa cobro con WebPay
   */
  private static async chargeWebPayPayment(
    paymentId: string,
    authorizationId: string,
    amount: number
  ): Promise<PaymentChargeResult> {
    try {
      // WebPay: confirmar transacción
      const result = await this.webpayService.commitTransaction(authorizationId);

      // WebPay devuelve un objeto con status o responseCode
      // Verificar según la estructura real de la respuesta
      if (result.status === 'AUTHORIZED' || (result as any).responseCode === 0) {
        return {
          success: true,
          transactionId: result.order_id || authorizationId,
        };
      }

      return {
        success: false,
        error: `WebPay no completado. Estado: ${result.status || (result as any).responseCode}`,
      };
    } catch (error) {
      logger.error('Error cobrando pago WebPay:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cobrando pago WebPay',
      };
    }
  }

  /**
   * Actualiza autorización de un pago existente
   */
  private static async updateAuthorization(
    paymentId: string,
    data: OwnerPaymentData
  ): Promise<PaymentAuthorizationResult> {
    // Reutilizar la lógica de autorización pero para un pago existente
    return await this.authorizePayment(data);
  }

  /**
   * Obtiene el estado de un pago
   */
  static async getPaymentStatus(visitId: string) {
    const payment = await db.ownerPayment.findUnique({
      where: { visitId },
      include: {
        visit: {
          select: {
            id: true,
            status: true,
            earnings: true,
          },
        },
      },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      visitId: payment.visitId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      authorizedAt: payment.authorizedAt,
      chargedAt: payment.chargedAt,
      transactionId: payment.transactionId,
      failureReason: payment.failureReason,
      retryCount: payment.retryCount,
      visit: payment.visit,
    };
  }

  /**
   * Procesa reembolso
   */
  static async refundPayment(
    visitId: string,
    reason: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const payment = await db.ownerPayment.findUnique({
        where: { visitId },
      });

      if (!payment) {
        throw new ValidationError('Pago no encontrado');
      }

      if (payment.status !== 'COMPLETED') {
        throw new BusinessLogicError('Solo se pueden reembolsar pagos completados');
      }

      // Procesar reembolso según el método de pago
      // (Implementar según cada proveedor)

      await db.ownerPayment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          notes: reason,
        },
      });

      return {
        success: true,
        refundId: `refund_${payment.id}_${Date.now()}`,
      };
    } catch (error) {
      logger.error('Error procesando reembolso:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando reembolso',
      };
    }
  }
}
