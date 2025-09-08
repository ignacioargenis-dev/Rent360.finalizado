import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private readonly MAX_METRICS = 1000;

  startTimer(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  endTimer(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn('Performance metric not found:', { name });
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: name,
        duration: metric.duration,
        metadata: metric.metadata,
      });
    }

    return metric.duration;
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  getAverageDuration(operationName: string): number {
    const metrics = this.getMetrics().filter(m => m.name === operationName);
    if (metrics.length === 0) return 0;

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / metrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Decorator para medir rendimiento de funciones
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startTimer(metricName, { args: args.length });
      
      try {
        const result = await method.apply(this, args);
        performanceMonitor.endTimer(metricName);
        return result;
      } catch (error) {
        performanceMonitor.endTimer(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}

// Hook para medir rendimiento de componentes React
export function usePerformanceMonitor(componentName: string) {
  const startRender = () => {
    performanceMonitor.startTimer(`${componentName}.render`);
  };

  const endRender = () => {
    performanceMonitor.endTimer(`${componentName}.render`);
  };

  return { startRender, endRender };
}

// Optimización de imágenes
export const imageOptimization = {
  // Lazy loading de imágenes
  lazyLoad: (src: string, alt: string, className?: string) => {
    return {
      src,
      alt,
      className,
      loading: 'lazy',
      decoding: 'async'
    };
  },

  // Optimización de imágenes con diferentes tamaños
  responsiveImage: (src: string, alt: string, sizes: string, className?: string) => {
    return {
      src,
      alt,
      className,
      loading: 'lazy',
      decoding: 'async',
      sizes
    };
  },
};

// Optimización de consultas de base de datos
export const queryOptimization = {
  // Debounce para consultas
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle para consultas
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Cache simple en memoria
  cache: new Map<string, { data: any; timestamp: number; ttl: number }>(),

  setCache: (key: string, data: any, ttl: number = 300000) => {
    queryOptimization.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  getCache: (key: string) => {
    const cached = queryOptimization.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      queryOptimization.cache.delete(key);
      return null;
    }

    return cached.data;
  },

  clearCache: () => {
    queryOptimization.cache.clear();
  },
};

// Optimización de bundle
export const bundleOptimization = {
  // Lazy loading de componentes
  lazyLoadComponent: (importFunc: () => Promise<any>) => {
    // Esta función debe ser usada en componentes React
    return importFunc;
  },

  // Preload de rutas críticas
  preloadRoute: (route: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  },

  // Preload de recursos críticos
  preloadResource: (href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },
};

// Optimización de memoria
export const memoryOptimization = {
  // Limpiar referencias circulares
  cleanupCircularReferences: (obj: any) => {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }));
  },

  // Limpiar arrays grandes
  cleanupLargeArrays: (arrays: any[][], maxSize: number = 1000) => {
    arrays.forEach(array => {
      if (array.length > maxSize) {
        array.splice(0, array.length - maxSize);
      }
    });
  },
};

// Métricas de rendimiento del sistema
export const systemMetrics = {
  getMemoryUsage: () => {
    if (typeof window !== 'undefined') {
      return {
        used: (performance as any).memory?.usedJSHeapSize || 0,
        total: (performance as any).memory?.totalJSHeapSize || 0,
        limit: (performance as any).memory?.jsHeapSizeLimit || 0,
      };
    }
    return null;
  },

  getNetworkInfo: () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
    return null;
  },

  logPerformanceMetrics: () => {
    const memory = systemMetrics.getMemoryUsage();
    const network = systemMetrics.getNetworkInfo();
    const performanceMetrics = performanceMonitor.getMetrics();

    logger.info('System Performance Metrics', {
      memory,
      network,
      performanceMetrics: performanceMetrics.slice(-10), // Last 10 metrics
    });
  },
};

// Configuración de optimización
export const optimizationConfig = {
  // Configuración de caché
  cache: {
    defaultTTL: 300000, // 5 minutes
    maxSize: 1000,
    cleanupInterval: 60000, // 1 minute
  },

  // Configuración de consultas
  queries: {
    debounceDelay: 300,
    throttleLimit: 1000,
    maxRetries: 3,
  },

  // Configuración de imágenes
  images: {
    lazyLoading: true,
    preloadCritical: true,
    maxConcurrent: 3,
  },

  // Configuración de bundle
  bundle: {
    preloadRoutes: ['/dashboard', '/properties', '/users'],
    preloadResources: [
      { href: '/api/properties', as: 'fetch' },
      { href: '/api/users', as: 'fetch' },
    ],
  },
};

// Inicializar optimizaciones
export const initializeOptimizations = () => {
  // Preload rutas críticas
  optimizationConfig.bundle.preloadRoutes.forEach(route => {
    bundleOptimization.preloadRoute(route);
  });

  // Preload recursos críticos
  optimizationConfig.bundle.preloadResources.forEach(resource => {
    bundleOptimization.preloadResource(resource.href, resource.as);
  });

  // Limpiar caché periódicamente
  setInterval(() => {
    queryOptimization.clearCache();
  }, optimizationConfig.cache.cleanupInterval);

  // Log métricas de rendimiento cada 5 minutos
  setInterval(() => {
    systemMetrics.logPerformanceMetrics();
  }, 5 * 60 * 1000);

  logger.info('Performance optimizations initialized');
};
