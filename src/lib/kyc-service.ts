import { db } from './db';
import { logger } from '../lib/logger';
import { DatabaseError, ValidationError, BusinessLogicError } from './errors';

/**
 * Estado de verificación KYC
 */
export enum KYCStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REQUIRES_UPDATE = 'requires_update'
}

/**
 * Nivel de verificación KYC
 */
export enum KYCLevel {
  BASIC = 'basic',           // Email y teléfono verificados
  INTERMEDIATE = 'intermediate', // + Documento de identidad
  ADVANCED = 'advanced',     // + Comprobante de domicilio
  PREMIUM = 'premium'        // + Video verificación
}

/**
 * Documento KYC
 */
export interface KYCDocument {
  id: string;
  userId: string;
  type: 'id_card' | 'passport' | 'drivers_license' | 'utility_bill' | 'bank_statement' | 'proof_of_address' | 'selfie' | 'video';
  status: 'pending' | 'approved' | 'rejected';
  url: string;
  fileName: string;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  metadata?: Record<string, any> | undefined;
}

/**
 * Verificación KYC
 */
export interface KYCVerification {
  id: string;
  userId: string;
  level: KYCLevel;
  status: KYCStatus;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Información personal
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    nationality: string;
    documentType: string;
    documentNumber: string;
    taxId?: string;
  };

  // Información de contacto
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };

  // Información financiera
  financialInfo?: {
    occupation: string;
    annualIncome: number;
    sourceOfFunds: string;
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountType: string;
    };
  };

  // Documentos
  documents: KYCDocument[];

  // Verificaciones realizadas
  verifications: {
    emailVerified: boolean;
    phoneVerified: boolean;
    documentVerified: boolean;
    addressVerified: boolean;
    biometricVerified?: boolean;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastReviewDate?: Date;
  reviewNotes?: string;
}

/**
 * Servicio de Know Your Customer (KYC)
 */
