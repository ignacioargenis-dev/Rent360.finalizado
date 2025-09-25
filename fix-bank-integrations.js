const { execSync } = require('child_process');

try {
  console.log('=== Agregando cambios ===');
  execSync('git add src/lib/bank-integrations/', { stdio: 'inherit' });

  console.log('=== Creando commit ===');
  execSync(`git commit -m "fix: corregir inicialización de propiedades en integraciones bancarias

- Agregar operador definite assignment (!) a propiedades de integración
- Corregir error de strictPropertyInitialization en clases de integración
- Afecta: BancoEstado, PayPal, Stripe, WebPay
- Las propiedades se inicializan en método initialize() llamado antes de uso

Propiedades corregidas:
- clientId, clientSecret, apiUrl (BancoEstado)
- clientId, clientSecret, apiUrl (PayPal)
- apiKey, publishableKey, apiUrl (Stripe)
- apiKey, commerceCode, apiUrl (WebPay)"`, { stdio: 'inherit' });

  console.log('=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('✅ Commit y push completados exitosamente!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nPor favor ejecuta manualmente:');
  console.log('git add src/lib/bank-integrations/');
  console.log('git commit -m "fix: corregir inicialización de propiedades en integraciones bancarias"');
  console.log('git push origin master');
}
