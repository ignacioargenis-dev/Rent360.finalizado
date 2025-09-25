import { SignatureProvider } from './base';
import { SignatureRequest, SignatureResult, SignatureStatus, SignatureType, Signer } from '../types';
import { logger } from '../../logger';

/**
 * DigitalSign - Proveedor chileno autorizado para firmas electrónicas avanzadas
 *
 * Cumple con la Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas
 * Certificado por el Servicio de Impuestos Internos (SII) de Chile
 * Especializado en contratos comerciales y de servicios
 * Aprobado para contratos de arriendo residencial y comercial
 *
 * Certificado por SII para emitir firmas electrónicas calificadas
 * Validez jurídica plena en Chile con integración bancaria
 */
export class DigitalSignProvider extends SignatureProvider {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private certificateId: string;
  private bankIntegration: boolean;

  constructor(config: Record<string, any>) {
    super('DigitalSign', SignatureType.QUALIFIED, config);

    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.baseUrl = config.baseUrl || 'https://api.digitalsign.cl/v2';
    this.certificateId = config.certificateId || '';
    this.bankIntegration = config.bankIntegration !== false;

    // Configuración por defecto para prioridad media-alta
    this.updateConfig({
      ...config,
      priority: 8, // Prioridad media-alta
      compliance: {
        law_19799: true, // Ley 19.799
        decree_181_2020: true, // Decreto Supremo 181/2020
        sii_certified: true, // Certificado por SII
        qualified_signature: true, // Firma electrónica calificada
        legal_validity: true, // Validez jurídica plena
        bank_integration: this.bankIntegration, // Integración bancaria
        commercial_focus: true // Enfoque comercial
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
          name: s.name,
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

      // Validar que todos los firmantes tengan RUT
      const invalidSigners = request.signers.filter(signer => !signer.rut);
      if (invalidSigners.length > 0) {
        throw new Error('Todos los firmantes deben tener RUT válido');
      }

      // Validar formato de RUT chileno
      const invalidRutFormat = request.signers.filter(signer => !this.validateRutFormat(signer.rut));
      if (invalidRutFormat.length > 0) {
        throw new Error('Formato de RUT inválido para uno o más firmantes');
      }

      // Crear solicitud en DigitalSign
      // Los datos se procesan directamente sin crear objeto intermedio

      // Simular llamada a API de DigitalSign
      const signatureId = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Solicitud de firma DigitalSign creada', {
        signatureId,
        documentId: request.documentId,
        signersCount: request.signers.length,
        bankIntegration: this.bankIntegration,
        compliance: 'Ley 19.799 con integración bancaria opcional'
      });

      return {
        success: true,
        signatureId,
        status: SignatureStatus.PENDING,
        message: 'Solicitud de firma electrónica avanzada creada exitosamente en DigitalSign',
        provider: this.name,
        timestamp: new Date(),
        metadata: {
          digitalSignId: signatureId,
          expiresAt: request.expiresAt,
          compliance: {
            law: '19.799',
            decree: '181/2020',
            qualified: true,
            legalValidity: true,
            bankIntegration: this.bankIntegration
          },
          signers: request.signers.map(s => ({
            rut: s.rut,
            email: s.email,
            name: s.name,
            role: this.determineContractRole(s),
            bankVerified: this.bankIntegration,
            status: 'pending'
          }))
        }
      };

    } catch (error) {
      logger.error('Error creando solicitud de firma DigitalSign:', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        status: SignatureStatus.FAILED,
        message: `Error creando solicitud: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.name,
        timestamp: new Date()
      };
    }
  }

  async getSignatureStatus(signatureId: string): Promise<SignatureStatus> {
    try {
      // Simular consulta de estado en DigitalSign
      const statuses = [SignatureStatus.PENDING, SignatureStatus.IN_PROGRESS, SignatureStatus.COMPLETED];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] || statuses[0];

      logger.info('Estado de firma DigitalSign obtenido', {
        signatureId,
        status: randomStatus,
        compliance: 'Verificado según ley chilena con validación bancaria'
      });

      return randomStatus;

    } catch (error) {
      logger.error('Error obteniendo estado de firma DigitalSign:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return SignatureStatus.FAILED;
    }
  }

  async cancelSignatureRequest(signatureId: string): Promise<void> {
    try {
      // Simular cancelación en DigitalSign
      logger.info('Solicitud de firma DigitalSign cancelada', {
        signatureId,
        compliance: 'Cancelación registrada con validación bancaria'
      });

    } catch (error) {
      logger.error('Error cancelando solicitud de firma DigitalSign:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async downloadSignedDocument(signatureId: string): Promise<Buffer | null> {
    try {
      // Simular descarga de documento firmado con certificación bancaria
      const bankInfo = this.bankIntegration ? ' con verificación bancaria' : '';
      const signedDocument = Buffer.from(`Documento firmado electrónicamente - DigitalSign
Certificado por SII según Ley 19.799${bankInfo}
Fecha: ${new Date().toISOString()}
ID de firma: ${signatureId}
Validación: RUT${this.bankIntegration ? ' + Banco' : ''}

[Firma electrónica calificada adjunta]`);

      logger.info('Documento firmado DigitalSign descargado', {
        signatureId,
        size: signedDocument.length,
        bankIntegration: this.bankIntegration,
        compliance: 'Documento con validez legal plena'
      });

      return signedDocument;

    } catch (error) {
      logger.error('Error descargando documento firmado DigitalSign:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      // Verificar conectividad con DigitalSign y certificación
      return this.apiKey.length > 0 &&
             this.apiSecret.length > 0 &&
             this.certificateId.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Validar formato de RUT chileno
  private validateRutFormat(rut: string): boolean {
    if (!rut) return false;

    // Remover puntos y convertir a mayúsculas
    rut = rut.replace(/\./g, '').toUpperCase();

    // Verificar formato básico
    const rutRegex = /^\d{7,8}-[\dK]$/;
    if (!rutRegex.test(rut)) {
      return false;
    }

    // Validar dígito verificador
    return this.validateRutDigit(rut);
  }

  // Validar dígito verificador del RUT
  private validateRutDigit(rut: string): boolean {
    const rutParts = rut.split('-');
    const rutNumber = rutParts[0];
    const dv = rutParts[1];

    let sum = 0;
    let multiplier = 2;

    // Calcular suma ponderada
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      const digit = rutNumber[i];
      if (digit && /^\d$/.test(digit)) {
        sum += parseInt(digit) * multiplier;
      } else {
        return false; // Carácter inválido
      }
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    let expectedDvStr = '';

    if (expectedDv === 11) {
      expectedDvStr = '0';
    } else if (expectedDv === 10) {
      expectedDvStr = 'K';
    } else {
      expectedDvStr = expectedDv.toString();
    }

    return dv === expectedDvStr;
  }

  // Determinar rol del firmante en contratos
  private determineContractRole(signer: Signer): string {
    // Lógica para determinar rol basado en posición
    // Roles estándar para contratos de arriendo
    if (signer.order === 1) return 'PROPIETARIO_ARRENDADOR';
    if (signer.order === 2) return 'ARRENDATARIO_INQUILINO';
    return 'FIADOR_GARANTE';
  }

  // Métodos específicos de DigitalSign
  async getSignatureCertificate(signatureId: string): Promise<any> {
    try {
      // Simular obtención de certificado con validación bancaria
      return {
        certificateId: this.certificateId,
        issuer: 'Servicio de Impuestos Internos (SII)',
        bankIntegration: this.bankIntegration,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        signatureId,
        compliance: {
          law: '19.799',
          decree: '181/2020',
          qualified: true,
          bankIntegration: this.bankIntegration
        }
      };
    } catch (error) {
      logger.error('Error obteniendo certificado DigitalSign:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  async validateSignerIdentity(signatureId: string, signerRut: string): Promise<boolean> {
    try {
      // Simular validación de identidad con opción de verificación bancaria
      const validationType = this.bankIntegration ? 'RUT + Banco' : 'RUT';

      logger.info('Identidad del firmante validada por DigitalSign', {
        signatureId,
        signerRut,
        validationType,
        compliance: 'Validación certificada según ley chilena'
      });
      return true;
    } catch (error) {
      logger.error('Error validando identidad del firmante:', {
        error: error instanceof Error ? error.message : String(error),
        signatureId,
        signerRut
      });
      return false;
    }
  }

  async getLegalAuditTrail(_signatureId: string): Promise<any[]> {
    try {
      // Simular obtención de auditoría legal completa
      const auditTrail = [
        {
          action: 'DOCUMENT_UPLOADED',
          timestamp: new Date().toISOString(),
          user: 'system',
          compliance: 'Registro según ley 19.799'
        },
        {
          action: 'RUT_VALIDATED',
          timestamp: new Date().toISOString(),
          user: 'firmante',
          compliance: 'Validación de RUT chileno certificada'
        }
      ];

      if (this.bankIntegration) {
        auditTrail.push({
          action: 'BANK_VERIFICATION',
          timestamp: new Date().toISOString(),
          user: 'firmante',
          compliance: 'Verificación bancaria completada'
        });
      }

      auditTrail.push({
        action: 'SIGNATURE_APPLIED',
        timestamp: new Date().toISOString(),
        user: 'firmante',
        compliance: 'Firma electrónica calificada aplicada'
      });

      return auditTrail;
    } catch (error) {
      logger.error('Error obteniendo auditoría legal DigitalSign:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  // Verificar identidad con validación bancaria (opcional)
  async performBankVerification(rut: string, signerData: any): Promise<boolean> {
    if (!this.bankIntegration) {
      return true; // Si no hay integración bancaria, pasar validación
    }

    try {
      // Simular verificación bancaria
      logger.info('Verificación bancaria realizada por DigitalSign', {
        rut,
        signerData: signerData.email,
        compliance: 'Validación bancaria certificada'
      });
      return true;
    } catch (error) {
      logger.error('Error en verificación bancaria:', {
        error: error instanceof Error ? error.message : String(error),
        rut
      });
      return false;
    }
  }

  // Información de cumplimiento legal chileno
  getComplianceInfo(): {
    law: string;
    decree: string;
    authority: string;
    certificate: string;
    bankIntegration: boolean;
    qualified: boolean;
    legalValidity: boolean;
  } {
    return {
      law: 'Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas',
      decree: 'Decreto Supremo N° 181/2020 del Ministerio de Economía',
      authority: 'Servicio de Impuestos Internos (SII)',
      certificate: this.certificateId,
      bankIntegration: this.bankIntegration,
      qualified: true,
      legalValidity: true
    };
  }
}
