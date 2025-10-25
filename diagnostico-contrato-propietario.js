/**
 * Script de Diagnóstico: Visualización de Contratos del Propietario
 *
 * Este script verifica por qué el propietario ignacio.antonio.b@hotmail.com
 * no puede ver el contrato creado con el inquilino ingerlisesg@gmail.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO: Visualización de Contratos del Propietario\n');
  console.log('='.repeat(80));

  try {
    // 1. Buscar el propietario
    console.log('\n📋 PASO 1: Buscar propietario');
    console.log('-'.repeat(80));

    const propietario = await prisma.user.findUnique({
      where: { email: 'ignacio.antonio.b@hotmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!propietario) {
      console.log('❌ ERROR: No se encontró el propietario con ese email');
      return;
    }

    console.log('✅ Propietario encontrado:');
    console.log(JSON.stringify(propietario, null, 2));

    // 2. Buscar el inquilino
    console.log('\n📋 PASO 2: Buscar inquilino');
    console.log('-'.repeat(80));

    const inquilino = await prisma.user.findUnique({
      where: { email: 'ingerlisesg@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!inquilino) {
      console.log('❌ ERROR: No se encontró el inquilino con ese email');
      return;
    }

    console.log('✅ Inquilino encontrado:');
    console.log(JSON.stringify(inquilino, null, 2));

    // 3. Buscar contratos relacionados con el inquilino
    console.log('\n📋 PASO 3: Buscar contratos con este inquilino');
    console.log('-'.repeat(80));

    const contratosInquilino = await prisma.contract.findMany({
      where: { tenantId: inquilino.id },
      select: {
        id: true,
        contractNumber: true,
        status: true,
        ownerId: true,
        propertyId: true,
        tenantId: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            ownerId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (contratosInquilino.length === 0) {
      console.log('❌ ERROR: No se encontraron contratos con este inquilino');
      return;
    }

    console.log(`✅ Se encontraron ${contratosInquilino.length} contrato(s) con este inquilino:\n`);

    contratosInquilino.forEach((contrato, index) => {
      console.log(`Contrato ${index + 1}:`);
      console.log(`  - ID: ${contrato.id}`);
      console.log(`  - Número: ${contrato.contractNumber}`);
      console.log(`  - Estado: ${contrato.status}`);
      console.log(`  - Owner ID en contrato: ${contrato.ownerId || 'NULL ⚠️'}`);
      console.log(`  - Tenant ID en contrato: ${contrato.tenantId}`);
      console.log(`  - Property ID: ${contrato.propertyId}`);
      console.log(`  - Owner ID en propiedad: ${contrato.property?.ownerId || 'NULL ⚠️'}`);
      console.log(`  - Título propiedad: ${contrato.property?.title || 'Sin título'}`);
      console.log(`  - Creado: ${contrato.createdAt}`);
      console.log('');
    });

    // 4. Verificar coincidencia de IDs
    console.log('\n📋 PASO 4: Verificar coincidencia de IDs');
    console.log('-'.repeat(80));

    const contratoProblematico = contratosInquilino[0];

    console.log(`✅ Propietario buscando contratos: ${propietario.id}`);
    console.log(`✅ Owner ID en contrato: ${contratoProblematico.ownerId || 'NULL ⚠️'}`);
    console.log(`✅ Owner ID en propiedad: ${contratoProblematico.property?.ownerId || 'NULL ⚠️'}`);
    console.log('');

    if (contratoProblematico.ownerId === propietario.id) {
      console.log('✅ COINCIDE: El ownerId del contrato coincide con el propietario');
    } else if (
      contratoProblematico.ownerId === null ||
      contratoProblematico.ownerId === undefined
    ) {
      console.log('⚠️ PROBLEMA 1: El ownerId del contrato es NULL');

      if (contratoProblematico.property?.ownerId === propietario.id) {
        console.log('✅ SOLUCIÓN PARCIAL: El owner de la propiedad sí coincide');
        console.log(
          '   El endpoint /api/owner/contracts debería encontrar este contrato por la propiedad'
        );
      } else {
        console.log('❌ PROBLEMA GRAVE: El owner de la propiedad tampoco coincide');
      }
    } else {
      console.log(
        `❌ PROBLEMA: El ownerId del contrato (${contratoProblematico.ownerId}) NO coincide con el propietario (${propietario.id})`
      );
    }

    // 5. Simular consulta del endpoint /api/owner/contracts
    console.log('\n📋 PASO 5: Simular consulta del endpoint /api/owner/contracts');
    console.log('-'.repeat(80));

    const contratosEndpoint = await prisma.contract.findMany({
      where: {
        OR: [{ ownerId: propietario.id }, { property: { ownerId: propietario.id } }],
      },
      select: {
        id: true,
        contractNumber: true,
        status: true,
        ownerId: true,
        tenantId: true,
      },
    });

    console.log(
      `Resultado de la consulta: ${contratosEndpoint.length} contrato(s) encontrado(s)\n`
    );

    if (contratosEndpoint.length === 0) {
      console.log('❌ ERROR: El endpoint /api/owner/contracts NO encontraría ningún contrato');
      console.log('\n🔧 POSIBLES SOLUCIONES:');
      console.log('   1. Actualizar el ownerId del contrato para que coincida con el propietario');
      console.log('   2. Verificar que el ownerId de la propiedad esté correctamente asignado');
    } else {
      console.log('✅ El endpoint /api/owner/contracts SÍ encontraría estos contratos:');
      contratosEndpoint.forEach((c, i) => {
        console.log(`   ${i + 1}. Contrato ${c.contractNumber} (${c.id})`);
      });
    }

    // 6. Proporcionar solución
    console.log('\n📋 PASO 6: Generar SQL de corrección (si es necesario)');
    console.log('-'.repeat(80));

    if (contratoProblematico.ownerId !== propietario.id) {
      console.log('\n🔧 SQL PARA CORREGIR:');
      console.log(
        `UPDATE "contracts" SET "ownerId" = '${propietario.id}' WHERE "id" = '${contratoProblematico.id}';`
      );
      console.log('\n⚠️ IMPORTANTE: Este SQL debe ejecutarse en la base de datos de producción');
    } else {
      console.log('\n✅ No se necesita corrección SQL, el ownerId ya es correcto');
    }
  } catch (error) {
    console.error('\n❌ ERROR durante el diagnóstico:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 FIN DEL DIAGNÓSTICO');
}

diagnosticar();
