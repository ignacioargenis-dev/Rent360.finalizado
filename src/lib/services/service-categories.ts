import { logger } from '@/lib/logger-edge';

/**
 * Categorías principales de servicios
 */
export enum ServiceCategory {
  MAINTENANCE = 'MAINTENANCE',
  CLEANING = 'CLEANING',
  GARDENING = 'GARDENING',
  SECURITY = 'SECURITY',
  FACILITY_MANAGEMENT = 'FACILITY_MANAGEMENT',
  SPECIALIZED_SERVICES = 'SPECIALIZED_SERVICES'
}

/**
 * Subcategorías específicas
 */
export enum ServiceSubcategory {
  // Mantenimiento
  PLUMBING = 'PLUMBING',
  ELECTRICITY = 'ELECTRICITY',
  CARPENTRY = 'CARPENTRY',
  PAINTING = 'PAINTING',
  HVAC = 'HVAC',
  APPLIANCES = 'APPLIANCES',

  // Limpieza
  HOUSE_CLEANING = 'HOUSE_CLEANING',
  OFFICE_CLEANING = 'OFFICE_CLEANING',
  WINDOW_CLEANING = 'WINDOW_CLEANING',
  CARPET_CLEANING = 'CARPET_CLEANING',
  POST_CONSTRUCTION = 'POST_CONSTRUCTION',

  // Jardinería
  LAWN_CARE = 'LAWN_CARE',
  TREE_TRIMMING = 'TREE_TRIMMING',
  LANDSCAPING = 'LANDSCAPING',
  IRRIGATION = 'IRRIGATION',
  PEST_CONTROL = 'PEST_CONTROL',

  // Seguridad
  ALARM_SYSTEMS = 'ALARM_SYSTEMS',
  CCTV_INSTALLATION = 'CCTV_INSTALLATION',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  SECURITY_PATROL = 'SECURITY_PATROL',

  // Facility Management
  BUILDING_MAINTENANCE = 'BUILDING_MAINTENANCE',
  POOL_MAINTENANCE = 'POOL_MAINTENANCE',
  ELEVATOR_MAINTENANCE = 'ELEVATOR_MAINTENANCE',
  FIRE_SYSTEMS = 'FIRE_SYSTEMS',

  // Servicios Especializados
  LOCKSMITH = 'LOCKSMITH',
  ROOFING = 'ROOFING',
  INSULATION = 'INSULATION',
  SOLAR_PANELS = 'SOLAR_PANELS',
  HOME_AUTOMATION = 'HOME_AUTOMATION'
}

/**
 * Definición de una categoría de servicio
 */
export interface ServiceCategoryDefinition {
  id: ServiceCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  subcategories: ServiceSubcategoryDefinition[];
  baseCommissionPercentage: number;
  requiresCertification: boolean;
  averageDurationHours: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Definición de subcategoría
 */
export interface ServiceSubcategoryDefinition {
  id: ServiceSubcategory;
  name: string;
  description: string;
  skills: string[];
  tools: string[];
  materials: string[];
  averagePrice: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDurationHours: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  certifications: string[];
}

/**
 * Servicio de gestión de categorías
 */
export class ServiceCategoriesService {
  private static instance: ServiceCategoriesService;
  private categories: Map<ServiceCategory, ServiceCategoryDefinition> = new Map();

  private constructor() {
    this.initializeCategories();
  }

  static getInstance(): ServiceCategoriesService {
    if (!ServiceCategoriesService.instance) {
      ServiceCategoriesService.instance = new ServiceCategoriesService();
    }
    return ServiceCategoriesService.instance;
  }

