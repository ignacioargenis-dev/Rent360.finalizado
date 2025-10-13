import { logger } from '@/lib/logger-minimal';

/**
 * Tipos de garantía disponibles
 */
export enum GuaranteeType {
  LABOR = 'LABOR', // Garantía de mano de obra
  MATERIALS = 'MATERIALS', // Garantía de materiales
  FULL_SERVICE = 'FULL_SERVICE', // Garantía completa
  EXTENDED = 'EXTENDED' // Garantía extendida
}

/**
 * Estados de una garantía
 */
export enum GuaranteeStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CLAIMED = 'CLAIMED',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED'
}

/**
 * Estados de una reclamación
 */
export enum ClaimStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

/**
 * Garantía asociada a un trabajo
 */
export interface ServiceGuarantee {
  id: string;
  jobId: string;
  providerId: string;
  clientId: string;
  serviceType: string;
  guaranteeType: GuaranteeType;
  coverage: string[]; // Qué cubre la garantía
  exclusions: string[]; // Qué no cubre
  duration: number; // duración en meses
  startDate: Date;
  endDate: Date;
  status: GuaranteeStatus;
  terms: string;
  price: number; // costo adicional por garantía
  isIncluded: boolean; // si viene incluida en el precio base
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reclamación de garantía
 */
export interface GuaranteeClaim {
  id: string;
  guaranteeId: string;
  jobId: string;
  clientId: string;
  providerId: string;
  issue: string;
  description: string;
  photos: string[];
  status: ClaimStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedResolutionTime: number; // días
  resolutionNotes?: string;
  resolutionPhotos?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

/**
 * Resolución de reclamación
 */
export interface ClaimResolution {
  claimId: string;
  resolutionType: 'REPAIR' | 'REPLACE' | 'REFUND' | 'CREDIT';
  resolutionDetails: string;
  estimatedCost: number;
  approvedBy: string;
  approvedAt: Date;
  scheduledDate?: Date;
  completedAt?: Date;
}

/**
 * Servicio de gestión de garantías
 */
export class GuaranteeService {
  private static instance: GuaranteeService;
  private guarantees: Map<string, ServiceGuarantee> = new Map();
  private claims: Map<string, GuaranteeClaim> = new Map();
  private resolutions: Map<string, ClaimResolution> = new Map();

  private constructor() {
    this.initializeMockData();
    this.startExpiryChecker();
  }

  static getInstance(): GuaranteeService {
    if (!GuaranteeService.instance) {
      GuaranteeService.instance = new GuaranteeService();
    }
    return GuaranteeService.instance;
  }

