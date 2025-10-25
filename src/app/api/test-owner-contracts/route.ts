import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Simular autenticación como el propietario
    const mockUser = {
      id: 'cmgkqrlbo00005tegp3rz128r', // ID del propietario
      role: 'OWNER'
    };

    console.log('🧪 Probando consulta exacta de /api/owner/contracts para propietario');

    // Consulta EXACTA que usa /api/owner/contracts
    const contracts = await db.contract.findMany({
      where: {
        OR: [
          { ownerId: mockUser.id },
          { property: { ownerId: mockUser.id } }
        ]
      },
      include: {
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
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${contracts.length} contratos para el propietario`);

    return NextResponse.json({
      success: true,
      message: 'Consulta de contratos del propietario ejecutada',
      contracts: contracts,
      count: contracts.length,
      userId: mockUser.id
    });

  } catch (error: any) {
    console.error('❌ Error en consulta de contratos:', error);

    return NextResponse.json({
      success: false,
      message: 'Error en consulta de contratos',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
