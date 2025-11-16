/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: [process.env.NEW_RELIC_APP_NAME || 'node-architecture'],

  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'your_license_key_here',

  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully consult the transition guide before you enable
   * this feature: https://docs.newrelic.com/docs/transition-guide-distributed-tracing
   * Default is true.
   */
  distributed_tracing: {
    /**
     * Enables/disables distributed tracing.
     *
     * @env NEW_RELIC_DISTRIBUTED_TRACING_ENABLED
     */
    enabled: process.env.NEW_RELIC_DISTRIBUTED_TRACING_ENABLED === 'true' || true,
  },

  /**
   * Logging level. 'trace' is most useful to New Relic when diagnosing
   * issues with the agent, 'info' and higher will impose the least overhead on
   * production applications.
   */
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     * Valid values: fatal, error, warn, info, debug, trace
     */
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',

    /**
     * Whether to write to a log file.
     */
    enabled: process.env.NEW_RELIC_LOGGING_ENABLED === 'true' || true,

    /**
     * Where to put the log file
     */
    filepath: 'newrelic_agent.log',
  },

  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,

  /**
   * Attributes configuration
   */
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end.
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },

  /**
   * Application logging configuration
   */
  application_logging: {
    /**
     * Enables/disables application logging features
     */
    enabled: true,

    /**
     * Enables/disables forwarding of application logs to New Relic
     */
    forwarding: {
      enabled: true,
      /**
       * Maximum number of log records to send per minute to New Relic
       */
      max_samples_stored: 10000,
    },

    /**
     * Enables/disables log metrics
     */
    metrics: {
      enabled: true,
    },

    /**
     * Enables/disables local log decoration
     */
    local_decorating: {
      enabled: false,
    },
  },

  /**
   * Transaction tracer configuration
   */
  transaction_tracer: {
    /**
     * Whether to enable transaction tracer
     */
    enabled: true,

    /**
     * Threshold in seconds. When the response time of a transaction
     * exceeds this threshold, a trace will be recorded.
     */
    transaction_threshold: 'apdex_f',

    /**
     * Maximum number of transaction trace segments to capture
     */
    top_n: 20,
  },

  /**
   * Error collector configuration
   */
  error_collector: {
    /**
     * Whether to enable error collector
     */
    enabled: true,

    /**
     * HTTP status codes to ignore
     */
    ignore_status_codes: [400, 401, 403, 404],

    /**
     * Maximum number of errors per harvest cycle
     */
    max_event_samples_stored: 100,
  },

  /**
   * Slow SQL configuration
   */
  slow_sql: {
    enabled: true,
    max_samples: 10,
  },

  /**
   * Browser monitoring configuration
   */
  browser_monitoring: {
    enable: true,
  },

  /**
   * Custom Insights Events configuration
   */
  custom_insights_events: {
    enabled: true,
    max_samples_stored: 10000,
  },
}
