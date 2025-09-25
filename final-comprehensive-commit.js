const { execSync } = require('child_process');

try {
  console.log('=== Agregando cambios ===');
  execSync('git add src/lib/bank-integrations/banco-estado-integration.ts', { stdio: 'inherit' });

  console.log('=== Creando commit ===');
  execSync(`git commit -m "fix: corregir todos los errores de tipos en banco-estado-integration

- Resolver conflicto de nombres 'error' → 'simulatedError'
- Agregar operador ! a todas las propiedades de response que pueden ser undefined
- Agregar operador ! a propiedades de account (accountNumber, rut, accountHolder)
- Agregar operador ! a propiedades de mov en mapeo de historial
- Corregir return this.accessToken! para evitar tipo string | null → string

Propiedades corregidas:
- response.idTransferencia, .codigoAutorizacion, .tiempoProcesamiento
- response.valida, .nombreTitular, .estadoCuenta, .idVerificacion
- response.tipoCuenta, .codigoSucursal, .mensajeError, .motivoRechazo
- response.saldoDisponible, .saldoActual, .fechaActualizacion
- response.movimientos, .estado, .descripcion, .fechaProcesamiento
- response.idTransferenciaProgramada, .cancelada
- account.accountNumber, .rut, .accountHolder
- mov.idMovimiento, .fechaMovimiento, .monto, .descripcion, etc.

Soluciona error de compilación: 'simulatedError is possibly undefined'"`, { stdio: 'inherit' });

  console.log('=== Haciendo push ===');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('✅ ¡Corrección completa y push realizado exitosamente!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nPor favor ejecuta manualmente:');
  console.log('git add src/lib/bank-integrations/banco-estado-integration.ts');
  console.log('git commit -m "fix: corregir errores de tipos en banco-estado-integration"');
  console.log('git push origin master');
}
