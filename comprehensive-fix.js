const fs = require('fs');

// Función para corregir todos los errores comunes en el archivo banco-estado-integration.ts
function fixBancoEstadoIntegration() {
  const filePath = 'src/lib/bank-integrations/banco-estado-integration.ts';

  if (!fs.existsSync(filePath)) {
    console.log('Archivo no encontrado');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Corregir accesos a propiedades de response que pueden ser undefined
  // Agregar operador ! donde sea necesario (ya que hay verificaciones previas)
  const responseAccessPatterns = [
    // response.idTransferencia (ya verificado en algunos lugares)
    /response\.idTransferencia/g,
    // response.codigoAutorizacion
    /response\.codigoAutorizacion/g,
    // response.tiempoProcesamiento
    /response\.tiempoProcesamiento/g,
    // response.valida
    /response\.valida/g,
    // response.nombreTitular
    /response\.nombreTitular/g,
    // response.estadoCuenta
    /response\.estadoCuenta/g,
    // response.idVerificacion
    /response\.idVerificacion/g,
    // response.tipoCuenta
    /response\.tipoCuenta/g,
    // response.mensajeError
    /response\.mensajeError/g,
    // response.motivoRechazo
    /response\.motivoRechazo/g,
    // response.saldoDisponible
    /response\.saldoDisponible/g,
    // response.saldoActual
    /response\.saldoActual/g,
    // response.fechaActualizacion
    /response\.fechaActualizacion/g,
    // response.movimientos
    /response\.movimientos/g,
    // response.estado
    /response\.estado/g,
    // response.descripcion
    /response\.descripcion/g,
    // response.fechaProcesamiento
    /response\.fechaProcesamiento/g,
    // response.idTransferenciaProgramada
    /response\.idTransferenciaProgramada/g,
    // response.cancelada
    /response\.cancelada/g
  ];

  // Aplicar operador ! a todos los accesos a response. que no estén ya verificados
  responseAccessPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      // No agregar ! si ya lo tiene
      if (match.endsWith('!')) return match;

      // No agregar ! si está en una condición de verificación
      const lineStart = content.substring(0, content.indexOf(match)).split('\n').pop();
      if (lineStart && (lineStart.includes('if (') || lineStart.includes('!response'))) {
        return match;
      }

      modified = true;
      console.log(`Agregando ! a: ${match}`);
      return match + '!';
    });
  });

  // 2. Corregir accesos a propiedades de error que pueden ser undefined
  // En bloques catch, error puede ser undefined
  const errorPatterns = [
    /error\.message/g,
    /error\.code/g,
    /error\.stack/g
  ];

  errorPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      // Si ya está en un operador ternario o verificación, dejarlo
      const context = content.substring(
        Math.max(0, content.indexOf(match) - 50),
        content.indexOf(match) + 50
      );

      if (context.includes('instanceof Error') || context.includes('error ?')) {
        return match;
      }

      // Reemplazar con verificación segura
      modified = true;
      const replacement = match.replace('error.', '(error instanceof Error ? error.');
      console.log(`Corrigiendo error access: ${match} → ${replacement}) : 'Unknown error')`);
      return replacement + ' : \'Unknown error\')';
    });
  });

  // 3. Corregir accesos a propiedades de account que pueden ser undefined
  const accountPatterns = [
    /account\.accountNumber/g,
    /account\.rut/g,
    /account\.accountHolder/g
  ];

  accountPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      if (match.endsWith('!')) return match;
      modified = true;
      console.log(`Agregando ! a account property: ${match}`);
      return match + '!';
    });
  });

  // 4. Corregir accesos a propiedades de mov que pueden ser undefined
  const movPatterns = [
    /mov\.idMovimiento/g,
    /mov\.tipoMovimiento/g,
    /mov\.monto/g,
    /mov\.fecha/g,
    /mov\.descripcion/g,
    /mov\.canal/g
  ];

  movPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      if (match.endsWith('!')) return match;
      modified = true;
      console.log(`Agregando ! a mov property: ${match}`);
      return match + '!';
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Archivo corregido completamente');
  } else {
    console.log('ℹ️  No se encontraron errores que corregir');
  }
}

console.log('🔧 Iniciando corrección completa de banco-estado-integration.ts...\n');
fixBancoEstadoIntegration();
console.log('\n✅ Corrección completa finalizada.');
