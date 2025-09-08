import { logger } from '../../logger';
import { SignatureRequest, SignatureStatus, SignatureType, SignatureResult } from '../types';

export abstract class SignatureProvider {
  public name: string;
  protected type: SignatureType;
  protected isEnabled: boolean;
  protected priority: number;
  protected config: Record<string, any>;

  constructor(name: string, type: SignatureType, config: Record<string, any> = {}) {
    this.name = name;
    this.type = type;
    this.isEnabled = config.enabled !== false;
    this.priority = config.priority || 1;
    this.config = config;
  }

  abstract createSignatureRequest(documentId: string, signers: Array<{ email: string; name: string; role?: string }>): Promise<SignatureResult>;
  abstract getSignatureStatus(signatureId: string): Promise<SignatureStatus>;
  abstract cancelSignatureRequest(signatureId: string): Promise<void>;
  abstract downloadSignedDocument(signatureId: string): Promise<Buffer | null>;

  // Métodos comunes
  async validateRequest(request: SignatureRequest): Promise<boolean> {
    try {
      if (!request.documentId || !request.documentName) {
        throw new Error('Document ID y nombre son requeridos');
      }

      if (!request.signers || request.signers.length === 0) {
        throw new Error('Al menos un firmante es requerido');
      }

      if (!request.expiresAt || new Date(request.expiresAt) <= new Date()) {
        throw new Error('Fecha de expiración debe ser futura');
      }

      return true;
    } catch (error) {
      logger.error('Error validando solicitud de firma:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Verificar conectividad con el proveedor
      const response = await this.healthCheck();
      return response && this.isEnabled;
    } catch (error) {
      logger.error(`Proveedor ${this.name} no disponible:`, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  protected abstract healthCheck(): Promise<boolean>;

  getName(): string {
    return this.name;
  }

  getType(): SignatureType {
    return this.type;
  }

  getPriority(): number {
    return this.priority;
  }

  isProviderEnabled(): boolean {
    return this.isEnabled;
  }

  getConfig(): Record<string, any> {
    return this.config;
  }

  updateConfig(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig };
    this.isEnabled = this.config.enabled !== false;
    this.priority = this.config.priority || this.priority;
  }
}
