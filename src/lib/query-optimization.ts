import { db } from './db';
import { logger } from './logger';
import { withCache, CacheKeys, USER_STATS_TTL } from './cache';

// Optimizaciones para consultas de usuarios
export class UserQueries {
  // Obtener usuario con todas las relaciones necesarias para el dashboard
  static async getUserWithStats(userId: string) {
    const cacheKey = CacheKeys.USER_STATS(userId);

    return withCache(
      cacheKey,
      async () => {
        logger.debug('Consultando estadísticas de usuario', { userId });

        const user = await db.user.findUnique({
          where: { id: userId },
          include: {
            properties: {
              select: {
                id: true,
                status: true,
                price: true,
                city: true,
                commune: true
              }
            },
            contractsAsOwner: {
              select: {
                id: true,
                status: true,
                monthlyRent: true,
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            contractsAsTenant: {
              select: {
                id: true,
                status: true,
                monthlyRent: true,
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                    owner: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                dueDate: true
              },
              orderBy: { dueDate: 'desc' },
              take: 5
            }
          }
        });

        if (!user) return null;

        // Calcular estadísticas
        const stats = {
          totalProperties: user.properties.length,
          activeProperties: user.properties.filter(p => p.status === 'AVAILABLE').length,
          rentedProperties: user.properties.filter(p => p.status === 'RENTED').length,
          totalContracts: user.contractsAsOwner.length + user.contractsAsTenant.length,
          activeContracts: [
            ...user.contractsAsOwner.filter(c => c.status === 'ACTIVE'),
            ...user.contractsAsTenant.filter(c => c.status === 'ACTIVE')
          ].length,
          pendingPayments: user.payments.filter(p => p.status === 'PENDING').length,
          totalRevenue: user.contractsAsOwner
            .filter(c => c.status === 'ACTIVE')
            .reduce((sum, c) => sum + c.monthlyRent, 0)
        };

        return {
          ...user,
          stats
        };
      },
      USER_STATS_TTL
    );
  }

  // Obtener lista de usuarios con filtros optimizados
  static async getUsersWithFilters(filters: {
    role?: string;
    isActive?: boolean;
    city?: string;
    commune?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      role,
      isActive,
      city,
      commune,
      limit = 50,
      offset = 0
    } = filters;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (city) where.city = city;
    if (commune) where.commune = commune;

    // Usar índices compuestos para mejor performance
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        city: true,
        commune: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Obtener total para paginación
    const total = await db.user.count({ where });

    return {
      users,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };
  }
}

// Optimizaciones para consultas de propiedades
export class PropertyQueries {
  // Obtener propiedades con filtros y paginación optimizada
  static async getPropertiesWithFilters(filters: {
    ownerId?: string;
    status?: string;
    city?: string;
    commune?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      ownerId,
      status,
      city,
      commune,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      type,
      limit = 20,
      offset = 0
    } = filters;

    const where: any = {};
    if (ownerId) where.ownerId = ownerId;
    if (status) where.status = status;
    if (city) where.city = city;
    if (commune) where.commune = commune;
    if (type) where.type = type;

    // Filtros de rango
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    if (minArea || maxArea) {
      where.area = {};
      if (minArea) where.area.gte = minArea;
      if (maxArea) where.area.lte = maxArea;
    }

    // Consulta optimizada con índices
    const properties = await db.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        _count: {
          select: {
            contracts: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await db.user.count({ where });

    return {
      properties,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };
  }

  // Obtener propiedad con todas las relaciones para vista detallada
  static async getPropertyWithDetails(propertyId: string) {
    return db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        maintenance: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            title: true,
            priority: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            contracts: true,
            reviews: true,
            visits: true
          }
        }
      }
    });
  }
}

// Optimizaciones para consultas de contratos
export class ContractQueries {
  // Obtener contratos con todas las relaciones necesarias
  static async getContractsWithDetails(filters: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, status, limit = 20, offset = 0 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (userId) {
      where.OR = [
        { ownerId: userId },
        { tenantId: userId }
      ];
    }

    const contracts = await db.contract.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            images: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payments: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            amount: true,
            dueDate: true
          },
          orderBy: { dueDate: 'asc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await db.contract.count({ where });

    return {
      contracts,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };
  }
}

// Optimizaciones para consultas de pagos
export class PaymentQueries {
  // Obtener pagos pendientes con información optimizada
  static async getPendingPayments(userId?: string, limit = 50) {
    const where: any = {
      status: 'PENDING',
      dueDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Próximos 30 días
      }
    };

    if (userId) {
      where.payerId = userId;
    }

    return db.payment.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true
              }
            },
            tenant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: limit
    });
  }

  // Obtener estadísticas de pagos
  static async getPaymentStats(userId?: string) {
    const baseWhere: any = {};
    if (userId) baseWhere.payerId = userId;

    const [totalPayments, paidPayments, pendingPayments, overduePayments] = await Promise.all([
      db.payment.count({ where: baseWhere }),
      db.payment.count({
        where: { ...baseWhere, status: 'PAID' }
      }),
      db.payment.count({
        where: { ...baseWhere, status: 'PENDING' }
      }),
      db.payment.count({
        where: {
          ...baseWhere,
          status: 'PENDING',
          dueDate: { lt: new Date() }
        }
      })
    ]);

    const totalAmount = await db.payment.aggregate({
      where: { ...baseWhere, status: 'PAID' },
      _sum: { amount: true }
    });

    return {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      overdue: overduePayments,
      totalPaidAmount: totalAmount._sum.amount || 0,
      paymentRate: totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0
    };
  }
}

// Función para pre-cargar datos comunes
export async function preloadCommonData() {
  logger.info('Pre-cargando datos comunes para optimización');

  try {
    // Pre-cargar estadísticas globales
    const globalStats = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.property.count({ where: { status: 'AVAILABLE' } }),
      db.contract.count({ where: { status: 'ACTIVE' } }),
      db.payment.count({ where: { status: 'PENDING' } })
    ]);

    logger.info('Datos comunes pre-cargados', {
      activeUsers: globalStats[0],
      availableProperties: globalStats[1],
      activeContracts: globalStats[2],
      pendingPayments: globalStats[3]
    });

    return {
      activeUsers: globalStats[0],
      availableProperties: globalStats[1],
      activeContracts: globalStats[2],
      pendingPayments: globalStats[3]
    };
  } catch (error) {
    logger.error('Error pre-cargando datos comunes', { error });
    return null;
  }
}
