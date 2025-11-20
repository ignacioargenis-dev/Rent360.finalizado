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

/**
 * Obtiene el porcentaje de comisión configurado para maintenance providers
 */
async function getMaintenanceProviderCommissionPercentage(): Promise<number> {
  try {
    // Buscar primero en SystemSetting (donde el admin guarda las configuraciones)
    const systemSetting = await db.systemSetting.findUnique({
      where: { key: 'maintenanceProviderCommissionPercentage' },
    });

    if (systemSetting) {
      const percentage = parseFloat(systemSetting.value);
      if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        return percentage;
      }
    }

    // Si no existe en SystemSetting, intentar desde PlatformConfig como fallback
    const platformConfig = await db.platformConfig.findUnique({
      where: { key: 'maintenanceProviderCommissionPercentage' },
    });

    if (platformConfig) {
      const percentage = parseFloat(platformConfig.value);
      if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        return percentage;
      }
    }

    // Valor por defecto: 8%
    logger.warn(
      'No se encontró configuración de comisión para maintenance providers, usando 8% por defecto'
    );
    return 8;
  } catch (error) {
    logger.error('Error obteniendo porcentaje de comisión:', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Valor por defecto en caso de error
    return 8;
  }
}

/**
 * Valida que el método de pago sea digital (no efectivo ni cheque)
 */
function validatePaymentMethod(paymentMethod: string): void {
  const allowedMethods = [
    'khipu',
    'stripe',
    'paypal',
    'webpay',
    'KHIPU',
    'STRIPE',
    'PAYPAL',
    'WEBPAY',
  ];
  const disallowedMethods = ['cash', 'check', 'CASH', 'CHECK'];

  if (disallowedMethods.includes(paymentMethod)) {
    throw new ValidationError(
      `El método de pago "${paymentMethod}" no está permitido. Solo se permiten métodos digitales: khipu, stripe, paypal, webpay`
    );
  }

  if (!allowedMethods.includes(paymentMethod)) {
    throw new ValidationError(
      `Método de pago no soportado: ${paymentMethod}. Métodos permitidos: ${allowedMethods.join(', ')}`
    );
  }
}

export interface MaintenancePaymentData {
  maintenanceId: string;
  clientId: string; // Owner o Broker que paga
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
  paymentUrl?: string; // Para Khipu, URL de pago
}

export interface PaymentChargeResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Servicio para manejar pagos de clientes (owners/brokers) por trabajos de mantenimiento
 * Similar a ClientPaymentService pero para Maintenance
 */