  /**
   * Inicializa todas las categorías de servicios
   */
  private initializeCategories(): void {
    const categoriesData: ServiceCategoryDefinition[] = [
      {
        id: ServiceCategory.MAINTENANCE,
        name: 'Mantenimiento General',
        description: 'Reparaciones y mantenimiento de sistemas básicos de la propiedad',
        icon: '🔧',
        color: '#3B82F6',
        baseCommissionPercentage: 10,
        requiresCertification: false,
        averageDurationHours: 2,
        complexity: 'MEDIUM',
        subcategories: [
          {
            id: ServiceSubcategory.PLUMBING,
            name: 'Plomería',
            description: 'Reparaciones de grifería, tuberías y sistemas de agua',
            skills: ['fontanería', 'soldadura', 'presurización'],
            tools: ['llaves inglesas', 'soldador', 'caño cortador'],
            materials: ['caños', 'grifería', 'selladores'],
            averagePrice: { min: 15000, max: 80000, currency: 'CLP' },
            estimatedDurationHours: 1.5,
            difficulty: 'INTERMEDIATE',
            certifications: []
          },
          {
            id: ServiceSubcategory.ELECTRICITY,
            name: 'Electricidad',
            description: 'Instalaciones y reparaciones eléctricas',
            skills: ['electricidad', 'circuitos', 'seguridad eléctrica'],
            tools: ['multímetro', 'alicates', 'cinta aislante'],
            materials: ['cables', 'tomacorrientes', 'interruptores'],
            averagePrice: { min: 20000, max: 100000, currency: 'CLP' },
            estimatedDurationHours: 2,
            difficulty: 'ADVANCED',
            certifications: ['certificación eléctrica']
          }
        ]
      },
      {
        id: ServiceCategory.CLEANING,
        name: 'Limpieza y Organización',
        description: 'Servicios de limpieza residencial y comercial',
        icon: '🧹',
        color: '#10B981',
        baseCommissionPercentage: 8,
        requiresCertification: false,
        averageDurationHours: 3,
        complexity: 'LOW',
        subcategories: [
          {
            id: ServiceSubcategory.HOUSE_CLEANING,
            name: 'Limpieza de Hogar',
            description: 'Limpieza completa de espacios residenciales',
            skills: ['limpieza profunda', 'organización', 'productos de limpieza'],
            tools: ['aspiradora', 'trapo', 'productos de limpieza'],
            materials: ['detergentes', 'desinfectantes'],
            averagePrice: { min: 25000, max: 60000, currency: 'CLP' },
            estimatedDurationHours: 3,
            difficulty: 'BEGINNER',
            certifications: []
          },
          {
            id: ServiceSubcategory.POST_CONSTRUCTION,
            name: 'Limpieza Post-Obra',
            description: 'Limpieza especializada después de construcciones o remodelaciones',
            skills: ['limpieza industrial', 'manejo de residuos', 'seguridad'],
            tools: ['aspiradora industrial', 'hidrolavadora', 'equipos de protección'],
            materials: ['productos especializados', 'bolsas de residuos'],
            averagePrice: { min: 40000, max: 120000, currency: 'CLP' },
            estimatedDurationHours: 4,
            difficulty: 'INTERMEDIATE',
            certifications: []
          }
        ]
      },
      {
        id: ServiceCategory.GARDENING,
        name: 'Jardinería y Paisajismo',
        description: 'Mantenimiento de jardines y áreas verdes',
        icon: '🌱',
        color: '#22C55E',
        baseCommissionPercentage: 12,
        requiresCertification: false,
        averageDurationHours: 4,
        complexity: 'MEDIUM',
        subcategories: [
          {
            id: ServiceSubcategory.LAWN_CARE,
            name: 'Cuidado de Césped',
            description: 'Corte, fertilización y mantenimiento de césped',
            skills: ['jardinería', 'mantenimiento de equipos', 'fertilización'],
            tools: ['cortacésped', 'podadora', 'fertilizante'],
            materials: ['fertilizantes', 'semillas'],
            averagePrice: { min: 20000, max: 50000, currency: 'CLP' },
            estimatedDurationHours: 2,
            difficulty: 'BEGINNER',
            certifications: []
          },
          {
            id: ServiceSubcategory.PEST_CONTROL,
            name: 'Control de Plagas',
            description: 'Control y eliminación de plagas en jardín y hogar',
            skills: ['identificación de plagas', 'aplicación de productos', 'seguridad'],
            tools: ['equipos de fumigación', 'equipos de protección'],
            materials: ['insecticidas', 'raticidas'],
            averagePrice: { min: 30000, max: 80000, currency: 'CLP' },
            estimatedDurationHours: 3,
            difficulty: 'ADVANCED',
            certifications: ['certificación en control de plagas']
          }
        ]
      },
      {
        id: ServiceCategory.SECURITY,
        name: 'Seguridad y Vigilancia',
        description: 'Sistemas de seguridad y vigilancia',
        icon: '🔒',
        color: '#EF4444',
        baseCommissionPercentage: 15,
        requiresCertification: true,
        averageDurationHours: 6,
        complexity: 'HIGH',
        subcategories: [
          {
            id: ServiceSubcategory.ALARM_SYSTEMS,
            name: 'Sistemas de Alarma',
            description: 'Instalación y mantenimiento de sistemas de alarma',
            skills: ['electrónica', 'sistemas de seguridad', 'programación'],
            tools: ['multímetro', 'herramientas eléctricas', 'software de configuración'],
            materials: ['sensores', 'panel de control', 'cables'],
            averagePrice: { min: 100000, max: 500000, currency: 'CLP' },
            estimatedDurationHours: 6,
            difficulty: 'EXPERT',
            certifications: ['certificación de seguridad', 'certificación técnica']
          }
        ]
      },
      {
        id: ServiceCategory.FACILITY_MANAGEMENT,
        name: 'Gestión de Instalaciones',
        description: 'Mantenimiento de instalaciones complejas',
        icon: '🏢',
        color: '#8B5CF6',
        baseCommissionPercentage: 13,
        requiresCertification: true,
        averageDurationHours: 8,
        complexity: 'HIGH',
        subcategories: [
          {
            id: ServiceSubcategory.POOL_MAINTENANCE,
            name: 'Mantenimiento de Piscinas',
            description: 'Limpieza y mantenimiento de piscinas',
            skills: ['tratamiento de agua', 'filtración', 'reparaciones'],
            tools: ['equipos de limpieza', 'productos químicos', 'herramientas'],
            materials: ['cloro', 'productos de mantenimiento'],
            averagePrice: { min: 35000, max: 90000, currency: 'CLP' },
            estimatedDurationHours: 3,
            difficulty: 'INTERMEDIATE',
            certifications: ['certificación en tratamiento de aguas']
          }
        ]
      },
      {
        id: ServiceCategory.SPECIALIZED_SERVICES,
        name: 'Servicios Especializados',
        description: 'Servicios técnicos especializados',
        icon: '⚡',
        color: '#F59E0B',
        baseCommissionPercentage: 14,
        requiresCertification: true,
        averageDurationHours: 5,
        complexity: 'HIGH',
        subcategories: [
          {
            id: ServiceSubcategory.SOLAR_PANELS,
            name: 'Paneles Solares',
            description: 'Instalación y mantenimiento de sistemas solares',
            skills: ['electricidad', 'energías renovables', 'estructuras'],
            tools: ['herramientas eléctricas', 'equipos de medición', 'software de diseño'],
            materials: ['paneles solares', 'inversores', 'baterías'],
            averagePrice: { min: 200000, max: 2000000, currency: 'CLP' },
            estimatedDurationHours: 8,
            difficulty: 'EXPERT',
            certifications: ['certificación en energías renovables', 'certificación eléctrica']
          }
        ]
      }
    ];

    categoriesData.forEach(category => {
      this.categories.set(category.id, category);
    });

    logger.info(`Categorías de servicios inicializadas: ${categoriesData.length} categorías`);
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  getAllCategories(): ServiceCategoryDefinition[] {
    return Array.from(this.categories.values());
  }

  /**
   * Obtiene una categoría específica
   */
  getCategory(categoryId: ServiceCategory): ServiceCategoryDefinition | null {
    return this.categories.get(categoryId) || null;
  }

  /**
   * Obtiene subcategorías de una categoría
   */
  getSubcategories(categoryId: ServiceCategory): ServiceSubcategoryDefinition[] {
    const category = this.categories.get(categoryId);
    return category ? category.subcategories : [];
  }

  /**
   * Busca subcategorías por nombre o descripción
   */
  searchSubcategories(query: string): ServiceSubcategoryDefinition[] {
    const results: ServiceSubcategoryDefinition[] = [];
    const lowerQuery = query.toLowerCase();

    for (const category of this.categories.values()) {
      for (const subcategory of category.subcategories) {
        if (
          subcategory.name.toLowerCase().includes(lowerQuery) ||
          subcategory.description.toLowerCase().includes(lowerQuery) ||
          subcategory.skills.some(skill => skill.toLowerCase().includes(lowerQuery))
        ) {
          results.push(subcategory);
        }
      }
    }

    return results;
  }

  /**
   * Calcula comisión para un servicio específico
   */
  calculateCommission(
    categoryId: ServiceCategory,
    subcategoryId: ServiceSubcategory,
    basePrice: number,
    providerExperience?: number
  ): number {
    const category = this.categories.get(categoryId);
    if (!category) return 0;

    let commissionPercentage = category.baseCommissionPercentage;

    // Ajustar por experiencia del proveedor
    if (providerExperience) {
      if (providerExperience > 50) commissionPercentage *= 0.9; // 10% descuento
      else if (providerExperience > 20) commissionPercentage *= 0.95; // 5% descuento
    }

    return (basePrice * commissionPercentage) / 100;
  }

  /**
   * Valida si un proveedor puede ofrecer un servicio
   */
  validateProviderForService(
    providerSkills: string[],
    subcategoryId: ServiceSubcategory
  ): { valid: boolean; missingSkills: string[]; requiresCertification: boolean } {
    const subcategory = this.findSubcategory(subcategoryId);
    if (!subcategory) {
      return { valid: false, missingSkills: [], requiresCertification: false };
    }

    const missingSkills = subcategory.skills.filter(
      skill => !providerSkills.includes(skill)
    );

    return {
      valid: missingSkills.length === 0,
      missingSkills,
      requiresCertification: subcategory.certifications.length > 0
    };
  }

  /**
   * Encuentra subcategoría por ID
   */
  private findSubcategory(subcategoryId: ServiceSubcategory): ServiceSubcategoryDefinition | null {
    for (const category of this.categories.values()) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory) return subcategory;
    }
    return null;
  }

