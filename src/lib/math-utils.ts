/**
 * Utilidades matemáticas centralizadas para Rent360
 * Garantiza cálculos consistentes y precisos en toda la aplicación
 */

import { logger } from './logger';

/**
 * Configuración de precisión para cálculos financieros
 */
export const MATH_CONFIG = {
  DECIMAL_PLACES: 2,
  ROUNDING_MODE: 'ROUND_HALF_UP' as const,
  CURRENCY: 'CLP',
  MAX_SAFE_INTEGER: 9007199254740991,
};

/**
 * Redondea un número a la precisión especificada
 */
export function roundToDecimal(value: number, decimals: number = MATH_CONFIG.DECIMAL_PLACES): number {
  if (!isFinite(value)) {
    logger.warn('Valor no finito pasado a roundToDecimal', { value });
    return 0;
  }

  if (decimals < 0) {
    decimals = 0;
  }

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Redondea hacia arriba (ceiling) a la precisión especificada
 */
export function ceilToDecimal(value: number, decimals: number = MATH_CONFIG.DECIMAL_PLACES): number {
  if (!isFinite(value)) {
    logger.warn('Valor no finito pasado a ceilToDecimal', { value });
    return 0;
  }

  const factor = Math.pow(10, decimals);
  return Math.ceil(value * factor) / factor;
}

/**
 * Redondea hacia abajo (floor) a la precisión especificada
 */
export function floorToDecimal(value: number, decimals: number = MATH_CONFIG.DECIMAL_PLACES): number {
  if (!isFinite(value)) {
    logger.warn('Valor no finito pasado a floorToDecimal', { value });
    return 0;
  }

  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}

/**
 * Suma segura de números de punto flotante
 */
export function safeSum(...values: number[]): number {
  if (values.length === 0) return 0;

  let sum = 0;
  for (const value of values) {
    if (isFinite(value)) {
      sum += value;
    } else {
      logger.warn('Valor no finito ignorado en suma', { value });
    }
  }

  return roundToDecimal(sum);
}

/**
 * Multiplica segura de números
 */
export function safeMultiply(...values: number[]): number {
  if (values.length === 0) return 0;

  let product = 1;
  for (const value of values) {
    if (isFinite(value)) {
      product *= value;
    } else {
      logger.warn('Valor no finito ignorado en multiplicación', { value });
      return 0;
    }
  }

  return roundToDecimal(product);
}

/**
 * Divide segura de números
 */
export function safeDivide(dividend: number, divisor: number, defaultValue: number = 0): number {
  if (!isFinite(dividend) || !isFinite(divisor)) {
    logger.warn('Valores no finitos en división', { dividend, divisor });
    return defaultValue;
  }

  if (divisor === 0) {
    logger.error('División por cero', { dividend, divisor });
    return defaultValue;
  }

  const result = dividend / divisor;
  return roundToDecimal(result);
}

/**
 * Calcula porcentaje de forma segura
 */
export function calculatePercentage(value: number, percentage: number): number {
  if (!isFinite(value) || !isFinite(percentage)) {
    logger.warn('Valores no finitos en cálculo de porcentaje', { value, percentage });
    return 0;
  }

  if (percentage < 0 || percentage > 100) {
    logger.warn('Porcentaje fuera de rango', { percentage });
  }

  const result = value * (percentage / 100);
  return roundToDecimal(result);
}

/**
 * Calcula porcentaje de un total
 */
export function percentageOfTotal(part: number, total: number): number {
  if (!isFinite(part) || !isFinite(total)) {
    logger.warn('Valores no finitos en cálculo de porcentaje del total', { part, total });
    return 0;
  }

  if (total === 0) {
    logger.warn('Total es cero en cálculo de porcentaje', { part, total });
    return 0;
  }

  const result = (part / total) * 100;
  return roundToDecimal(result, 2);
}

/**
 * Calcula promedio seguro
 */
export function safeAverage(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const finiteValues = values.filter(value => isFinite(value));

  if (finiteValues.length === 0) {
    return 0;
  }

  const sum = finiteValues.reduce((acc, val) => acc + val, 0);
  return roundToDecimal(sum / finiteValues.length);
}

/**
 * Calcula el promedio ponderado
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (!Array.isArray(values) || !Array.isArray(weights) || values.length !== weights.length) {
    logger.error('Arrays de valores y pesos deben tener la misma longitud', {
      valuesLength: values.length,
      weightsLength: weights.length
    });
    return 0;
  }

  if (values.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const weight = weights[i];
    if (value !== undefined && weight !== undefined && isFinite(value) && isFinite(weight) && weight >= 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    logger.warn('Peso total es cero en promedio ponderado');
    return 0;
  }

  return roundToDecimal(weightedSum / totalWeight);
}

/**
 * Calcula comisiones de corretaje (Chile: 1-2 meses de arriendo)
 */
export function calculateBrokerageFee(monthlyRent: number, months: number = 1): number {
  if (!isFinite(monthlyRent) || monthlyRent <= 0) {
    logger.warn('Renta mensual inválida para cálculo de comisión', { monthlyRent });
    return 0;
  }

  if (months < 1 || months > 2) {
    logger.warn('Meses de comisión fuera de rango (1-2)', { months });
    months = 1; // Valor por defecto
  }

  const fee = monthlyRent * months;
  return roundToDecimal(fee);
}

/**
 * Calcula el porcentaje de comisión de corretaje
 */
export function calculateBrokeragePercentage(monthlyRent: number, percentage: number): number {
  if (percentage < 0 || percentage > 100) {
    logger.warn('Porcentaje de comisión fuera de rango', { percentage });
    percentage = 1; // 1% por defecto en Chile
  }

  return calculatePercentage(monthlyRent, percentage);
}

/**
 * Calcula intereses por mora (Chile: máximo 3% mensual)
 */
export function calculateLatePaymentInterest(
  amount: number,
  daysLate: number,
  dailyRate: number = 0.03 / 30 // 3% mensual / 30 días
): number {
  if (!isFinite(amount) || amount <= 0) {
    logger.warn('Monto inválido para cálculo de intereses', { amount });
    return 0;
  }

  if (daysLate < 0) {
    logger.warn('Días de atraso negativo', { daysLate });
    return 0;
  }

  if (dailyRate < 0 || dailyRate > 0.001) { // Máximo 0.1% diario
    logger.warn('Tasa diaria fuera de rango', { dailyRate });
    dailyRate = 0.03 / 30; // Valor por defecto
  }

  const interest = amount * dailyRate * daysLate;
  return roundToDecimal(interest);
}

/**
 * Calcula devolución proporcional de garantía
 */
export function calculateProportionalRefund(
  deposit: number,
  totalMonths: number,
  remainingMonths: number,
  hasDamages: boolean = false,
  damageAmount: number = 0
): number {
  if (!isFinite(deposit) || deposit <= 0) {
    logger.warn('Depósito inválido para cálculo de devolución', { deposit });
    return 0;
  }

  if (totalMonths <= 0) {
    logger.warn('Total de meses inválido', { totalMonths });
    return 0;
  }

  if (remainingMonths < 0) {
    logger.warn('Meses restantes negativo', { remainingMonths });
    remainingMonths = 0;
  }

  // Si no quedan meses, devolver todo menos daños
  if (remainingMonths === 0) {
    const refund = hasDamages ? Math.max(0, deposit - damageAmount) : deposit;
    return roundToDecimal(refund);
  }

  // Cálculo proporcional
  const refundRatio = remainingMonths / totalMonths;
  const proportionalRefund = deposit * refundRatio;

  // Restar daños si existen
  const finalRefund = hasDamages ?
    Math.max(0, proportionalRefund - damageAmount) :
    proportionalRefund;

  return roundToDecimal(finalRefund);
}

/**
 * Calcula el precio por metro cuadrado
 */
export function calculatePricePerSquareMeter(price: number, area: number): number {
  if (!isFinite(price) || price <= 0) {
    logger.warn('Precio inválido para cálculo por m²', { price });
    return 0;
  }

  if (!isFinite(area) || area <= 0) {
    logger.warn('Área inválida para cálculo por m²', { area });
    return 0;
  }

  return roundToDecimal(price / area);
}

/**
 * Formatea montos de dinero
 */
export function formatCurrency(amount: number, currency: string = MATH_CONFIG.CURRENCY): string {
  if (!isFinite(amount)) {
    logger.warn('Monto no finito para formateo', { amount });
    return '0';
  }

  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: MATH_CONFIG.DECIMAL_PLACES,
      maximumFractionDigits: MATH_CONFIG.DECIMAL_PLACES,
    }).format(amount);
  } catch (error) {
    logger.error('Error formateando moneda', { amount, currency, error });
    return amount.toFixed(MATH_CONFIG.DECIMAL_PLACES);
  }
}

