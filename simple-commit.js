const { execSync } = require('child_process');

try {
  console.log('=== Agregando cambios ===');
  execSync('git add src/lib/bank-account-service.ts', { stdio: 'inherit' });

  console.log('=== Creando commit ===');
  execSync(`git commit -m "fix: corregir llamadas incorrectas a logger.error en bank-account-service.ts

- Cambiar logger.error('mensaje:', error) por logger.error('mensaje', { error: ... })
- Corregir 5 llamadas que pasaban 'unknown' como parámetro
- Soluciona error de TypeScript en compilación de producción"`, { stdio: 'inherit' });

  console.log('=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('✅ Commit y push completados exitosamente!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nPor favor ejecuta manualmente:');
  console.log('git add src/lib/bank-account-service.ts');
  console.log('git commit -m "fix: corregir logger.error calls"');
  console.log('git push origin master');
}
