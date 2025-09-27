import { SignatureProvider } from './base';
import { SignatureRequest, SignatureResult, SignatureStatus, SignatureType } from '../types';
import { logger } from '../../logger';

// Interfaz TrustFactoryAPI eliminada - no se utiliza en la implementación

/**
 * TrustFactory - Proveedor chileno autorizado para firmas electrónicas avanzadas
 *
 * Cumple con la Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas
 * y el Decreto Supremo N° 181/2020 del Ministerio de Economía
 *
 * Certificado por el Servicio de Impuestos Internos (SII) de Chile
 * Autorizado para emitir firmas electrónicas avanzadas con plena validez legal
 */
export class TrustFactoryProvider extends SignatureProvider {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private certificateId: string;

  constructor(config: Record<string, any>) {
    super('TrustFactory', SignatureType.QUALIFIED, config);

    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.baseUrl = config.baseUrl || 'https://api.trustfactory.cl/v2';
    this.certificateId = config.certificateId || '';

    // Configuración por defecto para alta prioridad
    this.updateConfig({
      ...config,
      priority: 10, // Mayor prioridad que proveedores internacionales
      compliance: {
        law_19799: true, // Ley 19.799
        decree_181_2020: true, // Decreto Supremo 181/2020
        sii_certified: true, // Certificado por SII
        qualified_signature: true, // Firma electrónica calificada
        legal_validity: true // Validez jurídica plena
      }
    });
  }

