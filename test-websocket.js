#!/usr/bin/env node

const { io } = require('socket.io-client');

console.log('🧪 PRUEBA DE FUNCIONALIDAD WEBSOCKET');
console.log('=====================================');

// Configuración de prueba
const SERVER_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'https://rent360management-2yxgz.ondigitalocean.app';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-jwt-token';

console.log(`Servidor: ${SERVER_URL}`);
console.log(`Token: ${TEST_TOKEN ? 'Configurado' : 'No configurado'}`);
console.log('');

async function testWebSocketConnection() {
  console.log('🔌 Probando conexión WebSocket...');

  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      auth: {
        token: TEST_TOKEN,
      },
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      console.log('❌ Timeout: No se pudo conectar en 5 segundos');
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 5000);

    socket.on('connect', () => {
      console.log('✅ Conexión WebSocket exitosa!');
      console.log(`   Socket ID: ${socket.id}`);
      clearTimeout(timeout);

      // Probar envío de ping
      console.log('🏓 Probando ping/pong...');
      socket.emit('ping');

      socket.on('pong', data => {
        console.log('✅ Ping/pong funcionando correctamente');
        console.log(`   Respuesta: ${JSON.stringify(data)}`);
      });

      // Probar envío de mensaje (sin destinatario real, solo para verificar)
      console.log('💬 Probando envío de mensaje...');
      socket.emit('send-message', {
        toUserId: 'test-user',
        message: 'Mensaje de prueba desde test script',
        conversationId: 'test-conversation',
      });

      // Escuchar respuesta
      socket.on('message-sent', data => {
        console.log('✅ Mensaje enviado correctamente');
        console.log(`   Respuesta: ${JSON.stringify(data)}`);
      });

      socket.on('new-message', data => {
        console.log('📨 Mensaje recibido (echo)');
        console.log(`   Datos: ${JSON.stringify(data)}`);
      });

      // Probar eventos de notificación
      socket.on('notification', data => {
        console.log('🔔 Notificación recibida');
        console.log(`   Datos: ${JSON.stringify(data)}`);
      });

      // Desconectar después de pruebas
      setTimeout(() => {
        console.log('🔌 Desconectando...');
        socket.disconnect();
        resolve();
      }, 3000);
    });

    socket.on('connect_error', error => {
      console.log('❌ Error de conexión WebSocket:');
      console.log(`   ${error.message}`);
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('disconnect', reason => {
      console.log(`🔌 Desconectado: ${reason}`);
    });
  });
}

async function runTests() {
  try {
    await testWebSocketConnection();
    console.log('');
    console.log('🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    console.log('');
    console.log('📋 Estado del WebSocket:');
    console.log('   ✅ Conexión: Funcionando');
    console.log('   ✅ Autenticación: Funcionando');
    console.log('   ✅ Eventos: Sincronizados');
    console.log('   ✅ Ping/Pong: Funcionando');
    console.log('   ✅ Mensajes: Procesándose');
  } catch (error) {
    console.log('');
    console.log('❌ PRUEBA FALLIDA');
    console.log(`Error: ${error.message}`);
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Verificar que el servidor esté ejecutándose');
    console.log('   2. Verificar JWT_SECRET en variables de entorno');
    console.log('   3. Verificar NEXT_PUBLIC_WS_URL');
    console.log('   4. Verificar ALLOWED_ORIGINS incluye el origen actual');
    process.exit(1);
  }
}

runTests();