  /**
   * Obtiene estadísticas de categorías
   */
  getCategoryStats(): {
    totalCategories: number;
    totalSubcategories: number;
    categoriesByComplexity: Record<string, number>;
    averagePrices: Record<ServiceCategory, { min: number; max: number }>;
  } {
    const categories = Array.from(this.categories.values());
    const totalSubcategories = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0);

    const complexityCount = categories.reduce((acc, cat) => {
      acc[cat.complexity] = (acc[cat.complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averagePrices = categories.reduce((acc, cat) => {
      const prices = cat.subcategories.map(sub => sub.averagePrice);
      const minPrice = Math.min(...prices.map(p => p.min));
      const maxPrice = Math.max(...prices.map(p => p.max));
      acc[cat.id] = { min: minPrice, max: maxPrice };
      return acc;
    }, {} as Record<ServiceCategory, { min: number; max: number }>);

    return {
      totalCategories: categories.length,
      totalSubcategories,
      categoriesByComplexity: complexityCount,
      averagePrices
    };
  }

  /**
   * Sugiere categorías basadas en habilidades del proveedor
   */
  suggestCategoriesForProvider(providerSkills: string[]): ServiceCategory[] {
    const suggestedCategories = new Set<ServiceCategory>();

    for (const [categoryId, category] of this.categories) {
      const matchingSkills = category.subcategories.some(subcategory =>
        subcategory.skills.some(skill => providerSkills.includes(skill))
      );

      if (matchingSkills) {
        suggestedCategories.add(categoryId);
      }
    }

    return Array.from(suggestedCategories);
  }

  /**
   * Obtiene servicios populares en una zona
   */
  getPopularServicesByLocation(location: string): ServiceSubcategoryDefinition[] {
    // En implementación real, esto usaría datos históricos de la zona
    // Por ahora, retornamos subcategorías de mantenimiento general
    const maintenanceCategory = this.categories.get(ServiceCategory.MAINTENANCE);
    return maintenanceCategory ? maintenanceCategory.subcategories : [];
  }
}

/**
 * Instancia global del servicio de categorías
 */
export const serviceCategoriesService = ServiceCategoriesService.getInstance();