  /**
   * Crea una garantía para un trabajo
   */
  async createGuarantee(guaranteeData: Omit<ServiceGuarantee, 'id' | 'createdAt' | 'updatedAt' | 'endDate' | 'status'>): Promise<ServiceGuarantee> {
    try {
      const guaranteeId = this.generateGuaranteeId();
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + guaranteeData.duration);

      const guarantee: ServiceGuarantee = {
        ...guaranteeData,
        id: guaranteeId,
        createdAt: now,
        updatedAt: now,
        endDate,
        status: GuaranteeStatus.ACTIVE
      };

      this.guarantees.set(guaranteeId, guarantee);

      logger.info('Garantía creada:', {
        guaranteeId,
        jobId: guaranteeData.jobId,
        type: guaranteeData.guaranteeType,
        duration: guaranteeData.duration
      });

      return guarantee;
    } catch (error) {
      logger.error('Error creando garantía', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene garantías de un cliente
   */
  async getClientGuarantees(clientId: string): Promise<ServiceGuarantee[]> {
    const clientGuarantees: ServiceGuarantee[] = [];

    for (const [guaranteeId, guarantee] of this.guarantees) {
      if (guarantee.clientId === clientId) {
        clientGuarantees.push(guarantee);
      }
    }

    return clientGuarantees.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtiene garantías de un proveedor
   */
  async getProviderGuarantees(providerId: string): Promise<ServiceGuarantee[]> {
    const providerGuarantees: ServiceGuarantee[] = [];

    for (const [guaranteeId, guarantee] of this.guarantees) {
      if (guarantee.providerId === providerId) {
        providerGuarantees.push(guarantee);
      }
    }

    return providerGuarantees.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtiene garantía por ID de trabajo
   */
  async getGuaranteeByJobId(jobId: string): Promise<ServiceGuarantee | null> {
    for (const [guaranteeId, guarantee] of this.guarantees) {
      if (guarantee.jobId === jobId) {
        return guarantee;
      }
    }
    return null;
  }

  /**
   * Verifica si una garantía está activa
   */
  async isGuaranteeActive(guaranteeId: string): Promise<boolean> {
    const guarantee = this.guarantees.get(guaranteeId);
    if (!guarantee) return false;

    const now = new Date();
    return guarantee.status === GuaranteeStatus.ACTIVE && guarantee.endDate > now;
  }

  /**
   * Crea una reclamación de garantía
   */
  async createClaim(claimData: Omit<GuaranteeClaim, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<GuaranteeClaim> {
    try {
      // Verificar que la garantía existe y está activa
      const guarantee = this.guarantees.get(claimData.guaranteeId);
      if (!guarantee) {
        throw new Error('Garantía no encontrada');
      }

      const isActive = await this.isGuaranteeActive(claimData.guaranteeId);
      if (!isActive) {
        throw new Error('La garantía no está activa o ha expirado');
      }

      // Verificar que el cliente es el propietario de la garantía
      if (guarantee.clientId !== claimData.clientId) {
        throw new Error('No tienes permiso para hacer reclamaciones en esta garantía');
      }

      const claimId = this.generateClaimId();
      const now = new Date();

      const claim: GuaranteeClaim = {
        ...claimData,
        id: claimId,
        createdAt: now,
        updatedAt: now,
        status: ClaimStatus.PENDING,
        priority: this.determinePriority(claimData.issue)
      };

      this.claims.set(claimId, claim);

      // Notificar al proveedor
      await this.notifyProviderOfClaim(claim, guarantee);

      logger.info('Reclamación de garantía creada:', {
        claimId,
        guaranteeId: claimData.guaranteeId,
        priority: claim.priority
      });

      return claim;
    } catch (error) {
      logger.error('Error creando reclamación', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Determina la prioridad de una reclamación basada en el problema
   */
  private determinePriority(issue: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const urgentKeywords = ['agua', 'eléctrico', 'incendio', 'seguridad', 'roto', 'daño'];
    const highKeywords = ['fuga', 'cortocircuito', 'caída', 'rotura'];
    const mediumKeywords = ['funciona', 'ruidoso', 'sucio', 'mancha'];

    const lowerIssue = issue.toLowerCase();

    if (urgentKeywords.some(keyword => lowerIssue.includes(keyword))) {
      return 'URGENT';
    }
    if (highKeywords.some(keyword => lowerIssue.includes(keyword))) {
      return 'HIGH';
    }
    if (mediumKeywords.some(keyword => lowerIssue.includes(keyword))) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Actualiza el estado de una reclamación
   */
  async updateClaimStatus(
    claimId: string,
    newStatus: ClaimStatus,
    notes?: string,
    updatedBy?: string
  ): Promise<GuaranteeClaim> {
    try {
      const claim = this.claims.get(claimId);
      if (!claim) {
        throw new Error('Reclamación no encontrada');
      }

      claim.status = newStatus;
      claim.updatedAt = new Date();

      if (notes) {
        claim.resolutionNotes = notes;
      }

      if (newStatus === ClaimStatus.COMPLETED) {
        claim.resolvedAt = new Date();
      }

      logger.info('Estado de reclamación actualizado:', {
        claimId,
        newStatus,
        updatedBy
      });

      return claim;
    } catch (error) {
      logger.error('Error actualizando reclamación', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Resuelve una reclamación
   */
  async resolveClaim(
    claimId: string,
    resolution: Omit<ClaimResolution, 'approvedAt'>
  ): Promise<ClaimResolution> {
    try {
      const claim = this.claims.get(claimId);
      if (!claim) {
        throw new Error('Reclamación no encontrada');
      }

      if (claim.status !== ClaimStatus.APPROVED) {
        throw new Error('La reclamación debe estar aprobada antes de resolverla');
      }

      const resolutionData: ClaimResolution = {
        ...resolution,
        approvedAt: new Date()
      };

      this.resolutions.set(claimId, resolutionData);

      // Actualizar estado de la reclamación
      await this.updateClaimStatus(claimId, ClaimStatus.COMPLETED,
        `Resuelto mediante: ${resolution.resolutionType}`, resolution.approvedBy);

      logger.info('Reclamación resuelta:', {
        claimId,
        resolutionType: resolution.resolutionType,
        cost: resolution.estimatedCost
      });

      return resolutionData;
    } catch (error) {
      logger.error('Error resolviendo reclamación', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene reclamaciones de un cliente
   */
  async getClientClaims(clientId: string): Promise<GuaranteeClaim[]> {
    const clientClaims: GuaranteeClaim[] = [];

    for (const [claimId, claim] of this.claims) {
      if (claim.clientId === clientId) {
        clientClaims.push(claim);
      }
    }

    return clientClaims.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtiene reclamaciones de un proveedor
   */
  async getProviderClaims(providerId: string): Promise<GuaranteeClaim[]> {
    const providerClaims: GuaranteeClaim[] = [];

    for (const [claimId, claim] of this.claims) {
      if (claim.providerId === providerId) {
        providerClaims.push(claim);
      }
    }

    return providerClaims.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtiene todas las reclamaciones pendientes
   */
  async getPendingClaims(): Promise<GuaranteeClaim[]> {
    const pendingClaims: GuaranteeClaim[] = [];

    for (const [claimId, claim] of this.claims) {
      if (claim.status === ClaimStatus.PENDING || claim.status === ClaimStatus.UNDER_REVIEW) {
        pendingClaims.push(claim);
      }
    }

    return pendingClaims.sort((a, b) => {
      // Ordenar por prioridad primero
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Luego por fecha de creación
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Obtiene estadísticas de garantías
   */
  async getGuaranteeStats(): Promise<{
    totalGuarantees: number;
    activeGuarantees: number;
    expiredGuarantees: number;
    claimedGuarantees: number;
    totalClaims: number;
    resolvedClaims: number;
    averageResolutionTime: number;
    claimRate: number;
  }> {
    const guarantees = Array.from(this.guarantees.values());
    const claims = Array.from(this.claims.values());

    const activeGuarantees = guarantees.filter(g => g.status === GuaranteeStatus.ACTIVE).length;
    const expiredGuarantees = guarantees.filter(g => g.status === GuaranteeStatus.EXPIRED).length;
    const claimedGuarantees = guarantees.filter(g => g.status === GuaranteeStatus.CLAIMED).length;

    const resolvedClaims = claims.filter(c => c.status === ClaimStatus.COMPLETED);
    const averageResolutionTime = resolvedClaims.length > 0
      ? resolvedClaims.reduce((sum, c) =>
          sum + (c.resolvedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0
        ) / resolvedClaims.length
      : 0;

    const claimRate = guarantees.length > 0 ? (claims.length / guarantees.length) * 100 : 0;

    return {
      totalGuarantees: guarantees.length,
      activeGuarantees,
      expiredGuarantees,
      claimedGuarantees,
      totalClaims: claims.length,
      resolvedClaims: resolvedClaims.length,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      claimRate: Math.round(claimRate * 10) / 10
    };
  }

  /**
   * Notifica al proveedor sobre una nueva reclamación
   */
  private async notifyProviderOfClaim(claim: GuaranteeClaim, guarantee: ServiceGuarantee): Promise<void> {
    logger.info('Notificación enviada al proveedor:', {
      providerId: claim.providerId,
      claimId: claim.id,
      priority: claim.priority
    });
    // En implementación real, enviar email/push notification
  }

  /**
   * Verifica y expira garantías vencidas
   */
  private async checkExpiredGuarantees(): Promise<void> {
    try {
      const now = new Date();
      let expiredCount = 0;

      for (const [guaranteeId, guarantee] of this.guarantees) {
        if (guarantee.status === GuaranteeStatus.ACTIVE && guarantee.endDate < now) {
          guarantee.status = GuaranteeStatus.EXPIRED;
          guarantee.updatedAt = new Date();
          expiredCount++;

          logger.info('Garantía expirada:', { guaranteeId });
        }
      }

      if (expiredCount > 0) {
        logger.info(`Garantías expiradas: ${expiredCount}`);
      }
    } catch (error) {
      logger.error('Error verificando garantías expiradas', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Inicia el verificador de expiraciones
   */
  private startExpiryChecker(): void {
    // Verificar cada 24 horas
    setInterval(() => {
      this.checkExpiredGuarantees();
    }, 24 * 60 * 60 * 1000);

    logger.info('Verificador de expiraciones de garantías iniciado');
  }

  /**
   * Genera ID único para garantía
   */
  private generateGuaranteeId(): string {
    return `guarantee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera ID único para reclamación
   */
  private generateClaimId(): string {
    return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicializa datos de ejemplo
   */
  private initializeMockData(): void {
    const mockGuarantees: ServiceGuarantee[] = [
      {
        id: 'guarantee_001',
        jobId: 'job_001',
        providerId: 'prov_001',
        clientId: 'user_001',
        serviceType: 'plomeria',
        guaranteeType: GuaranteeType.LABOR,
        coverage: ['reparaciones por fugas', 'ajustes de grifería', 'mantenimiento de tuberías'],
        exclusions: ['daños por congelamiento', 'problemas estructurales', 'reemplazo completo'],
        duration: 6,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-07-15'),
        status: GuaranteeStatus.ACTIVE,
        terms: 'Garantía de mano de obra por 6 meses',
        price: 0,
        isIncluded: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'guarantee_002',
        jobId: 'job_002',
        providerId: 'prov_002',
        clientId: 'user_002',
        serviceType: 'electricidad',
        guaranteeType: GuaranteeType.FULL_SERVICE,
        coverage: ['instalaciones eléctricas', 'reparaciones', 'materiales'],
        exclusions: ['daños por sobrecarga', 'problemas de red externa'],
        duration: 12,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2025-01-10'),
        status: GuaranteeStatus.ACTIVE,
        terms: 'Garantía completa por 12 meses',
        price: 5000,
        isIncluded: false,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      }
    ];

    const mockClaims: GuaranteeClaim[] = [
      {
        id: 'claim_001',
        guaranteeId: 'guarantee_001',
        jobId: 'job_001',
        clientId: 'user_001',
        providerId: 'prov_001',
        issue: 'Fuga en grifería reparada',
        description: 'El grifo de la cocina presenta fuga nuevamente',
        photos: ['photo1.jpg', 'photo2.jpg'],
        status: ClaimStatus.PENDING,
        priority: 'MEDIUM',
        estimatedResolutionTime: 3,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      }
    ];

    mockGuarantees.forEach(guarantee => {
      this.guarantees.set(guarantee.id, guarantee);
    });

    mockClaims.forEach(claim => {
      this.claims.set(claim.id, claim);
    });

    logger.info(`Datos de garantías inicializados: ${mockGuarantees.length} garantías, ${mockClaims.length} reclamaciones`);
  }
}

/**
 * Instancia global del servicio de garantías
 */
export const guaranteeService = GuaranteeService.getInstance();
