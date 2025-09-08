#!/usr/bin/env node

/**
 * Script de inicialización del sistema de notificaciones
 * Se ejecuta al iniciar la aplicación para configurar notificaciones recurrentes
 */

const { NotificationQueue } = require('../src/lib/notification-queue');

async function initializeNotifications() {
  console.log('🚀 Inicializando sistema de notificaciones...');

  try {
    // Programar notificaciones recurrentes
    await NotificationQueue.scheduleRecurringNotifications();
    console.log('✅ Notificaciones recurrentes programadas');

    // Iniciar procesamiento de cola
    NotificationQueue.startProcessing();
    console.log('✅ Procesamiento de cola iniciado');

    // Programar limpieza automática
    setInterval(() => {
      NotificationQueue.cleanupOldNotifications();
    }, 60 * 60 * 1000); // Cada hora
    console.log('✅ Limpieza automática programada');

    console.log('🎉 Sistema de notificaciones inicializado correctamente');

  } catch (error) {
    console.error('❌ Error inicializando sistema de notificaciones:', error);
    process.exit(1);
  }
}

// Ejecutar inicialización
initializeNotifications();
