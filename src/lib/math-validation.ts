/**
 * Validación de cálculos matemáticos para Rent360
 * Verifica que todos los cálculos financieros sean correctos y consistentes
 */

import { logger } from './logger';
import {
  roundToDecimal,
  safeSum,
  safeMultiply,
  safeDivide,
  calculatePercentage,
  calculateBrokerageFee,
  calculateLatePaymentInterest,
  calculateProportionalRefund,
  calculatePricePerSquareMeter,
} from './math-utils';

/**
 * Resultado de validación de cálculo
 */
export interface ValidationResult {
  isValid: boolean;
  expected: number;
  actual: number;
  difference: number;
  tolerance: number;
  error?: string;
}

/**
 * Valida un cálculo matemático
 */
export function validateCalculation(
  expected: number,
  actual: number,
  tolerance: number = 0.01
): ValidationResult {
  const difference = Math.abs(expected - actual);

  return {
    isValid: difference <= tolerance,
    expected: roundToDecimal(expected),
    actual: roundToDecimal(actual),
    difference: roundToDecimal(difference),
    tolerance,
    ...(difference > tolerance
      ? { error: `Diferencia ${difference} excede tolerancia ${tolerance}` }
      : {}),
  };
}

/**
 * Valida cálculos de sumas
 */
export function validateSum(values: number[], expected: number): ValidationResult {
  const actual = safeSum(...values);
  return validateCalculation(expected, actual);
}

/**
 * Valida cálculos de porcentajes
 */
export function validatePercentage(
  value: number,
  percentage: number,
  expected: number
): ValidationResult {
  const actual = calculatePercentage(value, percentage);
  return validateCalculation(expected, actual);
}

/**
 * Valida cálculos de comisiones
 */
export function validateBrokerageFee(
  monthlyRent: number,
  months: number,
  expected: number
): ValidationResult {
  const actual = calculateBrokerageFee(monthlyRent, months);
  return validateCalculation(expected, actual);
}

/**
 * Valida cálculos de intereses por mora
 */
export function validateLatePaymentInterest(
  amount: number,
  daysLate: number,
  dailyRate: number,
  expected: number
): ValidationResult {
  const actual = calculateLatePaymentInterest(amount, daysLate, dailyRate);
  return validateCalculation(expected, actual);
}

/**
 * Valida cálculos de devolución proporcional
 */
export function validateProportionalRefund(
  deposit: number,
  totalMonths: number,
  remainingMonths: number,
  expected: number
): ValidationResult {
  const actual = calculateProportionalRefund(deposit, totalMonths, remainingMonths);
  return validateCalculation(expected, actual);
}

/**
 * Valida cálculos de precio por metro cuadrado
 */
export function validatePricePerSquareMeter(
  price: number,
  area: number,
  expected: number
): ValidationResult {
  const actual = calculatePricePerSquareMeter(price, area);
  return validateCalculation(expected, actual);
}

/**
 * Ejecuta todas las validaciones de cálculos
 */
export function runMathValidations(): {
  total: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
} {
  const validations: ValidationResult[] = [];

  logger.info('Iniciando validaciones de cálculos matemáticos');

  // Validación de sumas
  validations.push(validateSum([100, 200, 300], 600));
  validations.push(validateSum([1.1, 2.2, 3.3], 6.6));
  validations.push(validateSum([], 0));

  // Validación de porcentajes
  validations.push(validatePercentage(1000, 10, 100));
  validations.push(validatePercentage(50000, 1.5, 750));
  validations.push(validatePercentage(0, 50, 0));

  // Validación de comisiones
  validations.push(validateBrokerageFee(500000, 1, 500000));
  validations.push(validateBrokerageFee(300000, 2, 600000));
  validations.push(validateBrokerageFee(0, 1, 0));

  // Validación de intereses por mora
  validations.push(validateLatePaymentInterest(100000, 30, 0.001, 3000));
  validations.push(validateLatePaymentInterest(50000, 15, 0.0005, 375));

  // Validación de devoluciones proporcionales
  validations.push(validateProportionalRefund(1000000, 24, 12, 500000));
  validations.push(validateProportionalRefund(800000, 12, 0, 800000));
  validations.push(validateProportionalRefund(600000, 12, 6, 300000));

  // Validación de precio por m²
  validations.push(validatePricePerSquareMeter(30000000, 80, 375000));
  validations.push(validatePricePerSquareMeter(15000000, 60, 250000));

  const passed = validations.filter(v => v.isValid).length;
  const failed = validations.length - passed;

  // Log resultados
  validations.forEach((result, index) => {
    if (!result.isValid) {
      logger.error(`Validación ${index + 1} fallida`, {
        expected: result.expected,
        actual: result.actual,
        difference: result.difference,
        tolerance: result.tolerance,
        error: result.error,
      });
    }
  });

  logger.info('Validaciones de cálculos matemáticos completadas', {
    total: validations.length,
    passed,
    failed,
    successRate: `${((passed / validations.length) * 100).toFixed(2)}%`,
  });

  return {
    total: validations.length,
    passed,
    failed,
    results: validations,
  };
}

