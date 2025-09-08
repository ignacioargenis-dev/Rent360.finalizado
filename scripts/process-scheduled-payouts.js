#!/usr/bin/env node

/**
 * Script para procesar payouts programados automáticamente
 * Se ejecuta según el schedule configurado (diario, semanal, mensual)
 */

const { PayoutService } = require('../src/lib/payout-service');
const { logger } = require('../src/lib/logger');

async function processScheduledPayouts() {
  console.log('🔄 Iniciando procesamiento de payouts programados...');

  try {
    const config = await PayoutService.getConfig();

    if (!config.enabled || !config.autoProcess) {
      console.log('⚠️  Procesamiento automático de payouts está deshabilitado');
      return;
    }

    console.log(`📅 Procesando payouts ${config.schedule}s...`);

    // Determinar período según schedule
    const period = getProcessingPeriod(config.schedule);

    // Procesar payouts de corredores
    console.log('👥 Procesando payouts de corredores...');
    const brokerPayouts = await PayoutService.calculatePendingPayouts('broker', period.startDate, period.endDate);

    if (brokerPayouts.length > 0) {
      console.log(`💰 Encontrados ${brokerPayouts.length} payouts de corredores por ${formatCurrency(brokerPayouts.reduce((sum, p) => sum + p.amount, 0))}`);

      const brokerBatch = await PayoutService.processPayoutBatch(brokerPayouts, {
        batchType: 'scheduled',
        triggeredBy: 'system',
        notes: `Payout automático ${config.schedule} - Corredores`
      });

      console.log(`✅ Procesados ${brokerBatch.totalRecipients} payouts de corredores`);
    } else {
      console.log('ℹ️  No hay payouts pendientes para corredores');
    }

    // Procesar payouts de propietarios
    console.log('🏠 Procesando payouts de propietarios...');
    const ownerPayouts = await PayoutService.calculatePendingPayouts('owner', period.startDate, period.endDate);

    if (ownerPayouts.length > 0) {
      console.log(`💰 Encontrados ${ownerPayouts.length} payouts de propietarios por ${formatCurrency(ownerPayouts.reduce((sum, p) => sum + p.amount, 0))}`);

      const ownerBatch = await PayoutService.processPayoutBatch(ownerPayouts, {
        batchType: 'scheduled',
        triggeredBy: 'system',
        notes: `Payout automático ${config.schedule} - Propietarios`
      });

      console.log(`✅ Procesados ${ownerBatch.totalRecipients} payouts de propietarios`);
    } else {
      console.log('ℹ️  No hay payouts pendientes para propietarios');
    }

    // Reporte final
    const totalPayouts = brokerPayouts.length + ownerPayouts.length;
    const totalAmount = brokerPayouts.reduce((sum, p) => sum + p.amount, 0) +
                       ownerPayouts.reduce((sum, p) => sum + p.amount, 0);

    console.log('📊 Resumen del procesamiento:');
    console.log(`   • Total de payouts procesados: ${totalPayouts}`);
    console.log(`   • Monto total procesado: ${formatCurrency(totalAmount)}`);
    console.log(`   • Corredores: ${brokerPayouts.length}`);
    console.log(`   • Propietarios: ${ownerPayouts.length}`);

    logger.info('Procesamiento de payouts programados completado', {
      schedule: config.schedule,
      period,
      totalPayouts,
      totalAmount,
      brokerPayouts: brokerPayouts.length,
      ownerPayouts: ownerPayouts.length
    });

  } catch (error) {
    console.error('❌ Error procesando payouts programados:', error);
    logger.error('Error en procesamiento de payouts programados', { error });

    // Notificar error crítico
    try {
      const { NotificationService } = require('../src/lib/notification-service');
      await NotificationService.notifySystemAlert({
        type: 'system_alert',
        title: 'Error en Procesamiento de Payouts',
        message: `Error procesando payouts programados: ${error.message}`,
        severity: 'critical'
      });
    } catch (notifyError) {
      console.error('❌ Error enviando notificación de error:', notifyError);
    }

    process.exit(1);
  }
}

/**
 * Determina el período de procesamiento según el schedule
 */
function getProcessingPeriod(schedule) {
  const now = new Date();
  let startDate, endDate;

  switch (schedule) {
    case 'immediate':
      // Últimas 24 horas
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      endDate = now;
      break;

    case 'weekly':
      // Semana anterior (lunes a domingo)
      const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      startDate = monday;
      endDate = sunday;
      break;

    case 'monthly':
    default:
      // Mes anterior completo
      const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = new Date(firstDayOfCurrentMonth.getTime() - 24 * 60 * 60 * 1000);
      startDate.setDate(1); // Primer día del mes anterior

      endDate = new Date(firstDayOfCurrentMonth.getTime() - 24 * 60 * 60 * 1000);
      // Último día del mes anterior
      break;
  }

  return { startDate, endDate };
}

/**
 * Formatea montos en pesos chilenos
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Función de verificación de salud antes del procesamiento
 */
async function healthCheck() {
  try {
    console.log('🔍 Ejecutando verificación de salud...');

    const config = await PayoutService.getConfig();

    // Verificar configuración
    if (!config.enabled) {
      console.log('⚠️  Sistema de payouts está deshabilitado');
      return false;
    }

    if (!config.autoProcess) {
      console.log('⚠️  Procesamiento automático está deshabilitado');
      return false;
    }

    // Verificar límites de seguridad
    const stats = await PayoutService.getPayoutStats();
    if (stats.totalAmount > config.maximumDailyPayout) {
      console.log('⚠️  Monto diario máximo alcanzado, saltando procesamiento');
      return false;
    }

    console.log('✅ Verificación de salud exitosa');
    return true;

  } catch (error) {
    console.error('❌ Error en verificación de salud:', error);
    return false;
  }
}

// Ejecutar procesamiento
async function main() {
  const isHealthy = await healthCheck();

  if (!isHealthy) {
    console.log('⏭️  Saltando procesamiento por verificación de salud');
    process.exit(0);
  }

  await processScheduledPayouts();
  console.log('🎉 Procesamiento de payouts programados completado');
}

// Manejar señales del sistema
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal de interrupción, finalizando...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal de terminación, finalizando...');
  process.exit(0);
});

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { processScheduledPayouts, getProcessingPeriod };