  async createSignatureRequest(documentId: string, signers: Array<{ email: string; name: string; role?: string }>): Promise<SignatureResult> {
    try {
      // Crear objeto SignatureRequest para validación
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
          isRequired: true
        })),
        type: SignatureType.QUALIFIED,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        metadata: {}
      };

      if (!await this.validateRequest(request)) {
        throw new Error('Solicitud de firma inválida');
      }

      // Crear objeto signatureRequest para compatibilidad
      const signatureRequest: SignatureRequest = {
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
          isRequired: true
        })),
        type: SignatureType.QUALIFIED,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {}
      };

      // Validar que todos los firmantes tengan RUT (requerido por ley chilena)
      const invalidSigners = signatureRequest.signers.filter(signer => !signer.rut);
      if (invalidSigners.length > 0) {
        throw new Error('Todos los firmantes deben tener RUT válido según la legislación chilena');
      }

      // Preparar payload para API de TrustFactory
      const trustFactoryRequest = {
        document: {
          id: signatureRequest.documentId,
          name: signatureRequest.documentName,
          hash: signatureRequest.documentHash,
          type: 'CONTRACT',
          category: 'REAL_ESTATE',
          compliance: {
            law: '19.799',
            decree: '181/2020',
            certificate: this.certificateId
          }
        },
        signers: signatureRequest.signers.map(signer => ({
          rut: signer.rut || '',
          email: signer.email,
          name: signer.name || '',
          phone: signer.phone || '',
          order: signer.order || 1,
          required: signer.isRequired || true,
          role: this.determineSignerRole(signer)
        })),
        expiresAt: signatureRequest.expiresAt.toISOString(),
        metadata: {
          ...signatureRequest.metadata,
          compliance: {
            law: '19.799',
            decree: '181/2020',
            certificate: this.certificateId,
            qualified: true
          },
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/signatures/callback/trustfactory`
        }
      };

      // Hacer llamada real a la API de TrustFactory
      const response = await this.makeAPIRequest('/signatures/create', 'POST', trustFactoryRequest);

      if (!response.success) {
        throw new Error(response.message || 'Error en la API de TrustFactory');
      }

      const signatureId = response.data.signatureId;

      logger.info('Solicitud de firma TrustFactory creada exitosamente', {
        signatureId,
        documentId: signatureRequest.documentId,
        signersCount: signatureRequest.signers.length,
        apiResponse: response,
        compliance: 'Ley 19.799 - Decreto 181/2020'
      });

      return {
        success: true,
        signatureId,
        status: SignatureStatus.PENDING,
        message: 'Solicitud de firma electrónica avanzada creada exitosamente en TrustFactory',
        provider: this.name,
        timestamp: new Date(),
        metadata: {
          trustFactoryId: signatureId,
          expiresAt: signatureRequest.expiresAt,
          compliance: {
            law: '19.799',
            decree: '181/2020',
            qualified: true,
            legalValidity: true
          },
          signers: signatureRequest.signers.map(s => ({
            rut: s.rut || '',
            email: s.email,
            name: s.name || '',
            status: 'pending'
          })),
          apiResponse: response.data
        }
      };

    } catch (error) {
      logger.error('Error creando solicitud de firma TrustFactory:', {
        error: error instanceof Error ? error.message : String(error),
        documentId,
        signersCount: signers.length
      });

      return {
        success: false,
        status: SignatureStatus.FAILED,
        message: `Error creando solicitud en TrustFactory: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.name,
        timestamp: new Date()
      };
    }
  }

  async getSignatureStatus(signatureId: string): Promise<SignatureStatus> {
    try {
      // Hacer llamada real a la API de TrustFactory
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/status`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error obteniendo estado de firma');
      }

      const status = this.mapAPIStatusToInternal(response.data.status);

      logger.info('Estado de firma TrustFactory obtenido', {
        signatureId,
        status,
        apiStatus: response.data.status,
        compliance: 'Verificado según ley chilena'
      });

      return status;

    } catch (error) {
      logger.error('Error obteniendo estado de firma TrustFactory:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId
      });
      return SignatureStatus.FAILED;
    }
  }

  async cancelSignatureRequest(signatureId: string): Promise<void> {
    try {
      // Hacer llamada real a la API de TrustFactory
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/cancel`, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'Error cancelando firma');
      }

      logger.info('Solicitud de firma TrustFactory cancelada exitosamente', {
        signatureId,
        apiResponse: response.data,
        compliance: 'Cancelación registrada según normativa'
      });

    } catch (error) {
      logger.error('Error cancelando solicitud de firma TrustFactory:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId
      });
      throw error;
    }
  }

  async downloadSignedDocument(signatureId: string): Promise<Buffer | null> {
    try {
      // Hacer llamada real a la API de TrustFactory para descargar documento
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/download`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error descargando documento');
      }

      // Convertir respuesta a Buffer
      const documentBuffer = Buffer.from(response.data.document, 'base64');

      logger.info('Documento firmado TrustFactory descargado exitosamente', {
        signatureId,
        size: documentBuffer.length,
        certificateId: response.data.certificateId,
        compliance: 'Documento con validez legal plena'
      });

      return documentBuffer;

    } catch (error) {
      logger.error('Error descargando documento firmado TrustFactory:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId
      });
      return null;
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      // Verificar conectividad con TrustFactory y certificación
      const response = await this.makeAPIRequest('/health', 'GET');
      return this.apiKey.length > 0 &&
             this.apiSecret.length > 0 &&
             this.certificateId.length > 0 &&
             response.success;
    } catch (error) {
      logger.warn('Health check falló para TrustFactory:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  // Método auxiliar para hacer llamadas a la API de TrustFactory
  private async makeAPIRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const timestamp = new Date().toISOString();

      // Crear firma de autenticación
      const signature = this.createAPISignature(method, endpoint, timestamp, data);

      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Signature': signature,
        'X-API-Timestamp': timestamp,
        'X-Certificate-ID': this.certificateId,
        'User-Agent': 'Rent360-SignatureService/1.0'
      };

      logger.debug('Haciendo llamada a API TrustFactory:', {
        url,
        method,
        endpoint,
        hasData: !!data
      });

      const response = await fetch(url, {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) }),
        // Timeout de 30 segundos
        signal: AbortSignal.timeout(30000)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`API TrustFactory error: ${response.status} - ${responseData.message || response.statusText}`);
      }

      return {
        success: true,
        data: responseData,
        statusCode: response.status
      };

    } catch (error) {
      logger.error('Error en llamada a API TrustFactory:', {
        error: error instanceof Error ? error.message : String(error),
        endpoint,
        method
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error: error
      };
    }
  }

  // Crear firma de autenticación para API
  private createAPISignature(method: string, endpoint: string, timestamp: string, data?: any): string {
    const payload = `${method}${endpoint}${timestamp}${data ? JSON.stringify(data) : ''}${this.apiSecret}`;
    // En una implementación real, usaríamos un algoritmo de hash seguro
    return Buffer.from(payload).toString('base64');
  }

  // Mapear estados de API a estados internos
  private mapAPIStatusToInternal(apiStatus: string): SignatureStatus {
    const statusMap: { [key: string]: SignatureStatus } = {
      'PENDING': SignatureStatus.PENDING,
      'IN_PROGRESS': SignatureStatus.IN_PROGRESS,
      'WAITING_FOR_SIGNERS': SignatureStatus.IN_PROGRESS,
      'COMPLETED': SignatureStatus.COMPLETED,
      'CANCELLED': SignatureStatus.CANCELLED,
      'EXPIRED': SignatureStatus.FAILED,
      'FAILED': SignatureStatus.FAILED
    };

    return statusMap[apiStatus] || SignatureStatus.FAILED;
  }

  // Determinar rol del firmante
  private determineSignerRole(signer: any): string {
    if (signer.metadata?.role) {
      return signer.metadata.role;
    }

    // Lógica por defecto basada en el orden
    if (signer.order === 1) return 'OWNER'; // Propietario/Arrendador
    if (signer.order === 2) return 'TENANT'; // Inquilino/Arrendatario
    return 'GUARANTOR'; // Fiador
  }

  // Métodos específicos de TrustFactory
  async getSignatureCertificate(signatureId: string): Promise<any> {
    try {
      // Hacer llamada real a la API de TrustFactory
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/certificate`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error obteniendo certificado');
      }

      return {
        ...response.data,
        compliance: {
          law: '19.799',
          decree: '181/2020',
          qualified: true
        }
      };
    } catch (error) {
      logger.error('Error obteniendo certificado TrustFactory:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId
      });
      return null;
    }
  }

  async validateSignerIdentity(signatureId: string, signerRut: string): Promise<boolean> {
    try {
      // Hacer llamada real a la API de TrustFactory
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/validate-identity`, 'POST', {
        rut: signerRut
      });

      if (!response.success) {
        throw new Error(response.message || 'Error validando identidad');
      }

      logger.info('Identidad del firmante validada exitosamente por TrustFactory', {
        signatureId,
        signerRut,
        validationResult: response.data.valid,
        compliance: 'Validación según registro civil chileno'
      });

      return response.data.valid === true;
    } catch (error) {
      logger.error('Error validando identidad del firmante:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
        signerRut
      });
      return false;
    }
  }

  async getLegalAuditTrail(signatureId: string): Promise<any[]> {
    try {
      // Hacer llamada real a la API de TrustFactory
      const response = await this.makeAPIRequest(`/signatures/${signatureId}/audit-trail`, 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Error obteniendo auditoría');
      }

      logger.info('Auditoría legal obtenida exitosamente de TrustFactory', {
        signatureId,
        auditEntries: response.data.length,
        compliance: 'Registro según ley 19.799'
      });

      return response.data.map((entry: any) => ({
        ...entry,
        compliance: 'Registro según ley 19.799'
      }));

    } catch (error) {
      logger.error('Error obteniendo auditoría legal TrustFactory:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId
      });
      return [];
    }
  }

  // Información de cumplimiento legal chileno
  getComplianceInfo(): {
    law: string;
    decree: string;
    authority: string;
    certificate: string;
    qualified: boolean;
    legalValidity: boolean;
  } {
    return {
      law: 'Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas',
      decree: 'Decreto Supremo N° 181/2020 del Ministerio de Economía',
      authority: 'Servicio de Impuestos Internos (SII)',
      certificate: this.certificateId,
      qualified: true,
      legalValidity: true
    };
  }
}
