import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv, excel, json
    const type = searchParams.get('type') || 'all'; // all, properties, contracts, payments, users
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verificar permisos según el rol
    const allowedRoles = [
      'ADMIN',
      'OWNER',
      'BROKER',
      'TENANT',
      'RUNNER',
      'PROVIDER',
      'MAINTENANCE',
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. No tienes permisos para exportar datos.' },
        { status: 403 }
      );
    }

    // Construir filtros de fecha
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    let exportData: any = {};

    // Exportar datos según el tipo y rol
    if (type === 'all' || type === 'properties') {
      if (['ADMIN', 'OWNER', 'BROKER'].includes(user.role)) {
        const whereClause: any = {};

        if (user.role === 'OWNER') {
          whereClause.ownerId = user.id;
        }
        if (user.role === 'BROKER') {
          whereClause.brokerId = user.id;
        }
        if (Object.keys(dateFilter).length > 0) {
          whereClause.createdAt = dateFilter;
        }

        const properties = await db.property.findMany({
          where: whereClause,
          include: {
            owner: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            broker: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        exportData.properties = properties.map(property => ({
          id: property.id,
          title: property.title,
          address: property.address,
          city: property.city,
          commune: property.commune,
          region: property.region,
          price: property.price,
          type: property.type,
          status: property.status,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          ownerName: property.owner?.name,
          ownerEmail: property.owner?.email,
          ownerPhone: property.owner?.phone,
          brokerName: property.broker?.name,
          brokerEmail: property.broker?.email,
          brokerPhone: property.broker?.phone,
          createdAt: property.createdAt.toISOString(),
          updatedAt: property.updatedAt.toISOString(),
        }));
      }
    }

    if (type === 'all' || type === 'contracts') {
      if (['ADMIN', 'OWNER', 'BROKER', 'TENANT'].includes(user.role)) {
        const whereClause: any = {};

        if (user.role === 'OWNER') {
          whereClause.ownerId = user.id;
        }
        if (user.role === 'BROKER') {
          whereClause.brokerId = user.id;
        }
        if (user.role === 'TENANT') {
          whereClause.tenantId = user.id;
        }
        if (Object.keys(dateFilter).length > 0) {
          whereClause.createdAt = dateFilter;
        }

        const contracts = await db.contract.findMany({
          where: whereClause,
          include: {
            property: {
              select: {
                title: true,
                address: true,
                city: true,
                commune: true,
                region: true,
              },
            },
            tenant: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            owner: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            broker: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        exportData.contracts = contracts.map(contract => ({
          id: contract.id,
          contractNumber: contract.contractNumber,
          propertyTitle: contract.property.title,
          propertyAddress: `${contract.property.address}, ${contract.property.commune}, ${contract.property.city}`,
          tenantName: contract.tenant?.name || '',
          tenantEmail: contract.tenant?.email || '',
          tenantPhone: contract.tenant?.phone || '',
          ownerName: contract.owner?.name || '',
          ownerEmail: contract.owner?.email || '',
          ownerPhone: contract.owner?.phone || '',
          brokerName: contract.broker?.name,
          brokerEmail: contract.broker?.email,
          brokerPhone: contract.broker?.phone,
          monthlyRent: contract.monthlyRent,
          deposit: contract.depositAmount,
          status: contract.status,
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate.toISOString(),
          signedAt: contract.signedAt?.toISOString(),
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
        }));
      }
    }

    if (type === 'all' || type === 'payments') {
      if (['ADMIN', 'OWNER', 'TENANT', 'RUNNER', 'PROVIDER', 'MAINTENANCE'].includes(user.role)) {
        const whereClause: any = {};

        if (user.role === 'OWNER') {
          whereClause.contract = { ownerId: user.id };
        }
        if (user.role === 'TENANT') {
          whereClause.contract = { tenantId: user.id };
        }
        if (user.role === 'RUNNER') {
          whereClause.contract = {
            tasks: {
              some: {
                assignedTo: user.id,
                status: 'COMPLETED',
              },
            },
          };
        }
        if (user.role === 'PROVIDER' || user.role === 'MAINTENANCE') {
          whereClause.maintenanceRequest = {
            assignedProviderId: user.id,
            status: 'COMPLETED',
          };
        }
        if (Object.keys(dateFilter).length > 0) {
          whereClause.createdAt = dateFilter;
        }

        const payments = await db.payment.findMany({
          where: whereClause,
          include: {
            contract: {
              include: {
                property: {
                  select: {
                    title: true,
                    address: true,
                    city: true,
                    commune: true,
                    region: true,
                  },
                },
                tenant: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
                owner: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        });

        exportData.payments = payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          notes: payment.notes,
          transactionId: payment.transactionId,
          dueDate: payment.dueDate.toISOString(),
          paidDate: payment.paidDate?.toISOString(),
          propertyTitle: payment.contract?.property?.title,
          propertyAddress: payment.contract?.property
            ? `${payment.contract.property.address}, ${payment.contract.property.commune}, ${payment.contract.property.city}`
            : 'N/A',
          tenantName: payment.contract?.tenant?.name,
          tenantEmail: payment.contract?.tenant?.email,
          tenantPhone: payment.contract?.tenant?.phone,
          ownerName: payment.contract?.owner?.name,
          ownerEmail: payment.contract?.owner?.email,
          ownerPhone: payment.contract?.owner?.phone,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        }));
      }
    }

    if (type === 'all' || type === 'users') {
      if (user.role === 'ADMIN') {
        const whereClause: any = {};
        if (Object.keys(dateFilter).length > 0) {
          whereClause.createdAt = dateFilter;
        }

        const users = await db.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        exportData.users = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }));
      }
    }

    // Generar archivo según el formato
    let filename = `rent360_export_${type}_${new Date().toISOString().split('T')[0]}`;
    let contentType = 'application/json';
    let content = '';

    if (format === 'csv') {
      contentType = 'text/csv';
      filename += '.csv';

      // Convertir a CSV
      const csvRows: string[] = [];

      Object.keys(exportData).forEach(key => {
        if (exportData[key].length > 0) {
          csvRows.push(`\n=== ${key.toUpperCase()} ===\n`);

          // Headers
          const headers = Object.keys(exportData[key][0]);
          csvRows.push(headers.join(','));

          // Data rows
          exportData[key].forEach((row: any) => {
            const values = headers.map(header => {
              const value = row[header];
              // Escapar comillas y envolver en comillas si contiene comas
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            });
            csvRows.push(values.join(','));
          });
        }
      });

      content = csvRows.join('\n');
    } else if (format === 'excel') {
      // Para Excel, devolver JSON que puede ser procesado por el frontend
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename += '.xlsx';
      content = JSON.stringify(exportData, null, 2);
    } else {
      // JSON por defecto
      filename += '.json';
      content = JSON.stringify(exportData, null, 2);
    }

    logger.info('Datos exportados', {
      userId: user.id,
      role: user.role,
      format,
      type,
      records: Object.values(exportData).reduce((sum: number, arr: any) => sum + arr.length, 0),
    });

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Error exportando datos:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
