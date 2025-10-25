import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Iniciando diagnóstico exhaustivo de contratos...');

    // 1. Buscar usuarios específicos
    console.log('👥 Buscando usuarios...');
    const tenant = await db.user.findUnique({
      where: { email: 'ingerlisesg@gmail.com' },
      select: { id: true, email: true, name: true, role: true }
    });

    const owner = await db.user.findUnique({
      where: { email: 'ignacio.antonio.b@hotmail.com' },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log('Tenant encontrado:', tenant);
    console.log('Owner encontrado:', owner);

    if (!tenant || !owner) {
      return NextResponse.json({
        success: false,
        message: 'Usuarios no encontrados',
        tenant: tenant,
        owner: owner
      });
    }

    // 2. Buscar contratos del inquilino
    console.log('📄 Buscando contratos del inquilino...');
    const tenantContracts = await db.contract.findMany({
      where: {
        OR: [
          { tenantId: tenant.id },
          { tenantRut: tenant.email } // Por si está guardado por RUT/email
        ]
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        owner: true,
        broker: true
      }
    });

    // 3. Buscar contratos del propietario
    console.log('🏠 Buscando contratos del propietario...');
    const ownerContracts = await db.contract.findMany({
      where: {
        OR: [
          { ownerId: owner.id },
          { property: { ownerId: owner.id } }
        ]
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        broker: true
      }
    });

    // 4. Buscar todas las propiedades del propietario
    console.log('🏢 Buscando propiedades del propietario...');
    const ownerProperties = await db.property.findMany({
      where: { ownerId: owner.id },
      include: {
        owner: true,
        contracts: {
          include: {
            tenant: true,
            owner: true,
            broker: true
          }
        }
      }
    });

    // 5. Buscar contratos que involucren tanto al inquilino como al propietario
    console.log('🔗 Buscando contratos entre estos usuarios...');
    const relatedContracts = await db.contract.findMany({
      where: {
        OR: [
          {
            AND: [
              { tenantId: tenant.id },
              {
                OR: [
                  { ownerId: owner.id },
                  { property: { ownerId: owner.id } }
                ]
              }
            ]
          },
          {
            AND: [
              { tenantId: tenant.id },
              { ownerId: owner.id }
            ]
          }
        ]
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        owner: true,
        broker: true
      }
    });

    // 6. Análisis de la API de contratos del propietario
    console.log('🔍 Probando consulta de API de propietario...');
    const apiTestContracts = await db.contract.findMany({
      where: {
        OR: [
          { ownerId: owner.id },
          { property: { ownerId: owner.id } }
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

    const analysis = {
      summary: {
        tenantFound: !!tenant,
        ownerFound: !!owner,
        tenantContractsCount: tenantContracts.length,
        ownerContractsCount: ownerContracts.length,
        ownerPropertiesCount: ownerProperties.length,
        relatedContractsCount: relatedContracts.length,
        apiTestContractsCount: apiTestContracts.length
      },
      users: {
        tenant,
        owner
      },
      contracts: {
        tenantContracts,
        ownerContracts,
        relatedContracts,
        apiTestContracts
      },
      properties: {
        ownerProperties
      },
      issues: []
    };

    // Análisis de problemas
    if (ownerContracts.length === 0 && ownerProperties.length > 0) {
      analysis.issues.push('El propietario tiene propiedades pero no contratos visibles');
    }

    if (relatedContracts.length === 0) {
      analysis.issues.push('No se encontraron contratos entre el inquilino y propietario especificados');
    }

    if (apiTestContracts.length !== ownerContracts.length) {
      analysis.issues.push('La consulta de API devuelve resultados diferentes a la consulta directa');
    }

    console.log('✅ Diagnóstico completado');

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico exhaustivo completado',
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error en diagnóstico:', error);

    return NextResponse.json({
      success: false,
      message: 'Error en diagnóstico',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