export class KYCService {
  /**
   * Inicia el proceso KYC para un usuario
   */
  static async initiateKYC(
    userId: string,
    level: KYCLevel = KYCLevel.BASIC
  ): Promise<{
    success: boolean;
    error?: string;
    sessionId?: string;
    requirements?: string[];
    expiresAt?: Date;
  }> {
    try {
      // Verificar si ya existe una verificación activa
      const existingKYC = await this.getActiveKYC(userId);
      if (existingKYC && existingKYC.status === KYCStatus.APPROVED) {
        throw new BusinessLogicError('Usuario ya tiene KYC aprobado');
      }

      // Obtener información básica del usuario
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          commune: true,
          rut: true
        }
      });

      if (!user) {
        throw new BusinessLogicError('Usuario no encontrado');
      }

      // Crear verificación KYC
      const kycVerification: KYCVerification = {
        id: `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        level,
        status: KYCStatus.PENDING,
        riskScore: 0,
        riskLevel: 'low',
        personalInfo: {
          firstName: user.name?.split(' ')?.[0] || 'Unknown',
          lastName: user.name?.split(' ')?.slice(1)?.join(' ') || 'User',
          dateOfBirth: new Date(), // Placeholder
          nationality: 'CL',
          documentType: 'RUT',
          documentNumber: user.rut || '',
          taxId: user.rut
        },
        contactInfo: {
          email: user.email,
          phone: user.phone || '',
          address: {
            street: user.address || '',
            city: user.city || '',
            state: user.commune || '',
            postalCode: '',
            country: 'CL'
          }
        },
        documents: [],
        verifications: {
          emailVerified: false,
          phoneVerified: false,
          documentVerified: false,
          addressVerified: false
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      };

      logger.info('Proceso KYC iniciado', {
        userId,
        kycId: kycVerification.id,
        level
      });

      return {
        success: true,
        sessionId: kycVerification.id,
        requirements: this.getRequiredDocuments(level),
        expiresAt: kycVerification.expiresAt
      };

    } catch (error) {
      logger.error('Error iniciando KYC:', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Sube un documento para verificación KYC
   */
  static async uploadDocument(
    userId: string,
    documentType: KYCDocument['type'],
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<KYCDocument> {
    try {
      // Validar tipo de documento
      if (!this.isValidDocumentType(documentType)) {
        throw new ValidationError('Tipo de documento no válido');
      }

      // Validar tamaño del archivo (máximo 10MB)
      if (fileBuffer.length > 10 * 1024 * 1024) {
        throw new ValidationError('Archivo demasiado grande. Máximo 10MB');
      }

      // Validar tipo MIME
      if (!this.isValidMimeType(mimeType, documentType)) {
        throw new ValidationError('Tipo de archivo no válido para este documento');
      }

      // Simular subida a storage (en producción usar AWS S3, etc.)
      const documentUrl = await this.uploadToStorage(fileBuffer, fileName, mimeType);

      const document: KYCDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: documentType,
        status: 'pending',
        url: documentUrl,
        fileName,
        uploadedAt: new Date()
      };

      logger.info('Documento KYC subido', {
        userId,
        documentId: document.id,
        type: documentType,
        fileName
      });

      return document;

    } catch (error) {
      logger.error('Error subiendo documento KYC', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Verifica la información KYC
   */
  static async verifyKYC(
    kycId: string,
    reviewerId?: string
  ): Promise<{
    approved: boolean;
    status: KYCStatus;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reviewNotes?: string;
  }> {
    try {
      const kyc = await this.getKYCById(kycId);
      if (!kyc) {
        throw new BusinessLogicError('Verificación KYC no encontrada');
      }

      // Realizar verificaciones automáticas
      const automatedChecks = await this.performAutomatedChecks(kyc);

      // Calcular score de riesgo
      const riskScore = this.calculateRiskScore(kyc, automatedChecks);

      // Determinar nivel de riesgo
      const riskLevel = this.determineRiskLevel(riskScore);

      // Verificar documentos requeridos
      const requiredDocs = this.getRequiredDocuments(kyc.level);
      const submittedDocs = kyc.documents.filter(doc => doc.status === 'approved').map(doc => doc.type);
      const hasAllRequiredDocs = requiredDocs.every(docType => submittedDocs.includes(docType));

      // Decidir aprobación
      let approved = false;
      let status = KYCStatus.REJECTED;
      let reviewNotes = '';

      if (automatedChecks.allPassed && hasAllRequiredDocs && riskLevel !== 'critical') {
        approved = true;
        status = KYCStatus.APPROVED;
        reviewNotes = 'Verificación automática exitosa';
      } else if (riskLevel === 'high' || !hasAllRequiredDocs) {
        status = KYCStatus.IN_REVIEW;
        reviewNotes = 'Requiere revisión manual';
      } else {
        reviewNotes = 'Información insuficiente o riesgo alto';
      }

      // Actualizar KYC
      kyc.status = status;
      kyc.riskScore = riskScore;
      kyc.riskLevel = riskLevel;
      kyc.lastReviewDate = new Date();
      kyc.reviewNotes = reviewNotes;
      kyc.updatedAt = new Date();

      logger.info('KYC verificado', {
        kycId,
        userId: kyc.userId,
        approved,
        status,
        riskScore,
        riskLevel,
        reviewerId
      });

      return {
        approved,
        status,
        riskScore,
        riskLevel,
        reviewNotes
      };

    } catch (error) {
      logger.error('Error verificando KYC', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Verifica email
   */
  static async verifyEmail(userId: string, verificationToken: string): Promise<boolean> {
    try {
      // Simular verificación de email
      const isValid = Math.random() > 0.05; // 95% éxito

      logger.info('Email verificado', {
        userId,
        success: isValid
      });

      return isValid;

    } catch (error) {
      logger.error('Error verificando email', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Verifica número de teléfono
   */
  static async verifyPhone(userId: string, verificationCode: string): Promise<boolean> {
    try {
      // Simular verificación de teléfono
      const isValid = verificationCode === '123456'; // Código de prueba

      logger.info('Teléfono verificado', {
        userId,
        success: isValid
      });

      return isValid;

    } catch (error) {
      logger.error('Error verificando teléfono', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Verifica documento de identidad
   */
  static async verifyDocument(
    documentId: string,
    reviewerId?: string
  ): Promise<{
    approved: boolean;
    confidence: number;
    extractedData?: Record<string, any>;
    issues?: string[];
  }> {
    try {
      // Simular verificación de documento usando OCR/AI
      await new Promise(resolve => setTimeout(resolve, 2000));

      const approved = Math.random() > 0.1; // 90% aprobación
      const confidence = approved ? 0.85 + Math.random() * 0.1 : 0.3 + Math.random() * 0.3;

      const result = {
        approved,
        confidence,
        extractedData: approved ? {
          documentNumber: '12.345.678-9',
          firstName: 'Juan',
          lastName: 'Pérez',
          dateOfBirth: '1990-01-01',
          expiryDate: '2030-01-01'
        } : undefined,
        issues: approved ? undefined : [
          'Documento borroso',
          'Información no legible'
        ]
      };

      logger.info('Documento verificado', {
        documentId,
        approved: result.approved,
        confidence: result.confidence,
        reviewerId
      });

      return result;

    } catch (error) {
      logger.error('Error verificando documento', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Verifica dirección
   */
  static async verifyAddress(
    userId: string,
    addressData: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }
  ): Promise<{
    verified: boolean;
    confidence: number;
    suggestions?: string[];
  }> {
    try {
      // Simular verificación de dirección
      await new Promise(resolve => setTimeout(resolve, 1500));

      const verified = Math.random() > 0.15; // 85% verificación exitosa
      const confidence = verified ? 0.8 + Math.random() * 0.15 : 0.4 + Math.random() * 0.3;

      const result = {
        verified,
        confidence,
        suggestions: verified ? undefined : [
          'Verificar código postal',
          'Confirmar nombre de calle'
        ]
      };

      logger.info('Dirección verificada', {
        userId,
        verified: result.verified,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      logger.error('Error verificando dirección', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene verificación KYC activa de un usuario
   */
  static async getActiveKYC(userId: string): Promise<KYCVerification | null> {
    try {
      // Simulación - en producción buscar en BD
      return null;

    } catch (error) {
      logger.error('Error obteniendo KYC activo:', error);
      return null;
    }
  }

  /**
   * Obtiene verificación KYC por ID
   */
  static async getKYCById(kycId: string): Promise<KYCVerification | null> {
    try {
      // Simulación - en producción buscar en BD
      return null;

    } catch (error) {
      logger.error('Error obteniendo KYC por ID:', error);
      return null;
    }
  }

  /**
   * Realiza verificaciones automáticas
   */
  private static async performAutomatedChecks(kyc: KYCVerification): Promise<{
    emailValid: boolean;
    phoneValid: boolean;
    documentValid: boolean;
    addressValid: boolean;
    allPassed: boolean;
  }> {
    const checks = {
      emailValid: kyc.verifications.emailVerified || Math.random() > 0.1,
      phoneValid: kyc.verifications.phoneVerified || Math.random() > 0.1,
      documentValid: kyc.verifications.documentVerified || Math.random() > 0.1,
      addressValid: kyc.verifications.addressVerified || Math.random() > 0.1,
      allPassed: false
    };

    checks.allPassed = checks.emailValid && checks.phoneValid &&
                      checks.documentValid && checks.addressValid;

    return checks;
  }

  /**
   * Calcula score de riesgo
   */
  private static calculateRiskScore(kyc: KYCVerification, checks: any): number {
    let score = 0;

    // Penalizaciones por verificaciones fallidas
    if (!checks.emailValid) score += 20;
    if (!checks.phoneValid) score += 15;
    if (!checks.documentValid) score += 30;
    if (!checks.addressValid) score += 25;

    // Penalización por información incompleta
    if (!kyc.financialInfo) score += 10;

    // Penalización por documentos faltantes
    const requiredDocs = this.getRequiredDocuments(kyc.level);
    const submittedDocs = kyc.documents.length;
    const missingDocs = requiredDocs.length - submittedDocs;
    score += missingDocs * 15;

    // Penalización por edad (asumiendo edad basada en fecha nacimiento)
    const age = new Date().getFullYear() - kyc.personalInfo.dateOfBirth.getFullYear();
    if (age < 18) score += 50;
    if (age > 65) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Determina nivel de riesgo
   */
  private static determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 20) return 'low';
    if (score <= 40) return 'medium';
    if (score <= 70) return 'high';
    return 'critical';
  }

  /**
   * Obtiene documentos requeridos por nivel
   */
  private static getRequiredDocuments(level: KYCLevel): KYCDocument['type'][] {
    const docsByLevel = {
      [KYCLevel.BASIC]: [],
      [KYCLevel.INTERMEDIATE]: ['id_card', 'selfie'],
      [KYCLevel.ADVANCED]: ['id_card', 'selfie', 'proof_of_address'],
      [KYCLevel.PREMIUM]: ['id_card', 'selfie', 'proof_of_address', 'video']
    };

    return docsByLevel[level] || [];
  }

  /**
   * Valida tipo de documento
   */
  private static isValidDocumentType(type: string): boolean {
    const validTypes = [
      'id_card', 'passport', 'drivers_license', 'utility_bill',
      'bank_statement', 'proof_of_address', 'selfie', 'video'
    ];
    return validTypes.includes(type);
  }

  /**
   * Valida tipo MIME
   */
  private static isValidMimeType(mimeType: string, documentType: string): boolean {
    const mimeTypesByDocType: Record<string, string[]> = {
      id_card: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      passport: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      drivers_license: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      utility_bill: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      bank_statement: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      proof_of_address: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      selfie: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime']
    };

    return mimeTypesByDocType[documentType]?.includes(mimeType) || false;
  }

  /**
   * Sube archivo a storage
   */
  private static async uploadToStorage(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // Simular subida a storage
    const fileId = `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = fileName.split('.').pop();
    const storageUrl = `https://storage.rent360.cl/kyc/${fileId}.${fileExtension}`;

    logger.info('Archivo subido a storage', {
      fileName,
      storageUrl,
      size: fileBuffer.length
    });

    return storageUrl;
  }

  /**
   * Verifica si el usuario cumple con requisitos KYC para payouts
   */
  static async canReceivePayouts(userId: string): Promise<{
    canReceive: boolean;
    reason?: string;
    requiredLevel: KYCLevel;
    currentLevel?: KYCLevel;
    nextSteps?: string[];
  }> {
    try {
      const kyc = await this.getActiveKYC(userId);

      const result = {
        canReceive: false,
        requiredLevel: KYCLevel.INTERMEDIATE,
        nextSteps: [] as string[]
      };

      if (!kyc) {
        result.reason = 'KYC no iniciado';
        result.nextSteps = [
          'Iniciar proceso de verificación KYC',
          'Subir documento de identidad',
          'Tomar selfie de verificación'
        ];
        return result;
      }

      result.currentLevel = kyc.level;

      if (kyc.status !== KYCStatus.APPROVED) {
        result.reason = `KYC ${kyc.status}`;
        result.nextSteps = [
          'Completar documentos requeridos',
          'Esperar aprobación de verificación'
        ];
        return result;
      }

      if (kyc.riskLevel === 'critical') {
        result.reason = 'Riesgo crítico detectado';
        result.nextSteps = [
          'Contactar soporte para revisión',
          'Proporcionar documentación adicional'
        ];
        return result;
      }

      // Verificar nivel mínimo
      if (kyc.level === KYCLevel.BASIC) {
        result.reason = 'Nivel de verificación insuficiente';
        result.nextSteps = [
          'Actualizar a verificación intermedia',
          'Subir documento de identidad',
          'Verificar dirección'
        ];
        return result;
      }

      result.canReceive = true;
      return result;

    } catch (error) {
      logger.error('Error verificando elegibilidad para payouts:', error);
      return {
        canReceive: false,
        reason: 'Error en verificación',
        requiredLevel: KYCLevel.INTERMEDIATE,
        nextSteps: ['Contactar soporte técnico']
      };
    }
  }

  /**
   * Obtiene estadísticas KYC
   */
  static async getKYCStats(): Promise<{
    totalVerifications: number;
    approvedVerifications: number;
    pendingVerifications: number;
    rejectedVerifications: number;
    averageRiskScore: number;
    byRiskLevel: Record<string, number>;
    byLevel: Record<string, number>;
  }> {
    // Simulación de estadísticas
    return {
      totalVerifications: 1250,
      approvedVerifications: 1100,
      pendingVerifications: 120,
      rejectedVerifications: 30,
      averageRiskScore: 15.5,
      byRiskLevel: {
        low: 950,
        medium: 250,
        high: 40,
        critical: 10
      },
      byLevel: {
        basic: 200,
        intermediate: 800,
        advanced: 220,
        premium: 30
      }
    };
  }
}
