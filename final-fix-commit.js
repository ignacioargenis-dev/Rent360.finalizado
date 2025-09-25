const { execSync } = require('child_process');

try {
  console.log('=== Agregando cambios ===');
  execSync('git add src/lib/bank-integrations/', { stdio: 'inherit' });

  console.log('=== Creando commit ===');
  execSync(`git commit -m "fix: corregir llamadas al logger y tipos en integraciones bancarias

- Corregir llamadas logger.error en todas las integraciones bancarias
- Cambiar formato: logger.error('msg:', error) → logger.error('msg', { error: ... })
- Agregar operador ! a propiedades inicializadas en initialize()
- Corregir retorno de accessToken con aserción de tipo en BancoEstado
- Afecta: BancoEstado, PayPal, Stripe, WebPay, BaseIntegration, Factory

Archivos corregidos:
- banco-estado-integration.ts (9 llamadas logger + tipo accessToken)
- paypal-integration.ts (8 llamadas logger)
- stripe-integration.ts (9 llamadas logger)  
- webpay-integration.ts (7 llamadas logger)
- base-bank-integration.ts (2 llamadas logger)
- bank-integration-factory.ts (1 llamada logger)"`, { stdio: 'inherit' });

  console.log('=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('✅ ¡Todas las correcciones completadas y enviadas a GitHub!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nPor favor ejecuta manualmente:');
  console.log('git add src/lib/bank-integrations/');
  console.log('git commit -m "fix: corregir logger calls en integraciones bancarias"');
  console.log('git push origin master');
}
