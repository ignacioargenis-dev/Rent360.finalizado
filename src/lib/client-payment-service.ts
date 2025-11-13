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

export interface ClientPaymentData {
  serviceJobId: string;
  clientId: string;
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
 * Servicio para manejar pagos de clientes por servicios de providers
 * Similar a OwnerPaymentService pero para ServiceJob
 */
export class ClientPaymentService {
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
   * Autoriza un pago al crear o aceptar un ServiceJob (verificación de método de pago)
   */
  static async authorizePayment(data: ClientPaymentData): Promise<PaymentAuthorizationResult> {
    try {
      // Verificar que el ServiceJob existe
      const serviceJob = await db.serviceJob.findUnique({
        where: { id: data.serviceJobId },
        include: {
          requester: {
            select: {
              id: true,
            },
          },
          serviceProvider: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!serviceJob) {
        throw new ValidationError('Trabajo de servicio no encontrado');
      }

      // Verificar que el clientId coincide con el solicitante del trabajo
      if (serviceJob.requesterId !== data.clientId) {
        throw new ValidationError('El cliente no coincide con el trabajo');
      }

      // Verificar que no existe ya un pago completado para este trabajo
      const existingTransaction = await db.providerTransaction.findFirst({
        where: {
          serviceJobId: data.serviceJobId,
          status: 'COMPLETED',
        },
      });

      if (existingTransaction && existingTransaction.status === 'COMPLETED') {
        // Ya existe un pago completado
        const result: PaymentAuthorizationResult = {
          success: true,
          paymentId: existingTransaction.id,
        };
        return result;
      }

      // Crear registro de pago usando ProviderTransaction
      // El pago del cliente se registra como una transacción pendiente
      const clientPayment = await db.providerTransaction.create({
        data: {
          providerType: 'SERVICE',
          serviceProviderId: serviceJob.serviceProviderId,
          serviceJobId: data.serviceJobId,
          amount: data.amount,
          commission: 0, // La comisión se calcula después
          netAmount: data.amount, // Temporal, se actualizará después
          status: 'PENDING',
          paymentMethod: data.paymentMethod,
          reference: `CLIENT_PAYMENT_${data.serviceJobId}_${Date.now()}`,
        },
      });

      // Autorizar el pago según el método
      let authorizationResult: PaymentAuthorizationResult;

      switch (data.paymentMethod) {
        case 'stripe':
          authorizationResult = await this.authorizeStripePayment(
            clientPayment.id,
            data.amount,
            data.paymentMethodId,
            {
              serviceJobId: data.serviceJobId,
              clientId: data.clientId,
              providerId: serviceJob.serviceProviderId,
            }
          );
          break;

        case 'paypal':
          authorizationResult = await this.authorizePayPalPayment(
            clientPayment.id,
            data.amount,
            data.paymentMethodId,
            {
              serviceJobId: data.serviceJobId,
              clientId: data.clientId,
              providerId: serviceJob.serviceProviderId,
            }
          );
          break;

        case 'khipu':
          authorizationResult = await this.authorizeKhipuPayment(clientPayment.id, data.amount, {
            serviceJobId: data.serviceJobId,
            clientId: data.clientId,
            providerId: serviceJob.serviceProviderId,
          });
          break;

        case 'webpay':
          authorizationResult = await this.authorizeWebPayPayment(clientPayment.id, data.amount, {
            serviceJobId: data.serviceJobId,
            clientId: data.clientId,
            providerId: serviceJob.serviceProviderId,
          });
          break;

        default:
          throw new ValidationError(`Método de pago no soportado: ${data.paymentMethod}`);
      }

      // Actualizar el registro con el resultado de la autorización
      if (authorizationResult.success && authorizationResult.authorizationId) {
        const metadataObj: any = {
          paymentMethodId: data.paymentMethodId,
          authorizationId: authorizationResult.authorizationId,
          clientId: data.clientId,
          serviceJobId: data.serviceJobId,
        };
        if (authorizationResult.clientSecret) {
          metadataObj.clientSecret = authorizationResult.clientSecret;
        }

        await db.providerTransaction.update({
          where: { id: clientPayment.id },
          data: {
            status: 'PROCESSING', // Similar a AUTHORIZED pero usando el estado de ProviderTransaction
            reference: authorizationResult.authorizationId,
            notes: JSON.stringify(metadataObj), // Usar notes para metadata ya que metadata no existe en ProviderTransaction
          },
        });

        logger.info('Pago del cliente autorizado exitosamente', {
          paymentId: clientPayment.id,
          serviceJobId: data.serviceJobId,
          clientId: data.clientId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        });
      } else {
        await db.providerTransaction.update({
          where: { id: clientPayment.id },
          data: {
            status: 'FAILED',
            notes: JSON.stringify({
              error: authorizationResult.error || 'Error desconocido en autorización',
              clientId: data.clientId,
              serviceJobId: data.serviceJobId,
            }),
          },
        });

        logger.error('Error autorizando pago del cliente', {
          paymentId: clientPayment.id,
          serviceJobId: data.serviceJobId,
          error: authorizationResult.error,
        });
      }

      return {
        ...authorizationResult,
        paymentId: clientPayment.id,
      };
    } catch (error) {
      logger.error('Error en authorizePayment (cliente):', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Procesa el cobro cuando el trabajo se completa
   */
  static async chargePayment(serviceJobId: string): Promise<PaymentChargeResult> {
    try {
      // Obtener el pago asociado al trabajo
      const clientPayment = await db.providerTransaction.findFirst({
        where: {
          serviceJobId,
          status: { in: ['PROCESSING', 'PENDING'] },
        },
        include: {
          serviceJob: {
            include: {
              requester: {
                select: {
                  id: true,
                },
              },
              serviceProvider: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!clientPayment) {
        throw new ValidationError('No se encontró un pago autorizado para este trabajo');
      }

      // Verificar que el trabajo existe y está completado
      if (!clientPayment.serviceJob) {
        throw new ValidationError('Trabajo de servicio no encontrado');
      }

      if (clientPayment.serviceJob.status !== 'COMPLETED') {
        throw new BusinessLogicError('El trabajo debe estar completado antes de procesar el pago');
      }

      // Obtener método de pago del notes (donde guardamos el metadata)
      const metadata = clientPayment.notes ? JSON.parse(clientPayment.notes) : {};
      const paymentMethod = clientPayment.paymentMethod as 'stripe' | 'paypal' | 'khipu' | 'webpay';

      // Procesar el cobro según el método de pago
      let chargeResult: PaymentChargeResult;

      switch (paymentMethod) {
        case 'stripe':
          chargeResult = await this.chargeStripePayment(
            clientPayment.id,
            clientPayment.amount,
            metadata.authorizationId,
            metadata.paymentMethodId
          );
          break;

        case 'paypal':
          chargeResult = await this.chargePayPalPayment(
            clientPayment.id,
            clientPayment.amount,
            metadata.authorizationId
          );
          break;

        case 'khipu':
          chargeResult = await this.chargeKhipuPayment(
            clientPayment.id,
            clientPayment.amount,
            metadata.authorizationId
          );
          break;

        case 'webpay':
          chargeResult = await this.chargeWebPayPayment(
            clientPayment.id,
            clientPayment.amount,
            metadata.authorizationId
          );
          break;

        default:
          throw new ValidationError(`Método de pago no soportado: ${paymentMethod}`);
      }

      // Actualizar el registro con el resultado del cobro
      if (chargeResult.success && chargeResult.transactionId) {
        // Calcular comisión (8% para service providers)
        const commissionPercentage = 0.08;
        const commission = clientPayment.amount * commissionPercentage;
        const netAmount = clientPayment.amount - commission;

        await db.providerTransaction.update({
          where: { id: clientPayment.id },
          data: {
            status: 'COMPLETED',
            commission,
            netAmount,
            reference: chargeResult.transactionId,
            processedAt: new Date(),
            notes: JSON.stringify({
              ...metadata,
              transactionId: chargeResult.transactionId,
              chargedAt: new Date().toISOString(),
            }),
          },
        });

        // Actualizar estadísticas del provider
        await db.serviceProvider.update({
          where: { id: clientPayment.serviceJob.serviceProviderId },
          data: {
            totalEarnings: {
              increment: netAmount,
            },
          },
        });

        // Obtener el userId del provider para enviar notificación
        const provider = await db.serviceProvider.findUnique({
          where: { id: clientPayment.serviceJob.serviceProviderId },
          select: {
            userId: true,
          },
        });

        // Enviar notificación al provider
        if (provider?.userId) {
          try {
            await NotificationService.create({
              userId: provider.userId,
              type: 'PAYMENT_RECEIVED' as any,
              title: 'Pago recibido',
              message: `Has recibido un pago de ${clientPayment.amount.toLocaleString('es-CL', {
                style: 'currency',
                currency: 'CLP',
              })} por el trabajo "${clientPayment.serviceJob.title}"`,
              link: `/provider/jobs/${serviceJobId}`,
            });
          } catch (notificationError) {
            logger.warn('Error enviando notificación de pago al provider:', {
              error:
                notificationError instanceof Error
                  ? notificationError.message
                  : String(notificationError),
            });
          }
        }

        logger.info('Pago del cliente procesado exitosamente', {
          paymentId: clientPayment.id,
          serviceJobId,
          amount: clientPayment.amount,
          netAmount,
          commission,
          transactionId: chargeResult.transactionId,
        });
      } else {
        const currentNotes = clientPayment.notes ? JSON.parse(clientPayment.notes) : {};
        await db.providerTransaction.update({
          where: { id: clientPayment.id },
          data: {
            status: 'FAILED',
            notes: JSON.stringify({
              ...currentNotes,
              error: chargeResult.error || 'Error desconocido al procesar el pago',
              failedAt: new Date().toISOString(),
            }),
          },
        });

        logger.error('Error procesando pago del cliente', {
          paymentId: clientPayment.id,
          serviceJobId,
          error: chargeResult.error,
        });
      }

      return chargeResult;
    } catch (error) {
      logger.error('Error en chargePayment (cliente):', {
        error: error instanceof Error ? error.message : String(error),
        serviceJobId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene el estado de un pago asociado a un trabajo
   */
  static async getPaymentStatus(serviceJobId: string) {
    const payment = await db.providerTransaction.findFirst({
      where: {
        serviceJobId,
      },
      include: {
        serviceJob: {
          select: {
            id: true,
            title: true,
            status: true,
            finalPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      serviceJobId: payment.serviceJobId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt,
      reference: payment.reference,
      metadata: payment.notes ? JSON.parse(payment.notes) : {},
    };
  }

  // Métodos privados para autorizar pagos por método
  private static async authorizeStripePayment(
    paymentId: string,
    amount: number,
    paymentMethodId: string | undefined,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      // Crear PaymentIntent (con o sin método guardado)
      const paymentIntent = await this.stripeService.createPaymentIntent(amount, 'CLP', metadata);
      return {
        success: true,
        authorizationId: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
      };
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

  private static async authorizePayPalPayment(
    paymentId: string,
    amount: number,
    paymentMethodId: string | undefined,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      const order = await this.paypalService.createOrder(
        amount,
        'CLP',
        `Pago por servicio - ${metadata.serviceJobId}`
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

  private static async authorizeKhipuPayment(
    paymentId: string,
    amount: number,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      // Implementar autorización con Khipu
      // Por ahora retornar éxito simulado
      return {
        success: true,
        authorizationId: `khipu_${paymentId}_${Date.now()}`,
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

  private static async authorizeWebPayPayment(
    paymentId: string,
    amount: number,
    metadata: Record<string, any>
  ): Promise<PaymentAuthorizationResult> {
    try {
      const transaction = await this.webpayService.createTransaction(
        amount,
        `SERVICE_JOB_${metadata.serviceJobId}`,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/return`
      );
      return {
        success: true,
        authorizationId: transaction.token,
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

  // Métodos privados para procesar cobros por método
  private static async chargeStripePayment(
    paymentId: string,
    amount: number,
    authorizationId: string | undefined,
    paymentMethodId: string | undefined
  ): Promise<PaymentChargeResult> {
    try {
      if (!authorizationId) {
        throw new ValidationError('ID de autorización requerido para Stripe');
      }

      // Confirmar el PaymentIntent
      const result = await this.stripeService.confirmPayment(authorizationId);

      return {
        success: true,
        transactionId: result.id,
      };
    } catch (error) {
      logger.error('Error procesando cobro Stripe:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando cobro Stripe',
      };
    }
  }

  private static async chargePayPalPayment(
    paymentId: string,
    amount: number,
    authorizationId: string | undefined
  ): Promise<PaymentChargeResult> {
    try {
      if (!authorizationId) {
        throw new ValidationError('ID de autorización requerido para PayPal');
      }

      const result = await this.paypalService.captureOrder(authorizationId);

      return {
        success: true,
        transactionId: result.id,
      };
    } catch (error) {
      logger.error('Error procesando cobro PayPal:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando cobro PayPal',
      };
    }
  }

  private static async chargeKhipuPayment(
    paymentId: string,
    amount: number,
    authorizationId: string | undefined
  ): Promise<PaymentChargeResult> {
    try {
      // Implementar procesamiento con Khipu
      // Por ahora retornar éxito simulado
      return {
        success: true,
        transactionId: `khipu_txn_${paymentId}_${Date.now()}`,
      };
    } catch (error) {
      logger.error('Error procesando cobro Khipu:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando cobro Khipu',
      };
    }
  }

  private static async chargeWebPayPayment(
    paymentId: string,
    amount: number,
    authorizationId: string | undefined
  ): Promise<PaymentChargeResult> {
    try {
      if (!authorizationId) {
        throw new ValidationError('Token de autorización requerido para WebPay');
      }

      const result = await this.webpayService.commitTransaction(authorizationId);

      return {
        success: true,
        transactionId: result.order_id || authorizationId,
      };
    } catch (error) {
      logger.error('Error procesando cobro WebPay:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando cobro WebPay',
      };
    }
  }
}
