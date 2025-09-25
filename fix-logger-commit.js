const { execSync } = require('child_process');

try {
  console.log('=== Agregando cambios ===');
  execSync('git add src/lib/bank-account-service.ts', { stdio: 'inherit' });

  console.log('=== Creando commit ===');
  execSync(`git commit -m "fix: corregir llamadas incorrectas al logger.error

- Cambiar logger.error('mensaje:', error) por logger.error('mensaje', { error: ... })
- Corregir 5 llamadas en bank-account-service.ts que pasaban 'unknown' como parámetro
- Usar formato correcto: { error: error instanceof Error ? error.message : String(error) }
- Soluciona error de TypeScript en compilación de producción"`, { stdio: 'inherit' });

  console.log('=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('✅ Commit y push completados exitosamente!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
