// Sistema de firma electrónica unificado
import { logger } from '../logger';
import { db } from '../db';
import { TrustFactoryProvider, FirmaProProvider, DigitalSignProvider } from './providers';
import { SignatureResult, SignatureStatus } from './types';

// Re-exportar tipos desde el archivo de tipos
export * from './types';

// Tipo base para proveedores de firma
export interface SignatureProvider {
  name: string;
  createSignatureRequest(documentId: string, signers: Array<{ email: string; name: string; role?: string }>): Promise<SignatureResult>;
  getSignatureStatus(requestId: string): Promise<SignatureStatus>;
  cancelSignatureRequest(requestId: string): Promise<void>;
  downloadSignedDocument(signatureId: string): Promise<Buffer | null>;
}

// Clase principal para gestión de firmas
export class SignatureService {
  private providers: SignatureProvider[] = [];
  private initialized = false;

  constructor() {
    // Inicialización lazy - se hará cuando se necesite por primera vez
  }

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      await this.loadProviders();
      this.initialized = true;
    } catch (error) {
      logger.error('Error inicializando SignatureService:', { error: error instanceof Error ? error.message : String(error) });
      // Fallback: inicializar con configuración básica
      this.initializeFallbackProviders();
    }
  }

  private async loadProviders() {
    try {
      // Cargar proveedores desde la base de datos o usar configuración por defecto
      // Nota: savedConfigs se cargaría aquí si fuera necesario en el futuro

      // Configuración por defecto de proveedores autorizados por SII
      const defaultProviders = [
        {
          name: 'TrustFactory',
          config: {
            apiKey: process.env.TRUSTFACTORY_API_KEY,
            apiSecret: process.env.TRUSTFACTORY_API_SECRET,
            certificateId: process.env.TRUSTFACTORY_CERTIFICATE_ID,
            baseUrl: process.env.TRUSTFACTORY_BASE_URL,
          },
          enabled: !!process.env.TRUSTFACTORY_API_KEY,
        },
        {
          name: 'FirmaPro',
          config: {
            apiKey: process.env.FIRMAPRO_API_KEY,
            apiSecret: process.env.FIRMAPRO_API_SECRET,
            certificateId: process.env.FIRMAPRO_CERTIFICATE_ID,
            baseUrl: process.env.FIRMAPRO_BASE_URL,
          },
          enabled: !!process.env.FIRMAPRO_API_KEY,
        },
        {
          name: 'DigitalSign',
          config: {
            apiKey: process.env.DIGITALSIGN_API_KEY,
            apiSecret: process.env.DIGITALSIGN_API_SECRET,
            certificateId: process.env.DIGITALSIGN_CERTIFICATE_ID,
            bankIntegration: process.env.DIGITALSIGN_BANK_INTEGRATION === 'true',
            baseUrl: process.env.DIGITALSIGN_BASE_URL,
          },
          enabled: !!process.env.DIGITALSIGN_API_KEY,
        },
      ];

      // Inicializar proveedores disponibles
      for (const provider of defaultProviders) {
        if (provider.enabled) {
          switch (provider.name) {
            case 'TrustFactory':
              this.providers.push(new TrustFactoryProvider(provider.config));
              break;
            case 'FirmaPro':
              this.providers.push(new FirmaProProvider(provider.config));
              break;
            case 'DigitalSign':
              this.providers.push(new DigitalSignProvider(provider.config));
              break;
          }
        }
      }

      logger.info('Signature providers loaded', {
        count: this.providers.length,
        providers: this.providers.map(p => p.name)
      });

    } catch (error) {
      logger.error('Error loading signature providers:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private initializeFallbackProviders() {
    // Fallback básico con configuración mínima
    const fallbackConfig = {
      apiKey: process.env.TRUSTFACTORY_API_KEY || '',
      apiSecret: process.env.TRUSTFACTORY_API_SECRET || '',
      certificateId: process.env.TRUSTFACTORY_CERTIFICATE_ID || '',
      baseUrl: 'https://api.trustfactory.cl/v2'
    };

    if (fallbackConfig.apiKey && fallbackConfig.apiSecret && fallbackConfig.certificateId) {
      try {
        this.providers.push(new TrustFactoryProvider(fallbackConfig));
        logger.warn('SignatureService inicializado con configuración fallback');
      } catch (error) {
        logger.error('Error en fallback de proveedores:', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      logger.error('No se puede inicializar SignatureService - configuración faltante');
    }
  }

  // Obtener proveedores disponibles
  async getAvailableProviders(): Promise<string[]> {
    await this.ensureInitialized();
    return this.providers.map(p => p.name);
  }

  // Obtener proveedor por nombre
  async getProvider(name: string): Promise<SignatureProvider | undefined> {
    await this.ensureInitialized();
    return this.providers.find(p => p.name === name);
  }

  // Crear solicitud de firma
  async createSignatureRequest(
    documentId: string,
    signers: Array<{ email: string; name: string; role?: string }>,
    providerName?: string
  ): Promise<SignatureResult> {
    await this.ensureInitialized();

    try {
      // Seleccionar proveedor (por defecto el primero disponible)
      const provider = providerName
        ? await this.getProvider(providerName)
        : this.providers[0];

      if (!provider) {
        return {
          success: false,
          message: 'No signature provider available',
          signatureId: '',
          status: SignatureStatus.FAILED,
          provider: '',
          timestamp: new Date()
        };
      }

      // Generar ID único para la solicitud
      const signatureId = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Guardar en base de datos primero
      const dbRecord = await db.signatureRequest.create({
        data: {
          id: signatureId,
          documentId,
          provider: provider.name,
          providerRequestId: signatureId,
          status: SignatureStatus.PENDING,
          type: 'advanced',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          metadata: JSON.stringify({
            createdBy: 'system',
            createdAt: new Date().toISOString()
          }),
          signers: {
            create: signers.map((signer, index) => ({
              email: signer.email,
              name: signer.name,
              role: signer.role || 'SIGNER',
              status: SignatureStatus.PENDING,
              metadata: JSON.stringify({
                order: index + 1,
                isRequired: true
              })
            }))
          }
        },
        include: {
          signers: true
        }
      });

      logger.info('Signature request created', {
        signatureId,
        documentId,
        provider: provider.name,
        signersCount: signers.length
      });

      return {
        success: true,
        signatureId,
        status: SignatureStatus.PENDING,
        provider: provider.name,
        message: 'Signature request created successfully',
        timestamp: new Date(),
        metadata: {
          databaseId: dbRecord.id,
          expiresAt: dbRecord.expiresAt?.toISOString()
        }
      };

    } catch (error) {
      logger.error('Error creating signature request:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        signatureId: '',
        status: SignatureStatus.FAILED,
        provider: '',
        timestamp: new Date()
      };
    }
  }

  // Obtener estado de solicitud de firma
  async getSignatureStatus(requestId: string): Promise<SignatureStatus> {
    try {
      const signatureRequest = await db.signatureRequest.findUnique({
        where: { id: requestId },
        include: { signers: true }
      });

      if (!signatureRequest) {
        throw new Error('Signature request not found');
      }

      const provider = await this.getProvider(signatureRequest.provider);
      if (!provider) {
        throw new Error('Signature provider not available');
      }

      const status = await provider.getSignatureStatus(signatureRequest.providerRequestId || '');

      // Actualizar estado en base de datos
      await db.signatureRequest.update({
        where: { id: requestId },
        data: { status }
      });

      return status;

    } catch (error) {
      logger.error('Error getting signature status:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // Descargar documento firmado
  async downloadSignedDocument(requestId: string): Promise<Buffer | null> {
    try {
      const signatureRequest = await db.signatureRequest.findUnique({
        where: { id: requestId },
        include: { signers: true }
      });

      if (!signatureRequest) {
        throw new Error('Signature request not found');
      }

      // Verificar que la firma esté completada
      if (signatureRequest.status !== SignatureStatus.COMPLETED) {
        return null;
      }

      const provider = await this.getProvider(signatureRequest.provider);
      if (!provider) {
        throw new Error('Signature provider not available');
      }

      // Intentar descargar desde el proveedor
      try {
        const documentBuffer = await provider.downloadSignedDocument(signatureRequest.providerRequestId || '');
        return documentBuffer;
      } catch (error) {
        logger.error('Error downloading from provider:', {
          error: error instanceof Error ? error.message : String(error),
          provider: signatureRequest.provider,
          requestId
        });
        return null;
      }

    } catch (error) {
      logger.error('Error downloading signed document:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  // Cancelar solicitud de firma
  async cancelSignatureRequest(requestId: string): Promise<void> {
    try {
      const signatureRequest = await db.signatureRequest.findUnique({
        where: { id: requestId }
      });

      if (!signatureRequest) {
        throw new Error('Signature request not found');
      }

      const provider = await this.getProvider(signatureRequest.provider);
      if (!provider) {
        throw new Error('Signature provider not available');
      }

      await provider.cancelSignatureRequest(signatureRequest.providerRequestId || '');

      // Actualizar estado en base de datos
      await db.signatureRequest.update({
        where: { id: requestId },
        data: { status: SignatureStatus.CANCELLED }
      });

      logger.info('Signature request cancelled', { requestId });

    } catch (error) {
      logger.error('Error cancelling signature request:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

// Instancia singleton
export const signatureService = new SignatureService();
