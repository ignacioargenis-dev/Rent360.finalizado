/**
 * Script para sincronizar la base de datos de producción
 *
 * IMPORTANTE: Solo ejecutar si tienes acceso a DATABASE_URL de producción
 */

const { execSync } = require('child_process');

console.log('🔄 Sincronizando base de datos de producción...');
console.log('');
console.log('⚠️  ADVERTENCIA: Este script modificará la base de datos de PRODUCCIÓN');
console.log('');
console.log('Asegúrate de tener la variable DATABASE_URL configurada para producción');
console.log('');

// Preguntar confirmación
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(
  '¿Estás seguro de que quieres continuar? (escribe "SI" para confirmar): ',
  answer => {
    if (answer.toUpperCase() === 'SI') {
      try {
        console.log('\n🔄 Ejecutando prisma db push...\n');
        execSync('npx prisma db push', { stdio: 'inherit' });

        console.log('\n✅ Base de datos sincronizada exitosamente!');
        console.log('\n🔄 Generando cliente de Prisma...\n');
        execSync('npx prisma generate', { stdio: 'inherit' });

        console.log('\n✅ ¡Todo listo! Los nuevos modelos están disponibles en producción.');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Reinicia tu aplicación en DigitalOcean');
        console.log('   2. Verifica que /api/broker/prospects funciona');
        console.log('   3. Accede a /broker/prospects para ver la nueva UI');
      } catch (error) {
        console.error('\n❌ Error al sincronizar:', error.message);
        console.log('\nIntenta ejecutar manualmente desde la consola de DigitalOcean');
      }
    } else {
      console.log('\n❌ Operación cancelada');
    }

    readline.close();
  }
);