/**
 * Formatea números con separadores de miles
 */
export function formatNumber(value: number, decimals: number = MATH_CONFIG.DECIMAL_PLACES): string {
  if (!isFinite(value)) {
    logger.warn('Valor no finito para formateo', { value });
    return '0';
  }

  try {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    logger.error('Error formateando número', { value, decimals, error });
    return value.toFixed(decimals);
  }
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    logger.warn('Fechas inválidas para cálculo de diferencia', { startDate, endDate });
    return 0;
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    logger.warn('Fechas no válidas para cálculo de diferencia', { startDate, endDate });
    return 0;
  }

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula meses entre dos fechas
 */
export function monthsBetween(startDate: Date, endDate: Date): number {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    logger.warn('Fechas inválidas para cálculo de meses', { startDate, endDate });
    return 0;
  }

  const yearDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth();

  return Math.max(0, yearDiff * 12 + monthDiff);
}

/**
 * Valida que un número esté dentro de un rango
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return isFinite(value) && value >= min && value <= max;
}

/**
 * Clampa un valor dentro de un rango
 */
export function clamp(value: number, min: number, max: number): number {
  if (!isFinite(value)) {
    logger.warn('Valor no finito para clamp', { value, min, max });
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * Calcula el rendimiento de inversión (ROI)
 */
export function calculateROI(investment: number, returns: number): number {
  if (!isFinite(investment) || investment <= 0) {
    logger.warn('Inversión inválida para cálculo de ROI', { investment });
    return 0;
  }

  if (!isFinite(returns)) {
    logger.warn('Retornos inválidos para cálculo de ROI', { returns });
    return 0;
  }

  const roi = ((returns - investment) / investment) * 100;
  return roundToDecimal(roi, 2);
}

/**
 * Calcula el valor presente neto (VPN/VAN)
 */
export function calculateNPV(initialInvestment: number, cashFlows: number[], discountRate: number): number {
  if (!isFinite(initialInvestment)) {
    logger.warn('Inversión inicial inválida para cálculo de VPN', { initialInvestment });
    return 0;
  }

  if (!Array.isArray(cashFlows) || !isFinite(discountRate)) {
    logger.warn('Parámetros inválidos para cálculo de VPN', { cashFlows, discountRate });
    return 0;
  }

  let npv = -initialInvestment;

  for (let i = 0; i < cashFlows.length; i++) {
    const cashFlow = cashFlows[i];
    if (cashFlow !== undefined && isFinite(cashFlow)) {
      const discountedFlow = cashFlow / Math.pow(1 + discountRate, i + 1);
      npv += discountedFlow;
    }
  }

  return roundToDecimal(npv);
}

/**
 * Genera números aleatorios seguros dentro de un rango
 */
export function randomInRange(min: number, max: number): number {
  if (!isFinite(min) || !isFinite(max) || min >= max) {
    logger.warn('Rango inválido para número aleatorio', { min, max });
    return min || 0;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calcula estadísticas básicas de un array de números
 */
export function calculateStatistics(values: number[]): {
  count: number;
  sum: number;
  average: number;
  median: number;
  min: number;
  max: number;
  variance: number;
  standardDeviation: number;
} {
  if (!Array.isArray(values) || values.length === 0) {
    return {
      count: 0,
      sum: 0,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      variance: 0,
      standardDeviation: 0,
    };
  }

  const finiteValues = values.filter(v => isFinite(v));
  const count = finiteValues.length;

  if (count === 0) {
    return {
      count: 0,
      sum: 0,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      variance: 0,
      standardDeviation: 0,
    };
  }

  const sum = finiteValues.reduce((acc, val) => acc + val, 0);
  const average = sum / count;

  const sorted = [...finiteValues].sort((a, b) => a - b);
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1]! + sorted[count / 2]!) / 2
    : sorted[Math.floor(count / 2)]!;

  const min = sorted[0]!;
  const max = sorted[count - 1]!;

  // Varianza
  const squaredDiffs = finiteValues.map(val => Math.pow(val - average, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;

  const standardDeviation = Math.sqrt(variance);

  return {
    count,
    sum: roundToDecimal(sum),
    average: roundToDecimal(average),
    median: roundToDecimal(median),
    min: roundToDecimal(min),
    max: roundToDecimal(max),
    variance: roundToDecimal(variance),
    standardDeviation: roundToDecimal(standardDeviation),
  };
}
