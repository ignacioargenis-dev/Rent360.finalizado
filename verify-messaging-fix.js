/**
 * Script de verificación final del sistema de mensajería
 * después de las correcciones de Edge Runtime y matcher
 */

const fetch = require('node-fetch');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testMessagingSystem() {
  console.log('🧪 Verificando sistema de mensajería después de correcciones...\n');

  try {
    // Paso 1: Verificar que el servidor esté funcionando
    console.log('1️⃣ Verificando servidor...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (!healthResponse.ok) {
      console.log('❌ Servidor no responde correctamente');
      return;
    }
    console.log('✅ Servidor funcionando');

    // Paso 2: Intentar login con usuario de prueba
    console.log('\n2️⃣ Intentando login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'owner@rent360.cl',
        password: 'owner123',
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falló:', loginResponse.status);
      const errorData = await loginResponse.json();
      console.log('Error:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');

    // Paso 3: Extraer cookie de autenticación
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const authTokenMatch = setCookieHeader?.match(/auth-token=([^;]+)/);
    if (!authTokenMatch) {
      console.log('❌ No se pudo extraer token de autenticación');
      return;
    }

    const authToken = authTokenMatch[1];
    console.log('✅ Token de autenticación extraído');

    // Paso 4: Probar endpoint de mensajes
    console.log('\n3️⃣ Probando endpoint de mensajes...');
    const messagesResponse = await fetch(`${BASE_URL}/api/messages`, {
      method: 'GET',
      headers: {
        Cookie: `auth-token=${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Respuesta: ${messagesResponse.status}`);

    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json();
      console.log('✅ Sistema de mensajería funcionando correctamente!');
      console.log(`📨 Mensajes encontrados: ${messagesData.messages?.length || 0}`);

      // Paso 5: Probar envío de mensaje
      console.log('\n4️⃣ Probando envío de mensaje...');
      const sendResponse = await fetch(`${BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          Cookie: `auth-token=${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: loginData.user.id, // Enviar a sí mismo para prueba
          subject: 'Mensaje de prueba',
          content:
            'Este es un mensaje de prueba para verificar que el sistema funciona correctamente.',
          type: 'direct',
        }),
      });

      if (sendResponse.ok) {
        console.log('✅ Envío de mensaje exitoso');
      } else {
        console.log('⚠️ Envío de mensaje falló:', sendResponse.status);
      }
    } else {
      const errorData = await messagesResponse.json();
      console.log('❌ Error en sistema de mensajería:', errorData);

      if (messagesResponse.status === 401) {
        console.log('\n🔍 Diagnóstico de error 401:');
        console.log('- Verificar que JWT_SECRET esté configurado en DigitalOcean');
        console.log('- Verificar que el middleware esté capturando la ruta /api/messages');
        console.log('- Verificar que atob() funcione correctamente en Edge Runtime');
      }
    }

    console.log('\n🎯 Verificación completada');
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

// Ejecutar verificación
testMessagingSystem();
