import { SignatureProvider } from './base';
import { SignatureRequest, SignatureResult, SignatureStatus, SignatureType } from '../types';
import { logger } from '../../logger';

/**
 * FirmaChile - Proveedor oficial chileno para firmas electrónicas cualificadas
 *
 * Cumple con la Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas
 * Proveedor oficial respaldado por el Gobierno de Chile
 * Máxima validez legal para documentos oficiales y gubernamentales
 * Integración con Registro Civil y Servicio de Impuestos Internos
 */
export class FirmaChileProvider extends SignatureProvider {
  private apiKey: string;
  private certificateAuthority: string;
  private baseUrl: string;

  constructor(config: Record<string, any>) {
    super('FirmaChile', SignatureType.QUALIFIED, config);

    this.apiKey = config.apiKey || '';
    this.certificateAuthority = config.certificateAuthority || '';
    this.baseUrl = config.apiUrl || config.baseUrl || 'https://api.firmachile.cl';

    // Configuración por defecto para máxima prioridad (oficial del gobierno)
    this.updateConfig({
      ...config,
      priority: 10,
      compliance: {
        law_19799: true,
        decree_181_2020: true,
        government_backed: true,
        qualified_signature: true,
        legal_validity: true,
        official_provider: true,
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

      // Preparar payload para API de FirmaChile
      const firmaChileRequest = {
        document: {
          id: request.documentId,
          name: request.documentName,
          hash: request.documentHash,
          type: 'OFFICIAL_CONTRACT',
          category: 'LEGAL',
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
        certificateAuthority: this.certificateAuthority,
        metadata: {
          ...request.metadata,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/signatures/callback/firmachile`,
        },
      };

      // Hacer llamada a la API de FirmaChile
      const response = await this.makeAPIRequest(
        '/signatures/official/create',
        'POST',
        firmaChileRequest
      );

      if (!response.success) {
        throw new Error(response.message || 'Error en la API de FirmaChile');
      }

      const signatureId = response.data.signatureId;

      logger.info('Solicitud de firma FirmaChile creada exitosamente', {
        signatureId,
        documentId: request.documentId,
        signersCount: request.signers.length,
        compliance: 'Ley 19.799 - Firma oficial del gobierno',
      });

      return {
        success: true,
        signatureId,
        status: SignatureStatus.PENDING,
        message:
          'Solicitud de firma electrónica cualificada oficial creada exitosamente en FirmaChile',
        provider: this.name,
        timestamp: new Date(),
        metadata: {
          firmaChileId: signatureId,
          expiresAt: request.expiresAt,
          compliance: {
            law: '19.799',
            qualified: true,
            official: true,
            legalValidity: true,
          },
          certificateAuthority: this.certificateAuthority,
        },
      };
    } catch (error) {
      logger.error('Error creando solicitud de firma FirmaChile:', {
        error: error instanceof Error ? error.message : String(error),
        documentId,
      });

      return {
        success: false,
        status: SignatureStatus.FAILED,
        message: `Error creando solicitud en FirmaChile: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async getSignatureStatus(signatureId: string): Promise<SignatureStatus> {
    try {
      const response = await this.makeAPIRequest(
        `/signatures/official/${signatureId}/status`,
        'GET'
      );

      if (!response.success) {
        throw new Error(response.message || 'Error obteniendo estado');
      }

      return this.mapAPIStatusToInternal(response.data.status);
    } catch (error) {
      logger.error('Error obteniendo estado de firma FirmaChile:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      return SignatureStatus.FAILED;
    }
  }

  async cancelSignatureRequest(signatureId: string): Promise<void> {
    try {
      const response = await this.makeAPIRequest(
        `/signatures/official/${signatureId}/cancel`,
        'POST'
      );

      if (!response.success) {
        throw new Error(response.message || 'Error cancelando firma');
      }

      logger.info('Solicitud de firma FirmaChile cancelada exitosamente', {
        signatureId,
      });
    } catch (error) {
      logger.error('Error cancelando solicitud de firma FirmaChile:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      throw error;
    }
  }

  async downloadSignedDocument(signatureId: string): Promise<Buffer | null> {
    try {
      const response = await this.makeAPIRequest(
        `/signatures/official/${signatureId}/download`,
        'GET'
      );

      if (!response.success) {
        throw new Error(response.message || 'Error descargando documento');
      }

      const documentBuffer = Buffer.from(response.data.document, 'base64');

      logger.info('Documento firmado FirmaChile descargado exitosamente', {
        signatureId,
        size: documentBuffer.length,
        official: true,
      });

      return documentBuffer;
    } catch (error) {
      logger.error('Error descargando documento firmado FirmaChile:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
      });
      return null;
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeAPIRequest('/health/official', 'GET');
      return this.apiKey.length > 0 && this.certificateAuthority.length > 0 && response.success;
    } catch (error) {
      logger.warn('Health check falló para FirmaChile:', {
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
        'X-Certificate-Authority': this.certificateAuthority,
        'X-API-Timestamp': timestamp,
        'X-Official-Provider': 'true',
        'User-Agent': 'Rent360-SignatureService/1.0',
      };

      logger.debug('Haciendo llamada a API FirmaChile:', {
        url,
        method,
        endpoint,
        official: true,
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
          `API FirmaChile error: ${response.status} - ${responseData.message || response.statusText}`
        );
      }

      return {
        success: true,
        data: responseData,
        statusCode: response.status,
      };
    } catch (error) {
      logger.error('Error en llamada a API FirmaChile:', {
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
      WAITING_VERIFICATION: SignatureStatus.IN_PROGRESS,
      COMPLETED: SignatureStatus.COMPLETED,
      CANCELLED: SignatureStatus.CANCELLED,
      EXPIRED: SignatureStatus.FAILED,
      FAILED: SignatureStatus.FAILED,
      REJECTED: SignatureStatus.FAILED,
    };

    return statusMap[apiStatus] || SignatureStatus.FAILED;
  }

  /**
   * Información de cumplimiento legal oficial
   */
  getComplianceInfo(): {
    law: string;
    decree: string;
    authority: string;
    official: boolean;
    qualified: boolean;
    legalValidity: boolean;
  } {
    return {
      law: 'Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas',
      decree: 'Decreto Supremo N° 181/2020 del Ministerio de Economía',
      authority: this.certificateAuthority,
      official: true,
      qualified: true,
      legalValidity: true,
    };
  }
}
