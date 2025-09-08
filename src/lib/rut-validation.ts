/**
 * Validación de RUT chileno
 *
 * Implementa el algoritmo de validación oficial del Servicio de Impuestos Internos (SII)
 * de Chile para verificar la autenticidad de los números de RUT.
 */

export interface RutValidationResult {
  isValid: boolean;
  cleanRut?: string;
  formattedRut?: string;
  error?: string;
}

/**
 * Limpia el RUT de caracteres no numéricos (excepto 'K' y 'k')
 */
export function cleanRut(rut: string): string {
  if (!rut || typeof rut !== 'string') {
    return '';
  }

  return rut
    .replace(/[^0-9kK]/g, '') // Solo números y K/k
    .toUpperCase();
}

/**
 * Formatea el RUT con puntos y guión
 */
export function formatRut(rut: string): string {
  const clean = cleanRut(rut);

  if (clean.length < 2) {
    return clean;
  }

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  // Formatear con puntos
  let formatted = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    formatted = body[i] + formatted;
    if (j % 3 === 2 && i > 0) {
      formatted = '.' + formatted;
    }
  }

  return formatted + '-' + dv;
}

/**
 * Calcula el dígito verificador del RUT
 */
export function calculateDV(rut: string): string {
  const clean = cleanRut(rut);

  if (clean.length < 1) {
    return '';
  }

  const body = clean.slice(0, -1);

  // Algoritmo de cálculo del dígito verificador
  let sum = 0;
  let multiplier = 2;

  // Procesar de derecha a izquierda
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const dv = 11 - remainder;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Valida un RUT chileno completo
 */
export function validateRut(rut: string): RutValidationResult {
  try {
    if (!rut || typeof rut !== 'string') {
      return {
        isValid: false,
        error: 'RUT no proporcionado'
      };
    }

    const clean = cleanRut(rut);

    if (clean.length < 2 || clean.length > 10) {
      return {
        isValid: false,
        error: 'RUT debe tener entre 2 y 10 caracteres'
      };
    }

    // Verificar que el cuerpo sea solo números
    const body = clean.slice(0, -1);
    if (!/^\d+$/.test(body)) {
      return {
        isValid: false,
        error: 'El cuerpo del RUT debe contener solo números'
      };
    }

    // Verificar que el dígito verificador sea válido
    const providedDV = clean.slice(-1);
    const calculatedDV = calculateDV(clean);

    if (providedDV !== calculatedDV) {
      return {
        isValid: false,
        cleanRut: clean,
        formattedRut: formatRut(clean),
        error: `Dígito verificador incorrecto. Debería ser: ${calculatedDV}`
      };
    }

    // Verificar RUTs especiales conocidos
    const specialRuts = ['11111111-1', '22222222-2', '33333333-3', '44444444-4', '55555555-5'];
    const formatted = formatRut(clean);
    if (specialRuts.includes(formatted)) {
      return {
        isValid: false,
        cleanRut: clean,
        formattedRut: formatted,
        error: 'RUT especial no válido para uso real'
      };
    }

    return {
      isValid: true,
      cleanRut: clean,
      formattedRut: formatRut(clean)
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Error interno en validación de RUT'
    };
  }
}

/**
 * Valida RUT para uso en formularios (sin mostrar errores específicos)
 */
export function isValidRut(rut: string): boolean {
  return validateRut(rut).isValid;
}

/**
 * Normaliza RUT para almacenamiento en base de datos
 */
export function normalizeRut(rut: string): string {
  const result = validateRut(rut);
  return result.isValid ? result.cleanRut || '' : '';
}

/**
 * Formatea RUT para display en UI
 */
export function displayRut(rut: string): string {
  const result = validateRut(rut);
  return result.isValid ? result.formattedRut || rut : rut;
}

/**
 * Valida RUT en tiempo real mientras el usuario escribe
 */
export function validateRutRealtime(rut: string): {
  isValid: boolean;
  isComplete: boolean;
  error?: string;
  suggestion?: string;
} {
  const clean = cleanRut(rut);

  if (clean.length === 0) {
    return { isValid: false, isComplete: false };
  }

  if (clean.length < 2) {
    return {
      isValid: false,
      isComplete: false,
      error: 'RUT muy corto'
    };
  }

  // Si tiene dígito verificador, validar completo
  if (clean.length >= 2) {
    const result = validateRut(clean);
    return {
      isValid: result.isValid,
      isComplete: true,
      error: result.error,
      suggestion: result.isValid ? formatRut(clean) : undefined
    };
  }

  // RUT en proceso de escritura
  return {
    isValid: false,
    isComplete: false,
    suggestion: clean.length > 1 ? formatRut(clean + '0') : undefined // Sugerencia temporal
  };
}

/**
 * Genera RUTs de prueba válidos para desarrollo
 */
export function generateValidTestRut(): string {
  const body = Math.floor(Math.random() * 99999999) + 10000000; // 8 dígitos
  const rut = body.toString();
  const dv = calculateDV(rut);
  return formatRut(rut + dv);
}

/**
 * Verifica si un RUT ya existe en la base de datos
 */
export async function isRutAvailable(rut: string): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db');
    const normalizedRut = normalizeRut(rut);

    if (!normalizedRut) {
      return false;
    }

    const existingUser = await db.user.findUnique({
      where: { rut: normalizedRut }
    });

    return !existingUser;
  } catch (error) {
    // En caso de error, asumir que está disponible
    return true;
  }
}
