import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch real data from database
    const [users, properties, contracts, payments] = await Promise.all([
      db.user.count(),
      db.property.count(),
      db.contract.count({ where: { status: 'ACTIVE' } }),
      db.payment.findMany({
        where: {
          status: 'PAID',
          paidDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
      }),
    ]);

    // Calculate real statistics
    const totalUsers = users;
    const totalProperties = properties;
    const activeContracts = contracts;
    const monthlyRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalPayments = await db.payment.count();
    const pendingTickets = 0; // TODO: Implement tickets system

    // Calculate growth (simplified - would need historical data for real calculation)
    const userGrowth = 0; // TODO: Calculate based on historical data
    const propertyGrowth = 0; // TODO: Calculate based on historical data
    const revenueGrowth = 0; // TODO: Calculate based on historical data

    const reportData = {
      totalUsers,
      totalProperties,
      activeContracts,
      monthlyRevenue,
      totalPayments,
      pendingTickets,
      userGrowth,
      propertyGrowth,
      revenueGrowth,
    };

    // Get top properties (simplified - would need view/analytics data)
    const topProperties = await db.property.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        // TODO: Add view count and inquiry count fields to Property model
      },
    });

    const formattedTopProperties = topProperties.map((property, index) => ({
      id: property.id,
      title: property.title || 'Propiedad sin título',
      views: Math.floor(Math.random() * 1000) + 100, // TODO: Get real view data
      inquiries: Math.floor(Math.random() * 50) + 10, // TODO: Get real inquiry data
      conversionRate: Math.random() * 10, // TODO: Calculate real conversion rate
    }));

    // Get recent activity (simplified - would need activity log)
    const recentActivity = [
      {
        id: '1',
        type: 'user',
        title: 'Usuarios registrados',
        description: `${totalUsers} usuarios en total`,
        date: new Date().toISOString().split('T')[0],
        impact: 'high',
      },
      {
        id: '2',
        type: 'revenue',
        title: 'Ingresos del mes',
        description: `$${monthlyRevenue.toLocaleString()} ingresos este mes`,
        date: new Date().toISOString().split('T')[0],
        impact: 'high',
      },
      {
        id: '3',
        type: 'property',
        title: 'Propiedades activas',
        description: `${totalProperties} propiedades en total`,
        date: new Date().toISOString().split('T')[0],
        impact: 'medium',
      },
      {
        id: '4',
        type: 'contract',
        title: 'Contratos activos',
        description: `${activeContracts} contratos activos`,
        date: new Date().toISOString().split('T')[0],
        impact: 'medium',
      },
    ];

    return NextResponse.json({
      reportData,
      topProperties: formattedTopProperties,
      recentActivity,
    });

  } catch (error) {
    logger.error('Error fetching admin reports:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
