import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema para actualizar estado de provider
const updateProviderStatusSchema = z.object({
  status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE']),
  isVerified: z.boolean(),
  notes: z.string().optional(),
});

// Schema para verificar documentos
const verifyDocumentsSchema = z.object({
  isVerified: z.boolean(),
  notes: z.string().optional(),
});

// GET - Listar todos los providers
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden ver todos los providers
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const providerType = searchParams.get('type'); // 'maintenance' o 'service'
    const status = searchParams.get('status');
    const verified = searchParams.get('verified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let maintenanceProviders: any[] = [];
    let serviceProviders: any[] = [];
    let totalMaintenance = 0;
    let totalService = 0;

    // Construir filtros
    const whereMaintenance: any = {};
    const whereService: any = {};
    
    if (status) {
      whereMaintenance.status = status;
      whereService.status = status;
    }
    
    if (verified !== null) {
      whereMaintenance.isVerified = verified === 'true';
      whereService.isVerified = verified === 'true';
    }

    // Obtener maintenance providers
    if (!providerType || providerType === 'maintenance') {
             const maintenance = await db.maintenanceProvider.findMany({
        where: whereMaintenance,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          documents: true,
          _count: {
            select: {
              maintenanceJobs: true,
              transactions: true,
            },
          },
        },
      });

      maintenanceProviders = maintenance.map(provider => ({
        ...provider,
        specialties: provider.specialties || [],
        availability: provider.availability || '',
        completedJobs: provider._count?.maintenanceJobs || 0,
        totalTransactions: provider._count?.transactions || 0,
      })) as any[];
             totalMaintenance = await db.maintenanceProvider.count({ where: whereMaintenance });
    }

    // Obtener service providers
    if (!providerType || providerType === 'service') {
             const service = await db.serviceProvider.findMany({
        where: whereService,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          documents: true,
          _count: {
            select: {
              serviceJobs: true,
              transactions: true,
            },
          },
        },
      });

      serviceProviders = service.map(provider => ({
        ...provider,
        serviceTypes: provider.serviceTypes || [],
        availability: provider.availability || '',
        completedJobs: provider._count?.serviceJobs || 0,
        totalTransactions: provider._count?.transactions || 0,
      })) as any[];
      totalService = await db.serviceProvider.count({ where: whereService });
    }

    // Calcular estadísticas
    const stats = await db.$transaction([
      db.maintenanceProvider.aggregate({
        _count: { id: true },
        _avg: { rating: true },
        _sum: { totalEarnings: true },
      }),
      db.serviceProvider.aggregate({
        _count: { id: true },
        _avg: { rating: true },
        _sum: { totalEarnings: true },
      }),
    ]);

    return NextResponse.json({
      maintenanceProviders,
      serviceProviders,
      pagination: {
        page,
        limit,
        totalMaintenance,
        totalService,
        total: totalMaintenance + totalService,
      },
      stats: {
        maintenance: {
          total: stats[0]._count.id,
          averageRating: stats[0]._avg.rating || 0,
          totalEarnings: stats[0]._sum.totalEarnings || 0,
        },
        service: {
          total: stats[1]._count.id,
          averageRating: stats[1]._avg.rating || 0,
          totalEarnings: stats[1]._sum.totalEarnings || 0,
        },
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT - Actualizar estado de provider
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden actualizar providers
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { providerId, providerType, action, ...data } = body;

    if (!providerId || !providerType || !action) {
      return NextResponse.json(
        { error: 'ID de proveedor, tipo y acción son requeridos' },
        { status: 400 },
      );
    }

    if (!['maintenance', 'service'].includes(providerType)) {
      return NextResponse.json(
        { error: 'Tipo de proveedor inválido' },
        { status: 400 },
      );
    }

    if (!['update_status', 'verify_documents', 'verify_bank_account'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 },
      );
    }

    let result;

    if (action === 'update_status') {
      const validatedData = updateProviderStatusSchema.parse(data);
      
      if (providerType === 'maintenance') {
        result = await db.maintenanceProvider.update({
          where: { id: providerId },
          data: {
            status: validatedData.status,
            isVerified: validatedData.isVerified,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
              },
            },
          },
        });

        // Actualizar estado del usuario si es necesario
        if (validatedData.status === 'ACTIVE' && validatedData.isVerified) {
          await db.user.update({
            where: { id: result.user.id },
            data: { isActive: true },
          });
        }
      } else {
        result = await db.serviceProvider.update({
          where: { id: providerId },
          data: {
            status: validatedData.status,
            isVerified: validatedData.isVerified,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
              },
            },
          },
        });

        // Actualizar estado del usuario si es necesario
        if (validatedData.status === 'ACTIVE' && validatedData.isVerified) {
          await db.user.update({
            where: { id: result.user.id },
            data: { isActive: true },
          });
        }
      }
    } else if (action === 'verify_documents') {
      const validatedData = verifyDocumentsSchema.parse(data);
      
      if (providerType === 'maintenance') {
        result = await db.providerDocuments.update({
          where: { maintenanceProviderId: providerId },
          data: {
            isVerified: validatedData.isVerified,
            verifiedAt: validatedData.isVerified ? new Date() : null,
            verifiedBy: validatedData.isVerified ? user.id : null,
          },
        });
      } else {
        result = await db.providerDocuments.update({
          where: { serviceProviderId: providerId },
          data: {
            isVerified: validatedData.isVerified,
            verifiedAt: validatedData.isVerified ? new Date() : null,
            verifiedBy: validatedData.isVerified ? user.id : null,
          },
        });
      }
    } else if (action === 'verify_bank_account') {
      const validatedData = verifyDocumentsSchema.parse(data);
      
      if (providerType === 'maintenance') {
        const provider = await db.maintenanceProvider.findUnique({
          where: { id: providerId },
          select: { userId: true },
        });
        
        if (provider) {
          result = await db.bankAccount.update({
            where: { userId: provider.userId },
            data: {
              isVerified: validatedData.isVerified,
            },
          });
        }
      } else {
        const provider = await db.serviceProvider.findUnique({
          where: { id: providerId },
          select: { userId: true },
        });
        
        if (provider) {
          result = await db.bankAccount.update({
            where: { userId: provider.userId },
            data: {
              isVerified: validatedData.isVerified,
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Proveedor actualizado exitosamente',
      result,
    });

  } catch (error) {
    return handleApiError(error);
  }
}
