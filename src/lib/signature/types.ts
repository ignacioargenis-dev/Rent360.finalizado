// Tipos de firma electrónica según legislación chilena
export enum SignatureType {
  ADVANCED = 'advanced',      // Firma electrónica avanzada
  QUALIFIED = 'qualified'     // Firma electrónica calificada
}

// Estados de firma
export enum SignatureStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Interfaces
export interface SignatureRequest {
  id: string;
  documentId: string;
  documentName: string;
  documentHash: string;
  signers: Signer[];
  type: SignatureType;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface Signer {
  id: string;
  email: string;
  name: string;
  rut?: string;
  phone?: string;
  order?: number;
  isRequired?: boolean;
}

export interface SignatureResult {
  success: boolean;
  signatureId?: string;
  status: SignatureStatus;
  message: string;
  provider: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// SignatureProvider se define en signature.ts para evitar conflictos

// Información de cumplimiento legal chileno
export interface LegalCompliance {
  law_19799: boolean;        // Ley 19.799 sobre Documentos Electrónicos
  decree_181_2020: boolean;  // Decreto Supremo N° 181/2020
  sii_certified: boolean;    // Certificado por Servicio de Impuestos Internos
  qualified_signature: boolean; // Firma electrónica calificada
  legal_validity: boolean;   // Validez jurídica plena en Chile
  international_recognition: boolean; // Reconocimiento internacional
}

// Configuración de proveedores
export interface ProviderConfig {
  // Proveedores no autorizados (desactivados por cumplimiento legal)
  docusign: {
    apiKey: string;
    accountId: string;
    baseUrl: string;
    enabled: boolean;
  };
  adobesign: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    baseUrl: string;
    enabled: boolean;
  };
  hellosign: {
    apiKey: string;
    baseUrl: string;
    enabled: boolean;
  };
  // Proveedores autorizados por SII (cumplen Ley 19.799)
  trustfactory: {
    apiKey: string;
    apiSecret: string;
    certificateId: string;
    baseUrl: string;
    enabled: boolean;
  };
  firmapro: {
    apiKey: string;
    apiSecret: string;
    certificateId: string;
    baseUrl: string;
    enabled: boolean;
  };
  digitalsign: {
    apiKey: string;
    apiSecret: string;
    certificateId: string;
    bankIntegration: boolean;
    baseUrl: string;
    enabled: boolean;
  };
}

// Documento de firma
export interface SignatureDocument {
  id: string;
  title: string;
  type: 'contract' | 'agreement' | 'receipt' | 'form' | 'other';
  content: string;
  hash: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Solicitud de firma
export interface SignatureRequestRecord {
  id: string;
  documentId: string;
  provider: string;
  status: SignatureStatus;
  signers: Signer[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  metadata?: Record<string, any>;
}

// Historial de firma
export interface SignatureHistory {
  id: string;
  signatureRequestId: string;
  action: 'created' | 'sent' | 'viewed' | 'signed' | 'cancelled' | 'expired';
  userId?: string;
  userEmail?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
