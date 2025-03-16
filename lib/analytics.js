import { Analytics } from '@segment/analytics-node';
import { logger } from './logging';

let analytics = null;
let analyticsDisabledReason = null;

// Initialize analytics only if all required parameters are available
function initializeAnalytics() {
  const startTime = logger.performance.start('analytics-init');
  
  try {
    const writeKey = process.env.SEGMENT_WRITE_KEY;
    const isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
    
    logger.debug('Initializing analytics', {
      enabled: isEnabled,
      hasWriteKey: !!writeKey,
    });

    if (!isEnabled) {
      analyticsDisabledReason = 'Analytics is disabled via configuration';
      logger.info('Analytics disabled by configuration');
      return;
    }

    if (!writeKey) {
      analyticsDisabledReason = 'Segment write key is missing';
      logger.warn('Analytics disabled: Missing Segment write key');
      return;
    }

    analytics = new Analytics({
      writeKey,
      maxEventsInBatch: 100,
      flushInterval: 10000, // 10 seconds
      maxRetries: 3
    });

    analyticsDisabledReason = null;
    logger.info('Analytics initialized successfully', {
      processingTime: logger.performance.end('analytics-init', startTime),
    });
  } catch (error) {
    logger.error('Failed to initialize analytics', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end('analytics-init', startTime),
    });
    analyticsDisabledReason = 'Analytics initialization failed';
  }
}

// Initialize on module load
initializeAnalytics();

// Helper to check if analytics is available
function isAnalyticsAvailable() {
  if (!analytics) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Analytics disabled: ${analyticsDisabledReason}`);
    }
    return false;
  }
  return true;
}

export async function trackEvent(eventName, eventData = {}) {
  const startTime = logger.performance.start(`analytics-track-${eventName}`);
  
  try {
    // Always log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Event tracked', {
        eventName,
        eventData,
        analyticsStatus: analyticsDisabledReason || 'enabled',
      });
    }
    
    if (!isAnalyticsAvailable()) {
      return;
    }

    const payload = {
      event: eventName,
      properties: {
        ...eventData,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    };

    await analytics.track(payload);
    
    logger.info('Event tracked successfully', {
      eventName,
      processingTime: logger.performance.end(`analytics-track-${eventName}`, startTime),
    });
  } catch (error) {
    logger.error('Analytics tracking error', {
      eventName,
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end(`analytics-track-${eventName}`, startTime),
    });
  }
}

async function trackGoogleAnalytics(event, properties) {
  // Implementation for Google Analytics tracking
  // This is just a placeholder - implement according to your needs
  const ga4Event = transformToGA4Event(event, properties);
  // Send to GA4
}

// Helper function to transform events to GA4 format
function transformToGA4Event(event, properties) {
  const eventMappings = {
    'subscription_created': 'purchase',
    'subscription_cancelled': 'refund',
    'subscription_updated': 'subscription_update',
    'subscription_payment_failed': 'payment_failure'
  };

  return {
    name: eventMappings[event] || event,
    params: {
      ...properties,
      currency: 'USD',
      // Add any additional parameters needed for GA4
    }
  };
}

export function identifyUser(userId, traits = {}) {
  const startTime = logger.performance.start('analytics-identify');
  
  try {
    if (!userId || !isAnalyticsAvailable()) {
      return;
    }

    logger.debug('Identifying user', {
      userId,
      traitsKeys: Object.keys(traits),
    });

    analytics.identify({
      userId,
      traits: {
        ...traits,
        updatedAt: new Date().toISOString()
      }
    });

    logger.info('User identified successfully', {
      userId,
      processingTime: logger.performance.end('analytics-identify', startTime),
    });
  } catch (error) {
    logger.error('Error identifying user', {
      userId,
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end('analytics-identify', startTime),
    });
  }
}

export function trackPageView(page, properties = {}) {
  const startTime = logger.performance.start('analytics-page-view');
  
  try {
    if (!isAnalyticsAvailable()) {
      return;
    }

    logger.debug('Tracking page view', {
      page,
      propertiesKeys: Object.keys(properties),
    });

    analytics.page({
      name: page,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString()
      }
    });

    logger.info('Page view tracked successfully', {
      page,
      processingTime: logger.performance.end('analytics-page-view', startTime),
    });
  } catch (error) {
    logger.error('Error tracking page view', {
      page,
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end('analytics-page-view', startTime),
    });
  }
}

// Ensure analytics is properly closed when the application shuts down
process.on('beforeExit', async () => {
  if (analytics) {
    const startTime = logger.performance.start('analytics-shutdown');
    
    try {
      await analytics.closeAndFlush();
      logger.info('Analytics flushed successfully', {
        processingTime: logger.performance.end('analytics-shutdown', startTime),
      });
    } catch (error) {
      logger.error('Error flushing analytics', {
        error: {
          message: error.message,
          stack: error.stack,
        },
        processingTime: logger.performance.end('analytics-shutdown', startTime),
      });
    }
  }
}); 