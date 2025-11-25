import { SignatureProvider } from './base';
import { SignatureRequest, SignatureResult, SignatureStatus, SignatureType } from '../types';
import { logger } from '../../logger';

/**
 * eSign - Proveedor chileno autorizado para firmas electrónicas avanzadas y cualificadas
 *
 * Cumple con la Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas
 * y el Decreto Supremo N° 181/2020 del Ministerio de Economía
 *
 * Certificado por el Servicio de Impuestos Internos (SII) de Chile
 * Autorizado para emitir firmas electrónicas avanzadas y cualificadas
 * Proveedor líder en Chile para documentos legales y notariales
 */
export class ESignProvider extends SignatureProvider {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;
  private environment: string;

  constructor(config: Record<string, any>) {
    super('eSign', SignatureType.QUALIFIED, config);

    this.apiKey = config.apiKey || '';
    this.secretKey = config.secretKey || '';
    this.baseUrl = config.apiUrl || config.baseUrl || 'https://api.esign.cl';
    this.environment = config.environment || 'production';

    // Configuración por defecto para máxima prioridad
    this.updateConfig({
      ...config,
      priority: 10, // Máxima prioridad
      compliance: {
        law_19799: true,
        decree_181_2020: true,
        sii_certified: true,
        qualified_signature: true,
        legal_validity: true,
        notarial_support: true,
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
        type: SignatureType.QUALIFIED,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {},
      };

      if (!(await this.validateRequest(request))) {
        throw new Error('Solicitud de firma inválida');
      }

      // Preparar payload para API de eSign
      const eSignRequest = {
        document: {
          id: request.documentId,
          name: request.documentName,
          hash: request.documentHash,
          type: 'LEGAL_CONTRACT',
          category: 'REAL_ESTATE',
        },
        signers: request.signers.map(signer => ({
          rut: signer.rut || '',
          email: signer.email,
          name: signer.name || '',
          phone: signer.phone || '',
          order: signer.order || 1,
          required: signer.isRequired || true,
        })),
        expiresAt: request.expiresAt.toISOString(),
        environment: this.environment,
        metadata: {
          ...request.metadata,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/signatures/callback/esign`,
        },
      };

      // Hacer llamada a la API de eSign
      const response = await this.makeAPIRequest('/signatures/create', 'POST', eSignRequest);

      if (!response.success) {
        throw new Error(response.message || 'Error en la API de eSign');
      }

      const signatureId = response.data.signatureId;

      logger.info('Solicitud de firma eSign creada exitosamente', {
        signatureId,
        documentId: request.documentId,
        signersCount: request.signers.length,
        compliance: 'Ley 19.799 - Firma cualificada',
      });

      return {
        success: true,
        signatureId,
        status: SignatureStatus.PENDING,
        message: 'Solicitud de firma electrónica cualificada creada exitosamente en eSign',
        provider: this.name,
        timestamp: new Date(),
        metadata: {
          eSignId: signatureId,
          expiresAt: request.expiresAt,
          compliance: {
            law: '19.799',
            qualified: true,
            legalValidity: true,
          },
          signers: request.signers.map(s => ({
            email: s.email,
            name: s.name || '',
            status: 'pending',
          })),
        },
      };
    } catch (error) {
      logger.error('Error creando solicitud de firma eSign:', {
        error: error instanceof Error ? error.message : String(error),
        documentId,
      });

      return {
        success: false,
        status: SignatureStatus.FAILED,
        message: `Error creando solicitud en eSign: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async getSignatureStatus(signatureId: string): Promise<SignatureStatus> {
    try {
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/status`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error obteniendo estado');
      }

      return this.mapAPIStatusToInternal(response.data.status);
    } catch (error) {
      logger.error('Error obteniendo estado de firma eSign:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      return SignatureStatus.FAILED;
    }
  }

  async cancelSignatureRequest(signatureId: string): Promise<void> {
    try {
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/cancel`, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'Error cancelando firma');
      }

      logger.info('Solicitud de firma eSign cancelada exitosamente', {
        signatureId,
      });
    } catch (error) {
      logger.error('Error cancelando solicitud de firma eSign:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      throw error;
    }
  }

  async downloadSignedDocument(signatureId: string): Promise<Buffer | null> {
    try {
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/download`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error descargando documento');
      }

      const documentBuffer = Buffer.from(response.data.document, 'base64');

      logger.info('Documento firmado eSign descargado exitosamente', {
        signatureId,
        size: documentBuffer.length,
      });

      return documentBuffer;
    } catch (error) {
      logger.error('Error descargando documento firmado eSign:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      return null;
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeAPIRequest('/health', 'GET');
      return this.apiKey.length > 0 && this.secretKey.length > 0 && response.success;
    } catch (error) {
      logger.warn('Health check falló para eSign:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private async makeAPIRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const timestamp = new Date().toISOString();

      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.secretKey,
        'X-API-Timestamp': timestamp,
        'X-Environment': this.environment,
        'User-Agent': 'Rent360-SignatureService/1.0',
      };

      logger.debug('Haciendo llamada a API eSign:', {
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
          `API eSign error: ${response.status} - ${responseData.message || response.statusText}`
        );
      }

      return {
        success: true,
        data: responseData,
        statusCode: response.status,
      };
    } catch (error) {
      logger.error('Error en llamada a API eSign:', {
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
