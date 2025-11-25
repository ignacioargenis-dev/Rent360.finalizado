import { SignatureProvider } from './base';
import { SignatureRequest, SignatureResult, SignatureStatus, SignatureType } from '../types';
import { logger } from '../../logger';

/**
 * FirmaSimple - Proveedor chileno autorizado para firmas electrónicas avanzadas
 *
 * Cumple con la Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas
 * Certificado para emitir firmas electrónicas avanzadas con validez legal
 * Interfaz simple y amigable, ideal para contratos comerciales
 */
export class FirmaSimpleProvider extends SignatureProvider {
  private apiKey: string;
  private clientId: string;
  private baseUrl: string;
  private callbackUrl: string;

  constructor(config: Record<string, any>) {
    super('FirmaSimple', SignatureType.ADVANCED, config);

    this.apiKey = config.apiKey || '';
    this.clientId = config.clientId || '';
    this.baseUrl = config.apiUrl || config.baseUrl || 'https://api.firmasimple.cl';
    this.callbackUrl =
      config.callbackUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/signatures/callback/firmasimple`;

    // Configuración por defecto
    this.updateConfig({
      ...config,
      priority: 7,
      compliance: {
        law_19799: true,
        advanced_signature: true,
        legal_validity: true,
        simple_interface: true,
      },
    });
  }

  async createSignatureRequest(
    documentId: string,
    signers: Array<{ email: string; name: string; role?: string }>
  ): Promise<SignatureResult> {
    try {
      const request: SignatureRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        documentName: `Contract ${documentId}`,
        documentHash: '',
        signers: signers.map((s, index) => ({
          id: `signer_${index + 1}`,
          email: s.email,
          name: s.name || '',
          rut: '',
          phone: '',
          order: index + 1,
          isRequired: true,
        })),
        type: SignatureType.ADVANCED,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {},
      };

      if (!(await this.validateRequest(request))) {
        throw new Error('Solicitud de firma inválida');
      }

      // Preparar payload para API de FirmaSimple
      const firmaSimpleRequest = {
        document: {
          id: request.documentId,
          name: request.documentName,
        },
        signers: request.signers.map(signer => ({
          email: signer.email,
          name: signer.name || '',
          order: signer.order || 1,
        })),
        expiresAt: request.expiresAt.toISOString(),
        callbackUrl: this.callbackUrl,
        metadata: request.metadata,
      };

      // Hacer llamada a la API de FirmaSimple
      const response = await this.makeAPIRequest('/documents/create', 'POST', firmaSimpleRequest);

      if (!response.success) {
        throw new Error(response.message || 'Error en la API de FirmaSimple');
      }

      const signatureId = response.data.documentId;

      logger.info('Solicitud de firma FirmaSimple creada exitosamente', {
        signatureId,
        documentId: request.documentId,
        signersCount: request.signers.length,
      });

      return {
        success: true,
        signatureId,
        status: SignatureStatus.PENDING,
        message: 'Solicitud de firma electrónica avanzada creada exitosamente en FirmaSimple',
        provider: this.name,
        timestamp: new Date(),
        metadata: {
          firmaSimpleId: signatureId,
          expiresAt: request.expiresAt,
        },
      };
    } catch (error) {
      logger.error('Error creando solicitud de firma FirmaSimple:', {
        error: error instanceof Error ? error.message : String(error),
        documentId,
      });

      return {
        success: false,
        status: SignatureStatus.FAILED,
        message: `Error creando solicitud en FirmaSimple: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async getSignatureStatus(signatureId: string): Promise<SignatureStatus> {
    try {
      const response = await this.makeAPIRequest(`/documents/${signatureId}/status`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error obteniendo estado');
      }

      return this.mapAPIStatusToInternal(response.data.status);
    } catch (error) {
      logger.error('Error obteniendo estado de firma FirmaSimple:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      return SignatureStatus.FAILED;
    }
  }

  async cancelSignatureRequest(signatureId: string): Promise<void> {
    try {
      const response = await this.makeAPIRequest(`/documents/${signatureId}/cancel`, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'Error cancelando firma');
      }

      logger.info('Solicitud de firma FirmaSimple cancelada exitosamente', {
        signatureId,
      });
    } catch (error) {
      logger.error('Error cancelando solicitud de firma FirmaSimple:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      throw error;
    }
  }

  async downloadSignedDocument(signatureId: string): Promise<Buffer | null> {
    try {
      const response = await this.makeAPIRequest(`/documents/${signatureId}/download`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error descargando documento');
      }

      const documentBuffer = Buffer.from(response.data.document, 'base64');

      logger.info('Documento firmado FirmaSimple descargado exitosamente', {
        signatureId,
        size: documentBuffer.length,
      });

      return documentBuffer;
    } catch (error) {
      logger.error('Error descargando documento firmado FirmaSimple:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      return null;
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeAPIRequest('/health', 'GET');
      return this.apiKey.length > 0 && this.clientId.length > 0 && response.success;
    } catch (error) {
      logger.warn('Health check falló para FirmaSimple:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private async makeAPIRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Client-ID': this.clientId,
        'User-Agent': 'Rent360-SignatureService/1.0',
      };

      logger.debug('Haciendo llamada a API FirmaSimple:', {
        url,
        method,
        endpoint,
      });

      const response = await fetch(url, {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) }),
        signal: AbortSignal.timeout(30000),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          `API FirmaSimple error: ${response.status} - ${responseData.message || response.statusText}`
        );
      }

      return {
        success: true,
        data: responseData,
        statusCode: response.status,
      };
    } catch (error) {
      logger.error('Error en llamada a API FirmaSimple:', {
        error: error instanceof Error ? error.message : String(error),
        endpoint,
        method,
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error: error,
      };
    }
  }

  private mapAPIStatusToInternal(apiStatus: string): SignatureStatus {
    const statusMap: { [key: string]: SignatureStatus } = {
      PENDING: SignatureStatus.PENDING,
      IN_PROGRESS: SignatureStatus.IN_PROGRESS,
      COMPLETED: SignatureStatus.COMPLETED,
      CANCELLED: SignatureStatus.CANCELLED,
      EXPIRED: SignatureStatus.FAILED,
      FAILED: SignatureStatus.FAILED,
    };

    return statusMap[apiStatus] || SignatureStatus.FAILED;
  }
}
