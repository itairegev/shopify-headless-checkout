// Logging levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Get current log level from environment or default to INFO
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
};

// Format the log message with timestamp and metadata
const formatLogMessage = (level, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const formattedMetadata = Object.keys(metadata).length
    ? `\n${JSON.stringify(metadata, null, 2)}`
    : '';
  
  return `[${timestamp}] ${level}: ${message}${formattedMetadata}`;
};

// Main logging function
const log = (level, message, metadata = {}) => {
  const currentLevel = getCurrentLogLevel();
  
  if (LOG_LEVELS[level] <= currentLevel) {
    const formattedMessage = formatLogMessage(level, message, metadata);
    
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
    }
  }
};

// Performance monitoring using Web Performance API
const startPerformanceTimer = (label) => {
  performance.mark(`${label}-start`);
  return performance.now();
};

const endPerformanceTimer = (label, startTime) => {
  performance.mark(`${label}-end`);
  try {
    performance.measure(label, `${label}-start`, `${label}-end`);
  } catch (e) {
    // Ignore measurement errors
  }
  return performance.now() - startTime;
};

// Exported logging functions
export const logger = {
  error: (message, metadata = {}) => log('ERROR', message, metadata),
  warn: (message, metadata = {}) => log('WARN', message, metadata),
  info: (message, metadata = {}) => log('INFO', message, metadata),
  debug: (message, metadata = {}) => log('DEBUG', message, metadata),
  performance: {
    start: startPerformanceTimer,
    end: endPerformanceTimer,
  },
};

// Request logging middleware
export const requestLogger = (handler) => {
  return async (req, res) => {
    const startTime = logger.performance.start('request');
    const requestId = crypto.randomUUID();
    
    const logMetadata = {
      requestId,
      method: req.method,
      url: req.url,
      query: req.query,
    };
    
    // Don't log headers and body in production for security
    if (process.env.NODE_ENV === 'development') {
      logMetadata.headers = req.headers;
      if (req.body) {
        logMetadata.body = req.body;
      }
    }
    
    logger.info(`Incoming request`, logMetadata);
    
    try {
      const response = await handler(req, res);
      
      const duration = logger.performance.end('request', startTime);
      logger.info(`Request completed`, {
        ...logMetadata,
        duration,
        statusCode: res.statusCode,
      });
      
      return response;
    } catch (error) {
      const duration = logger.performance.end('request', startTime);
      logger.error(`Request failed`, {
        ...logMetadata,
        duration,
        error: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      });
      throw error;
    }
  };
}; 