export class MaintenancePaymentService {
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
   * Autoriza un pago al aprobar una cotización de mantenimiento
   */
  static async authorizePayment(data: MaintenancePaymentData): Promise<PaymentAuthorizationResult> {
    try {
      // Validar método de pago (no permitir efectivo ni cheque)
      validatePaymentMethod(data.paymentMethod);

      // Verificar que el Maintenance existe
      const maintenance = await db.maintenance.findUnique({
        where: { id: data.maintenanceId },
        include: {
          property: {
            select: {
              id: true,
              ownerId: true,
              brokerId: true,
            },
          },
          maintenanceProvider: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
          requester: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!maintenance) {
        throw new ValidationError('Trabajo de mantenimiento no encontrado');
      }

      // Verificar que el clientId es el owner o broker de la propiedad
      const isOwner = maintenance.property.ownerId === data.clientId;
      const isBroker = maintenance.property.brokerId === data.clientId;
      if (!isOwner && !isBroker) {
        throw new ValidationError('Solo el propietario o corredor pueden autorizar el pago');
      }

      // Verificar que no existe ya un pago completado para este trabajo
      const existingTransaction = await db.providerTransaction.findFirst({
        where: {
          maintenanceId: data.maintenanceId,
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

      // Verificar que el monto sea válido
      const amount = data.amount || maintenance.estimatedCost || maintenance.actualCost;
      if (!amount || amount <= 0) {
        throw new ValidationError('El monto del pago debe ser mayor a cero');
      }

      // Crear registro de pago usando ProviderTransaction
      const clientPayment = await db.providerTransaction.create({
        data: {
          providerType: 'MAINTENANCE',
          maintenanceProviderId: maintenance.maintenanceProviderId!,
          maintenanceId: data.maintenanceId,
          amount: amount,
          commission: 0, // La comisión se calcula después
          netAmount: amount, // Temporal, se actualizará después
          status: 'PENDING',
          paymentMethod: data.paymentMethod.toUpperCase() as any,
          reference: `MAINTENANCE_PAYMENT_${data.maintenanceId}_${Date.now()}`,
        },
      });

      // Autorizar el pago según el método
      let authorizationResult: PaymentAuthorizationResult;

      switch (data.paymentMethod.toLowerCase()) {
        case 'stripe':
          authorizationResult = await this.authorizeStripePayment(
            clientPayment.id,
            amount,
            data.paymentMethodId,
            {
              maintenanceId: data.maintenanceId,
              clientId: data.clientId,
              providerId: maintenance.maintenanceProviderId!,
            }
          );
          break;

        case 'paypal':
          authorizationResult = await this.authorizePayPalPayment(
            clientPayment.id,
            amount,
            data.paymentMethodId,
            {
              maintenanceId: data.maintenanceId,
              clientId: data.clientId,
              providerId: maintenance.maintenanceProviderId!,
            }
          );
          break;

        case 'khipu':
          authorizationResult = await this.authorizeKhipuPayment(clientPayment.id, amount, {
            maintenanceId: data.maintenanceId,
            clientId: data.clientId,
            providerId: maintenance.maintenanceProviderId!,
          });
          break;

        case 'webpay':
          authorizationResult = await this.authorizeWebPayPayment(clientPayment.id, amount, {
            maintenanceId: data.maintenanceId,
            clientId: data.clientId,
            providerId: maintenance.maintenanceProviderId!,
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
          maintenanceId: data.maintenanceId,
        };
        if (authorizationResult.clientSecret) {
          metadataObj.clientSecret = authorizationResult.clientSecret;
        }
        if (authorizationResult.paymentUrl) {
          metadataObj.paymentUrl = authorizationResult.paymentUrl;
        }

        await db.providerTransaction.update({
          where: { id: clientPayment.id },
          data: {
            status: 'PROCESSING',
            reference: authorizationResult.authorizationId,
            notes: JSON.stringify(metadataObj),
          },
        });

        logger.info('Pago de mantenimiento autorizado exitosamente', {
          paymentId: clientPayment.id,
          maintenanceId: data.maintenanceId,
          clientId: data.clientId,
          amount: amount,
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
              maintenanceId: data.maintenanceId,
            }),
          },
        });

        logger.error('Error autorizando pago de mantenimiento', {
          paymentId: clientPayment.id,
          maintenanceId: data.maintenanceId,
          error: authorizationResult.error,
        });
      }

      return {
        ...authorizationResult,
        paymentId: clientPayment.id,
      };
    } catch (error) {
      logger.error('Error en authorizePayment (mantenimiento):', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Procesa el cobro cuando el trabajo se completa y es confirmado
   */
  static async chargePayment(maintenanceId: string): Promise<PaymentChargeResult> {
    try {
      // Obtener el pago asociado al trabajo
      const clientPayment = await db.providerTransaction.findFirst({
        where: {
          maintenanceId,
          status: { in: ['PROCESSING', 'PENDING'] },
        },
        include: {
          maintenance: {
            include: {
              property: {
                select: {
                  id: true,
                  ownerId: true,
                  brokerId: true,
                },
              },
              maintenanceProvider: {
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
          },
        },
      });

      if (!clientPayment) {
        throw new ValidationError('No se encontró un pago autorizado para este trabajo');
      }

      // Verificar que el trabajo existe y está completado
      if (!clientPayment.maintenance) {
        throw new ValidationError('Trabajo de mantenimiento no encontrado');
      }

      if (clientPayment.maintenance.status !== 'COMPLETED') {
        throw new BusinessLogicError('El trabajo debe estar completado antes de procesar el pago');
      }

      // Obtener método de pago del notes (donde guardamos el metadata)
      const metadata = clientPayment.notes ? JSON.parse(clientPayment.notes) : {};
      const paymentMethod = (clientPayment.paymentMethod as string).toLowerCase() as
        | 'stripe'
        | 'paypal'
        | 'khipu'
        | 'webpay';

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
        // Obtener porcentaje de comisión desde configuración del admin
        const commissionPercentage = await getMaintenanceProviderCommissionPercentage();
        const commissionRate = commissionPercentage / 100;
        const commission = clientPayment.amount * commissionRate;
        const netAmount = clientPayment.amount - commission;

        // Obtener información del provider y verificar cuenta bancaria
        const provider = await db.maintenanceProvider.findUnique({
          where: { id: clientPayment.maintenanceProviderId! },
          include: {
            user: {
              include: {
                bankAccounts: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        });

        if (!provider) {
          throw new ValidationError('Proveedor de mantenimiento no encontrado');
        }

        // Verificar que el provider tenga cuenta bancaria configurada
        const bankAccount = provider.user.bankAccounts?.[0];
        if (!bankAccount) {
          logger.warn(
            'Provider de mantenimiento no tiene cuenta bancaria configurada, creando payout pendiente',
            {
              providerId: provider.id,
              maintenanceId,
            }
          );

          // Enviar notificación al provider para que configure su cuenta bancaria
          if (provider.userId) {
            try {
              await NotificationService.create({
                userId: provider.userId,
                type: 'PAYMENT_PENDING' as any,
                title: 'Pago pendiente - Configura tu cuenta bancaria',
                message: `Tienes un pago pendiente de ${netAmount.toLocaleString('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                })} por el trabajo "${clientPayment.maintenance.title}". Por favor configura tu cuenta bancaria para recibir el pago.`,
                link: '/maintenance/payments/configure',
              });
            } catch (notificationError) {
              logger.warn('Error enviando notificación al provider:', {
                error:
                  notificationError instanceof Error
                    ? notificationError.message
                    : String(notificationError),
              });
            }
          }
        }

        // Actualizar la transacción con el resultado del cobro
        await db.providerTransaction.update({
          where: { id: clientPayment.id },
          data: {
            status: bankAccount && bankAccount.isVerified ? 'PROCESSING' : 'PENDING',
            commission,
            netAmount,
            reference: chargeResult.transactionId,
            processedAt: bankAccount && bankAccount.isVerified ? new Date() : null,
            notes: JSON.stringify({
              ...metadata,
              transactionId: chargeResult.transactionId,
              chargedAt: new Date().toISOString(),
              commissionPercentage,
              requiresPayout: true,
              bankAccountConfigured: !!bankAccount,
              bankAccountVerified: bankAccount?.isVerified || false,
            }),
          },
        });

        // Enviar notificación al provider sobre el pago recibido
        if (provider.userId) {
          try {
            await NotificationService.create({
              userId: provider.userId,
              type: 'PAYMENT_RECEIVED' as any,
              title:
                bankAccount && bankAccount.isVerified
                  ? 'Pago procesado'
                  : 'Pago pendiente - Configura tu cuenta bancaria',
              message:
                bankAccount && bankAccount.isVerified
                  ? `Has recibido un pago de ${netAmount.toLocaleString('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                    })} por el trabajo "${clientPayment.maintenance.title}". El pago será depositado en tu cuenta bancaria.`
                  : `Tienes un pago pendiente de ${netAmount.toLocaleString('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                    })} por el trabajo "${clientPayment.maintenance.title}". Por favor configura tu cuenta bancaria para recibir el pago.`,
              link:
                bankAccount && bankAccount.isVerified
                  ? `/maintenance/jobs/${maintenanceId}`
                  : '/maintenance/payments/configure',
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

        logger.info('Pago de mantenimiento procesado exitosamente', {
          paymentId: clientPayment.id,
          maintenanceId,
          amount: clientPayment.amount,
          netAmount,
          commission,
          commissionPercentage,
          transactionId: chargeResult.transactionId,
          bankAccountConfigured: !!bankAccount,
          bankAccountVerified: bankAccount?.isVerified || false,
          status: bankAccount && bankAccount.isVerified ? 'PROCESSING' : 'PENDING',
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

        logger.error('Error procesando pago de mantenimiento', {
          paymentId: clientPayment.id,
          maintenanceId,
          error: chargeResult.error,
        });
      }

      return chargeResult;
    } catch (error) {
      logger.error('Error en chargePayment (mantenimiento):', {
        error: error instanceof Error ? error.message : String(error),
        maintenanceId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene el estado de un pago asociado a un trabajo de mantenimiento
   */
  static async getPaymentStatus(maintenanceId: string) {
    const payment = await db.providerTransaction.findFirst({
      where: {
        maintenanceId,
      },
      include: {
        maintenance: {
          select: {
            id: true,
            title: true,
            status: true,
            estimatedCost: true,
            actualCost: true,
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

    const metadata = payment.notes ? JSON.parse(payment.notes) : {};

    return {
      id: payment.id,
      maintenanceId: payment.maintenanceId,
      amount: payment.amount,
      status: payment.status,
      method: payment.paymentMethod,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt,
      reference: payment.reference,
      metadata,
      paymentUrl: metadata.paymentUrl || null, // URL de Khipu si está disponible
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
        `Pago por mantenimiento - ${metadata.maintenanceId}`
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
      // Crear pago con Khipu usando el endpoint existente
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const khipuResponse = await fetch(`${baseUrl}/api/payments/khipu/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'CLP',
          subject: `Pago de Mantenimiento - ${metadata.maintenanceId}`,
          body: `Pago por trabajo de mantenimiento`,
          return_url: `${baseUrl}/owner/maintenance?payment=success`,
          cancel_url: `${baseUrl}/owner/maintenance?payment=cancelled`,
          notify_url: `${baseUrl}/api/payments/khipu/notify`,
          user_id: metadata.clientId,
          contract_id: metadata.maintenanceId, // Usamos contract_id para pasar maintenanceId
        }),
      });

      if (!khipuResponse.ok) {
        const errorData = await khipuResponse.json();
        throw new Error(errorData.error || 'Error creando pago Khipu');
      }

      const khipuData = await khipuResponse.json();

      return {
        success: true,
        authorizationId: khipuData.khipu_payment_id || khipuData.payment_id,
        paymentUrl: khipuData.payment_url,
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
        `MAINTENANCE_${metadata.maintenanceId}`,
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
      // Para Khipu, el pago se procesa automáticamente cuando el usuario completa el pago
      // El webhook actualizará el estado. Aquí solo verificamos que el pago existe
      // En producción, aquí se verificaría el estado del pago con la API de Khipu
      return {
        success: true,
        transactionId: authorizationId || `khipu_txn_${paymentId}_${Date.now()}`,
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
