// Sistema de fallback para errores críticos
export class ErrorFallback {
  static logError(error: Error, context?: string) {
    // Log básico siempre funcional
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error.message,
      stack: error.stack,
      context: context || 'unknown',
    };

    console.error('FALLBACK LOG:', JSON.stringify(logEntry));

    // Intentar enviar a servicio externo si está disponible
    this.sendToExternalService(logEntry).catch(() => {
      // Silenciar errores de logging externo
    });
  }

  static async sendToExternalService(logEntry: any) {
    // Implementar envío a servicio de logging externo
    // como Sentry, LogRocket, etc.
  }
}
