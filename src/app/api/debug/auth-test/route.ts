import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [AUTH-TEST] Testing authentication...');

    // Verificar autenticación
    const user = await requireAuth(request);
    console.log('✅ [AUTH-TEST] User authenticated:', {
      id: user.id,
      role: user.role,
      name: user.name,
    });

    // Verificar datos del corredor
    if (user.role === 'BROKER') {
      const brokerClients = await db.brokerClient.findMany({
        where: { brokerId: user.id, status: 'ACTIVE' },
        select: { id: true, userId: true, status: true },
      });

      const managedProperties = await db.brokerPropertyManagement.count({
        where: { brokerId: user.id, status: 'ACTIVE' },
      });

      console.log('📊 [AUTH-TEST] Broker data:', {
        brokerClientsCount: brokerClients.length,
        managedPropertiesCount: managedProperties,
        brokerClients: brokerClients.map(bc => bc.id),
      });

      return NextResponse.json({
        success: true,
        user: { id: user.id, role: user.role, name: user.name },
        brokerData: {
          brokerClientsCount: brokerClients.length,
          managedPropertiesCount: managedProperties,
          brokerClients: brokerClients,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, role: user.role, name: user.name },
    });
  } catch (error) {
    console.error('❌ [AUTH-TEST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 401 }
    );
  }
}
