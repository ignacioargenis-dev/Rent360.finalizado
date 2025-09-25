const { execSync } = require('child_process');

try {
  console.log('=== Agregando cambios ===');
  execSync('git add src/lib/bank-integrations/banco-estado-integration.ts', { stdio: 'inherit' });

  console.log('=== Creando commit ===');
  execSync(`git commit -m "fix: corregir tipos en llamadas a makeBankRequest

- Filtrar propiedades undefined en objetos pasados como headers
- Corregir balanceData y historyData para excluir rut undefined
- Cambiar tipo explícito Record<string, string> para headers
- Evitar error 'string | undefined no asignable a string'

Funciones corregidas:
- getAccountBalance(): filtrar rut undefined en headers
- getTransactionHistory(): filtrar rut undefined en headers
- Ambos métodos ahora pasan objetos tipados correctamente"`, { stdio: 'inherit' });

  console.log('=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('✅ Commit y push completados exitosamente!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nPor favor ejecuta manualmente:');
  console.log('git add src/lib/bank-integrations/banco-estado-integration.ts');
  console.log('git commit -m "fix: corregir tipos en llamadas a makeBankRequest"');
  console.log('git push origin master');
}
