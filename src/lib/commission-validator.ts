import { CommissionService } from './commission-service';
import { logger } from './logger';

/**
 * Validador de comisiones propuestas por corredores
 * Asegura que no excedan la comisión máxima del sistema
 */
export class CommissionValidator {
  /**
   * Valida que una comisión propuesta no exceda el máximo del sistema
   * @param proposedRate - Comisión propuesta por el corredor (%)
   * @returns { valid: boolean, maxRate?: number, error?: string }
   */
  static async validateProposedCommission(proposedRate: number | null | undefined): Promise<{
    valid: boolean;
    maxRate?: number;
    error?: string;
  }> {
    try {
      // Si no se propone comisión, es válido (usará default)
      if (proposedRate === null || proposedRate === undefined) {
        return { valid: true };
      }

      // Validar que sea un número válido
      if (isNaN(proposedRate) || proposedRate < 0) {
        return {
          valid: false,
          error: 'La comisión propuesta debe ser un número positivo',
        };
      }

      // Obtener configuración del sistema
      const config = await CommissionService.getCommissionConfig();
      const maxRate = config.defaultCommissionRate;

      // Validar que no exceda el máximo
      if (proposedRate > maxRate) {
        logger.warn('Intento de proponer comisión superior al máximo del sistema', {
          proposedRate,
          maxRate,
        });

        return {
          valid: false,
          maxRate,
          error: `La comisión propuesta (${proposedRate}%) excede el máximo permitido (${maxRate}%)`,
        };
      }

      // Comisión válida
      return { valid: true, maxRate };
    } catch (error) {
      logger.error('Error validando comisión propuesta', {
        error: error instanceof Error ? error.message : String(error),
      });

      // En caso de error, ser conservador y rechazar
      return {
        valid: false,
        error: 'Error al validar comisión. Por favor, intenta nuevamente.',
      };
    }
  }

  /**
   * Obtiene la comisión máxima permitida del sistema
   */
  static async getMaxCommissionRate(): Promise<number> {
    try {
      const config = await CommissionService.getCommissionConfig();
      return config.defaultCommissionRate;
    } catch (error) {
      logger.error('Error obteniendo comisión máxima', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 5.0; // Fallback a 5% por seguridad
    }
  }

  /**
   * Mensaje de error amigable para comisión inválida
   */
  static getErrorMessage(proposedRate: number, maxRate: number): string {
    return `La comisión propuesta (${proposedRate}%) excede el máximo permitido por el sistema (${maxRate}%). Por favor, ajusta tu propuesta para estar dentro del rango permitido.`;
  }
}