/**
 * Valida cálculos en contratos específicos
 */
export async function validateContractCalculations(contractId: string): Promise<{
  isValid: boolean;
  issues: string[];
  summary: Record<string, any>;
}> {
  try {
    const { db } = await import('../lib/db');

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        payments: true,
        property: true,
      },
    });

    if (!contract) {
      return {
        isValid: false,
        issues: ['Contrato no encontrado'],
        summary: {},
      };
    }

    const issues: string[] = [];
    const summary: Record<string, any> = {
      contractId,
      monthlyRent: contract.monthlyRent,
      deposit: contract.depositAmount,
      totalPayments: contract.payments.length,
    };

    // Validar total de pagos
    const totalPaid = safeSum(
      ...contract.payments.filter(p => p.status === 'COMPLETED').map(p => p.amount)
    );

    const totalPending = safeSum(
      ...contract.payments.filter(p => p.status === 'PENDING').map(p => p.amount)
    );

    summary.totalPaid = totalPaid;
    summary.totalPending = totalPending;

    // Validar que los pagos no excedan el total esperado
    const expectedTotalPayments = contract.monthlyRent * 12; // Asumiendo contrato de 1 año
    const totalPayments = totalPaid + totalPending;

    if (totalPayments > expectedTotalPayments * 1.1) {
      // 10% de tolerancia
      issues.push(
        `Total de pagos (${totalPayments}) excede el esperado (${expectedTotalPayments})`
      );
    }

    // Validar depósito razonable (máximo 2 meses de arriendo)
    if (
      contract.depositAmount !== undefined &&
      contract.monthlyRent !== undefined &&
      contract.depositAmount > contract.monthlyRent * 2
    ) {
      issues.push(
        `Depósito (${contract.depositAmount}) excede 2 meses de arriendo (${contract.monthlyRent * 2})`
      );
    }

    // Validar precio por m² si hay información de área
    if (
      contract.property?.area &&
      contract.property.area > 0 &&
      contract.monthlyRent !== undefined
    ) {
      const pricePerSqm = calculatePricePerSquareMeter(
        contract.monthlyRent * 12,
        contract.property.area
      );
      summary.pricePerSqm = pricePerSqm;

      if (pricePerSqm > 100000) {
        // Muy alto para Santiago
        issues.push(`Precio por m² muy alto: ${pricePerSqm}`);
      }
    }

    const isValid = issues.length === 0;

    logger.info('Validación de cálculos de contrato completada', {
      contractId,
      isValid,
      issuesCount: issues.length,
      summary,
    });

    return {
      isValid,
      issues,
      summary,
    };
  } catch (error) {
    logger.error('Error validando cálculos de contrato', {
      contractId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      isValid: false,
      issues: ['Error interno en validación'],
      summary: { contractId, error: 'Validation failed' },
    };
  }
}

/**
 * Valida cálculos en propiedades específicas
 */
