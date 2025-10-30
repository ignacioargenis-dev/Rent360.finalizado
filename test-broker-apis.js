// Script para probar las APIs de corredor con autenticación simulada
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { serialize } = require('cookie');

const prisma = new PrismaClient();

// JWT Secrets (deben coincidir con los del .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = '1h';

async function generateTestToken(user) {
  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Crear cookie serializada
  const cookie = serialize('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hora
    path: '/',
  });

  return { token, cookie };
}

async function testBrokerAPIs() {
  try {
    console.log('🚀 Iniciando pruebas de APIs de corredor...\n');

    // 1. Buscar usuario corredor
    const broker = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
    });

    if (!broker) {
      console.log('❌ No se encontró el usuario corredor');
      return;
    }

    console.log('👤 Broker encontrado:', {
      id: broker.id,
      name: broker.name,
      email: broker.email,
      role: broker.role,
    });

    // 2. Generar token de autenticación
    const { token, cookie } = await generateTestToken(broker);
    console.log('🔑 Token generado:', token.substring(0, 50) + '...');

    // 3. Verificar datos actuales en BD
    const brokerClients = await prisma.brokerClient.count({
      where: { brokerId: broker.id, status: 'ACTIVE' },
    });

    const managedProperties = await prisma.brokerPropertyManagement.count({
      where: { brokerId: broker.id, status: 'ACTIVE' },
    });

    const ownProperties = await prisma.property.count({
      where: { brokerId: broker.id },
    });

    console.log('\n📊 Datos actuales en BD:');
    console.log(`  - BrokerClients activos: ${brokerClients}`);
    console.log(`  - Propiedades gestionadas: ${managedProperties}`);
    console.log(`  - Propiedades propias: ${ownProperties}`);

    // 4. Verificar contratos
    const contracts = await prisma.contract.count({
      where: { brokerId: broker.id },
    });

    console.log(`  - Contratos totales: ${contracts}`);

    // 5. Probar APIs (simular llamadas HTTP)
    console.log('\n🧪 Simulando llamadas a APIs...\n');

    // Simular requireAuth - verificar que el token funciona
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token válido, usuario autenticado:', {
        id: decoded.id,
        role: decoded.role,
        name: decoded.name,
      });
    } catch (error) {
      console.log('❌ Token inválido:', error.message);
      return;
    }

    // Verificar lógica de las APIs sin hacer HTTP calls
    console.log('\n🔍 Verificando lógica de APIs:');

    // API Properties
    console.log('\n🏠 Probando lógica de /api/broker/properties:');
    const managedProps = await prisma.brokerPropertyManagement.findMany({
      where: { brokerId: broker.id, status: 'ACTIVE' },
      include: {
        property: {
          include: {
            owner: { select: { name: true } },
            contracts: {
              where: { status: 'ACTIVE' },
              include: { tenant: { select: { name: true } } },
              take: 1,
            },
          },
        },
      },
    });

    const ownProps = await prisma.property.findMany({
      where: { brokerId: broker.id },
      include: {
        owner: { select: { name: true } },
        contracts: {
          where: { status: 'ACTIVE' },
          include: { tenant: { select: { name: true } } },
          take: 1,
        },
      },
    });

    console.log(`  - Propiedades gestionadas encontradas: ${managedProps.length}`);
    console.log(`  - Propiedades propias encontradas: ${ownProps.length}`);
    console.log(`  - Total esperado: ${managedProps.length + ownProps.length}`);

    // API Clients Active
    console.log('\n👥 Probando lógica de /api/broker/clients/active:');
    const clients = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          {
            contractsAsOwner: {
              some: { brokerId: broker.id, status: 'ACTIVE' },
            },
          },
          {
            contractsAsTenant: {
              some: { brokerId: broker.id, status: 'ACTIVE' },
            },
          },
          {
            clientRelationships: {
              some: { brokerId: broker.id, status: 'ACTIVE' },
            },
          },
        ],
      },
      include: {
        clientRelationships: {
          where: { brokerId: broker.id, status: 'ACTIVE' },
          include: {
            managedProperties: {
              include: { property: { select: { price: true } } },
            },
          },
        },
      },
    });

    console.log(`  - Clientes activos encontrados: ${clients.length}`);
    clients.forEach((client, i) => {
      const brokerClient = client.clientRelationships[0];
      console.log(
        `    ${i + 1}. ${client.name} (${client.id}) - BrokerClient: ${brokerClient?.id || 'N/A'}`
      );
    });

    // API Dashboard
    console.log('\n📈 Probando lógica de /api/broker/dashboard:');
    const dashboardStats = {
      totalProperties: managedProps.length + ownProps.length,
      activeClients: clients.length,
      portfolioValue: [...managedProps, ...ownProps].reduce((sum, prop) => {
        return sum + (prop.property?.price || 0);
      }, 0),
    };

    console.log(`  - Total propiedades: ${dashboardStats.totalProperties}`);
    console.log(`  - Clientes activos: ${dashboardStats.activeClients}`);
    console.log(`  - Valor portafolio: ${dashboardStats.portfolioValue}`);

    // API Client Details - verificar el cliente específico
    console.log('\n👤 Probando lógica de /api/broker/clients/[clientId]:');
    const clientId = 'cmhdw0x0y0001jlr1eeui1c21';
    const brokerClient = await prisma.brokerClient.findFirst({
      where: {
        id: clientId,
        brokerId: broker.id,
      },
      include: {
        user: { select: { name: true, email: true } },
        managedProperties: {
          include: { property: { select: { title: true } } },
        },
      },
    });

    if (brokerClient) {
      console.log('✅ BrokerClient encontrado:', {
        id: brokerClient.id,
        user: brokerClient.user.name,
        managedProperties: brokerClient.managedProperties.length,
      });
    } else {
      console.log('❌ BrokerClient NO encontrado con ID:', clientId);
    }
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBrokerAPIs();
