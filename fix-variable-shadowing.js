const { execSync } = require('child_process');

try {
  console.log('=== Agregando cambios ===');
  execSync('git add src/lib/bank-integrations/banco-estado-integration.ts', { stdio: 'inherit' });

  console.log('=== Creando commit ===');
  execSync(`git commit -m "fix: resolver conflicto de nombres de variable error en banco-estado-integration

- Renombrar variable 'error' a 'simulatedError' en bloque else
- Evitar shadowing con parámetro error del catch block
- Resolver error de TypeScript 'error is possibly undefined'"`, { stdio: 'inherit' });

  console.log('=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('✅ Commit y push completados exitosamente!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nPor favor ejecuta manualmente:');
  console.log('git add src/lib/bank-integrations/banco-estado-integration.ts');
  console.log('git commit -m "fix: resolver conflicto de nombres de variable error"');
  console.log('git push origin master');
}