export async function validatePropertyCalculations(propertyId: string): Promise<{
  isValid: boolean;
  issues: string[];
  summary: Record<string, any>;
}> {
  try {
    const { db } = await import('../lib/db');

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        reviews: true,
        contracts: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!property) {
      return {
        isValid: false,
        issues: ['Propiedad no encontrada'],
        summary: {},
      };
    }

    const issues: string[] = [];
    const summary: Record<string, any> = {
      propertyId,
      price: property.price,
      deposit: property.deposit,
      area: property.area,
      totalReviews: property.reviews?.length || 0,
    };

    // Validar relación precio/depósito (depósito máximo 2 meses)
    if (
      property.deposit !== undefined &&
      property.price !== undefined &&
      property.deposit > property.price * 0.1
    ) {
      // 10% del precio total
      issues.push(
        `Depósito (${property.deposit}) excede 10% del precio total (${property.price * 0.1})`
      );
    }

    // Validar precio por m² razonable
    if (property.area && property.area > 0 && property.price !== undefined) {
      const pricePerSqm = calculatePricePerSquareMeter(property.price, property.area);
      summary.pricePerSqm = pricePerSqm;

      // Rangos típicos para Santiago (ajustar según comuna)
      const minPricePerSqm = 50000; // Mínimo razonable
      const maxPricePerSqm = 500000; // Máximo razonable

      if (pricePerSqm < minPricePerSqm) {
        issues.push(`Precio por m² muy bajo: ${pricePerSqm} (mínimo esperado: ${minPricePerSqm})`);
      }

      if (pricePerSqm > maxPricePerSqm) {
        issues.push(`Precio por m² muy alto: ${pricePerSqm} (máximo esperado: ${maxPricePerSqm})`);
      }
    }

    // Validar rating promedio
    if (property.reviews.length > 0) {
      const ratings = property.reviews.map(r => r.rating);
      const averageRating = safeSum(...ratings) / ratings.length;
      summary.averageRating = averageRating;

      if (averageRating < 1 || averageRating > 5) {
        issues.push(`Rating promedio fuera de rango: ${averageRating} (debe ser 1-5)`);
      }
    }

    // Validar que no haya contratos activos con precios inconsistentes
    if (property.contracts.length > 0) {
      const activeContract = property.contracts[0]!;
      if (activeContract && activeContract.monthlyRent !== undefined) {
        const expectedMonthlyRent = Math.round(property.price / 12); // Aproximado

        if (
          Math.abs(activeContract.monthlyRent - expectedMonthlyRent) / expectedMonthlyRent >
          0.2
        ) {
          // 20% de tolerancia
          issues.push(
            `Renta mensual del contrato (${activeContract.monthlyRent}) no coincide con precio esperado (${expectedMonthlyRent})`
          );
        }
      }
    }

    const isValid = issues.length === 0;

    logger.info('Validación de cálculos de propiedad completada', {
      propertyId,
      isValid,
      issuesCount: issues.length,
      summary,
    });

    return {
      isValid,
      issues,
      summary,
    };
  } catch (error) {
    logger.error('Error validando cálculos de propiedad', {
      propertyId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      isValid: false,
      issues: ['Error interno en validación'],
      summary: { propertyId, error: 'Validation failed' },
    };
  }
}

/**
 * Ejecuta validación completa de todos los cálculos del sistema
 */
export async function runCompleteValidation(): Promise<{
  isValid: boolean;
  summary: {
    mathValidations: any;
    contractsValidated: number;
    contractsWithIssues: number;
    propertiesValidated: number;
    propertiesWithIssues: number;
    totalIssues: number;
  };
  issues: string[];
}> {
  logger.info('Iniciando validación completa de cálculos matemáticos');

  const issues: string[] = [];

  // Validaciones matemáticas básicas
  const mathValidations = runMathValidations();
  if (mathValidations.failed > 0) {
    issues.push(`${mathValidations.failed} validaciones matemáticas fallidas`);
  }

  // Validar contratos (últimos 100)
  let contractsValidated = 0;
  let contractsWithIssues = 0;

  try {
    const { db } = await import('../lib/db');
    const contracts = await db.contract.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    for (const contract of contracts) {
      const validation = await validateContractCalculations(contract.id);
      contractsValidated++;

      if (!validation.isValid) {
        contractsWithIssues++;
        issues.push(`Contrato ${contract.id}: ${validation.issues.join(', ')}`);
      }
    }
  } catch (error) {
    logger.error('Error validando contratos', { error });
    issues.push('Error validando contratos');
  }

  // Validar propiedades (últimas 100)
  let propertiesValidated = 0;
  let propertiesWithIssues = 0;

  try {
    const { db } = await import('../lib/db');
    const properties = await db.property.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    for (const property of properties) {
      const validation = await validatePropertyCalculations(property.id);
      propertiesValidated++;

      if (!validation.isValid) {
        propertiesWithIssues++;
        issues.push(`Propiedad ${property.id}: ${validation.issues.join(', ')}`);
      }
    }
  } catch (error) {
    logger.error('Error validando propiedades', { error });
    issues.push('Error validando propiedades');
  }

  const isValid = issues.length === 0;

  logger.info('Validación completa de cálculos finalizada', {
    isValid,
    mathValidations: {
      total: mathValidations.total,
      passed: mathValidations.passed,
      failed: mathValidations.failed,
    },
    contractsValidated,
    contractsWithIssues,
    propertiesValidated,
    propertiesWithIssues,
    totalIssues: issues.length,
  });

  return {
    isValid,
    summary: {
      mathValidations,
      contractsValidated,
      contractsWithIssues,
      propertiesValidated,
      propertiesWithIssues,
      totalIssues: issues.length,
    },
    issues,
  };
}
