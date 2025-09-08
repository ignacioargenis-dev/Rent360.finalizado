/**
 * Sentry Configuration for Rent360 Production
 * Location: ./config/sentry.js
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'production';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'rent360@v1.0.0';
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');

Sentry.init({
  // Core configuration
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  release: SENTRY_RELEASE,

  // Performance monitoring
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  profilesSampleRate: 1.0, // Profile 100% of transactions in production

  // Sampling configuration
  tracesSampler: (samplingContext) => {
    // Ignore health checks
    if (samplingContext.request?.url?.includes('/api/health')) {
      return 0;
    }

    // Sample database queries at lower rate
    if (samplingContext.request?.url?.includes('/api/db')) {
      return 0.1;
    }

    // Sample payment operations at higher rate
    if (samplingContext.request?.url?.includes('/api/payments')) {
      return 0.5;
    }

    // Default sampling rate
    return SENTRY_TRACES_SAMPLE_RATE;
  },

  // Error tracking configuration
  beforeSend: (event, hint) => {
    // Filter out sensitive information
    if (event.request?.data) {
      // Remove sensitive fields from request data
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
      const filteredData = { ...event.request.data };

      sensitiveFields.forEach(field => {
        if (filteredData[field]) {
          filteredData[field] = '[REDACTED]';
        }
      });

      event.request.data = filteredData;
    }

    // Filter out validation errors that are expected
    if (hint.originalException?.name === 'ValidationError') {
      // Still track validation errors but at lower level
      event.level = 'warning';
    }

    return event;
  },

  // Integrations configuration
  integrations: [
    // HTTP integration for tracking external API calls
    Sentry.httpIntegration({
      shouldCreateTransactionForRequest: (request) => {
        // Don't create transactions for health checks or static assets
        return !request.url?.includes('/api/health') &&
               !request.url?.includes('/_next/static') &&
               !request.url?.includes('/favicon.ico');
      }
    }),

    // Database integration (if using Prisma)
    Sentry.prismaIntegration(),

    // Redis integration (if using Redis)
    // Note: You'll need to add @sentry/integrations if using Redis directly

    // GraphQL integration (if using GraphQL)
    // Sentry.graphqlIntegration()
  ],

  // Custom error filtering
  ignoreErrors: [
    // Ignore network errors that are expected
    'Network request failed',
    'Failed to fetch',
    'Load failed',

    // Ignore validation errors that are handled gracefully
    'ValidationError',

    // Ignore browser extension errors
    'Non-Error promise rejection captured',
    'Object captured as promise rejection'
  ],

  // Custom error denylisting
  denyUrls: [
    // Ignore errors from third-party scripts
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /googlesyndication\.com/i,
    /doubleclick\.net/i,
    /facebook\.com/i,
    /facebook\.net/i,

    // Ignore CDN errors
    /cdn\./i,
    /cloudflare\.com/i,
    /jsdelivr\.net/i
  ],

  // Breadcrumbs configuration
  maxBreadcrumbs: 100,

  // Context and tags
  initialScope: {
    tags: {
      environment: SENTRY_ENVIRONMENT,
      service: 'rent360',
      region: 'santiago',
      datacenter: 'aws'
    },
    user: {
      id: 'system'
    }
  },

  // Custom fingerprinting for grouping similar errors
  beforeSendTransaction: (transaction) => {
    // Group database errors by operation type
    if (transaction.tags?.operation) {
      transaction.fingerprint = [
        'database_operation',
        transaction.tags.operation
      ];
    }

    // Group API errors by endpoint
    if (transaction.request?.url) {
      const url = new URL(transaction.request.url);
      transaction.fingerprint = [
        'api_endpoint',
        `${transaction.request.method} ${url.pathname}`
      ];
    }

    return transaction;
  },

  // Debug mode (should be false in production)
  debug: process.env.NODE_ENV === 'development',

  // Server-side configuration
  serverName: 'rent360-prod-server',

  // Release health tracking
  enableTracing: true,
  attachStacktrace: true,

  // Performance monitoring
  _experiments: {
    // Enable new performance features
    enableProfiling: true,
    enableMetrics: true,
    enableReplay: true
  }
});

/**
 * Custom error reporting functions
 */
export const reportError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Add custom context
    Object.keys(context).forEach(key => {
      scope.setTag(key, context[key]);
    });

    // Set user context if available
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    // Set level based on error type
    if (error.name === 'ValidationError') {
      scope.setLevel('warning');
    } else if (error.status >= 500) {
      scope.setLevel('error');
    } else if (error.status >= 400) {
      scope.setLevel('warning');
    }

    Sentry.captureException(error);
  });
};

/**
 * Performance monitoring functions
 */
export const startTransaction = (name, operation) => {
  return Sentry.startTransaction({
    name,
    op: operation
  });
};

/**
 * User feedback collection
 */
export const captureUserFeedback = (feedback) => {
  Sentry.captureMessage('User Feedback', {
    level: 'info',
    tags: {
      type: 'user_feedback',
      category: feedback.category || 'general'
    },
    extra: {
      message: feedback.message,
      email: feedback.email,
      url: feedback.url,
      userAgent: feedback.userAgent
    }
  });
};

/**
 * Business metrics tracking
 */
export const trackBusinessMetric = (metric, value, tags = {}) => {
  Sentry.metrics.increment(metric, value, {
    tags: {
      environment: SENTRY_ENVIRONMENT,
      ...tags
    }
  });
};

/**
 * Custom error boundaries
 */
export class SentryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.withScope((scope) => {
      scope.setTag('component', 'ErrorBoundary');
      Object.keys(errorInfo).forEach(key => {
        scope.setContext(key, errorInfo[key]);
      });
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Algo salió mal
            </h2>
            <p className="text-gray-600 mb-4">
              Hemos registrado este error y estamos trabajando para solucionarlo.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Sentry;
