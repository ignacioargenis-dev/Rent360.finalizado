/**
 * New Relic Configuration for Rent360 Production
 * Location: ./newrelic.js (in project root)
 */

'use strict';

exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['Rent360 Production'],

  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY,

  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully read the transition guide before you enable this feature.
   * Default is true.
   */
  distributed_tracing: {
    enabled: process.env.NEW_RELIC_DISTRIBUTED_TRACING_ENABLED === 'true'
  },

  /**
   * This setting controls the use of sampling in distributed tracing.
   * Sampling is used to reduce the amount of data sent to New Relic.
   */
  span_events: {
    enabled: true,
    max_samples_stored: 2000
  },

  /**
   * You may want more details about a particular web transaction.
   * Slow query traces provide a breakdown of the query itself and the connection pool.
   */
  slow_sql: {
    enabled: true,
    max_samples: 100
  },

  /**
   * Error collector settings
   */
  error_collector: {
    enabled: process.env.NEW_RELIC_ERROR_COLLECTOR_ENABLED === 'true',
    ignore_status_codes: [404, 401, 403],
    expected_status_codes: [200, 201, 202, 204, 301, 302, 304, 307, 308, 400, 401, 403, 404, 422, 500],
    ignore_classes: ['ValidationError', 'AuthenticationError']
  },

  /**
   * Transaction tracer settings
   */
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'obfuscated',
    explain_threshold: 500,
    explain_enabled: true
  },

  /**
   * Browser monitoring settings
   */
  browser_monitoring: {
    enabled: true,
    loader: 'rum'
  },

  /**
   * Attributes settings - control what data is sent to New Relic
   */
  attributes: {
    enabled: true,
    include: [
      'request.parameters.*',
      'response.statusCode',
      'request.headers.userAgent',
      'request.headers.accept',
      'request.method'
    ],
    exclude: [
      'request.parameters.password',
      'request.parameters.token',
      'request.parameters.apiKey',
      'request.headers.authorization',
      'request.headers.cookie'
    ]
  },

  /**
   * Custom events settings
   */
  custom_insights_events: {
    enabled: true,
    max_samples_stored: 5000
  },

  /**
   * Logging settings
   */
  logging: {
    level: 'info',
    enabled: true,
    filepath: '/var/log/rent360/newrelic.log',
    max_samples_stored: 10000
  },

  /**
   * Rules for ignoring specific transactions
   */
  rules: {
    ignore: [
      '^/api/health',
      '^/api/metrics',
      '^/_next/static',
      '^/favicon.ico'
    ]
  },

  /**
   * Labels for organizing applications
   */
  labels: {
    environment: 'production',
    region: 'santiago',
    datacenter: 'aws',
    team: 'backend'
  },

  /**
   * Application logging settings
   */
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
      max_samples_stored: 10000
    },
    metrics: {
      enabled: true
    },
    local_decorating: {
      enabled: true
    }
  },

  /**
   * AI monitoring settings
   */
  ai_monitoring: {
    enabled: true,
    record_content: {
      enabled: true
    }
  },

  /**
   * Security settings
   */
  security: {
    enabled: true,
    validator_service_url: 'wss://csec.nr-data.net'
  },

  /**
   * High security mode (if enabled, some features may be limited)
   */
  high_security: false,

  /**
   * Proxy settings (if needed)
   */
  proxy: process.env.HTTPS_PROXY || process.env.HTTP_PROXY || null,

  /**
   * Host settings
   */
  host: process.env.NEW_RELIC_HOST || null,
  port: process.env.NEW_RELIC_PORT || null,

  /**
   * Custom event reporting
   */
  custom_events: {
    enabled: true,
    max_samples_stored: 5000
  },

  /**
   * Synthetics monitoring
   */
  synthetics: {
    enabled: true
  },

  /**
   * Utilization detection
   */
  utilization: {
    detect_aws: true,
    detect_azure: false,
    detect_gcp: false,
    detect_docker: true,
    detect_kubernetes: true
  }
};

/**
 * Custom instrumentation for specific functions
 */
exports.instrumentation = {
  /**
   * Database query instrumentation
   */
  prisma: {
    enabled: true
  },

  /**
   * Redis instrumentation
   */
  redis: {
    enabled: true
  },

  /**
   * External API calls instrumentation
   */
  http: {
    enabled: true,
    exclude: [
      'api.datadoghq.com',
      'api.newrelic.com',
      'sentry.io'
    ]
  }
};

/**
 * Custom metrics collection
 */
exports.customMetrics = {
  /**
   * Business metrics
   */
  business: {
    enabled: true,
    events: [
      'user_registration',
      'payment_processed',
      'service_completed',
      'rating_submitted'
    ]
  },

  /**
   * Performance metrics
   */
  performance: {
    enabled: true,
    customTimers: [
      'database_query_time',
      'external_api_call_time',
      'payment_processing_time',
      'file_upload_time'
    ]
  }
};

/**
 * Alert policies configuration (to be set up in New Relic dashboard)
 */
exports.alertPolicies = {
  application: {
    name: 'Rent360 Application Alerts',
    conditions: [
      {
        name: 'High Error Rate',
        type: 'apm_app_metric',
        metric: 'error_rate',
        critical: 5,
        warning: 1
      },
      {
        name: 'Slow Response Time',
        type: 'apm_app_metric',
        metric: 'response_time',
        critical: 5000,
        warning: 2000
      }
    ]
  },

  infrastructure: {
    name: 'Rent360 Infrastructure Alerts',
    conditions: [
      {
        name: 'High CPU Usage',
        type: 'system_metric',
        metric: 'cpu_percent',
        critical: 90,
        warning: 70
      },
      {
        name: 'High Memory Usage',
        type: 'system_metric',
        metric: 'memory_percent',
        critical: 85,
        warning: 70
      }
    ]
  },

  database: {
    name: 'Rent360 Database Alerts',
    conditions: [
      {
        name: 'Slow Database Queries',
        type: 'database_metric',
        metric: 'query_time',
        critical: 1000,
        warning: 500
      }
    ]
  }
};
