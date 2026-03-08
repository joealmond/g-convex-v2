/**
 * Global logger utility for the frontend.
 * Provides a centralized way to log errors, warnings, and info messages.
 * Integrates with Sentry for production error tracking.
 */
type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

let sentryModulePromise: Promise<typeof import('@sentry/react')> | null = null

function getSentryModule() {
  if (!sentryModulePromise) {
    sentryModulePromise = import('@sentry/react')
  }

  return sentryModulePromise
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...(context ? { context } : {}),
      ...(error ? { error } : {}),
    }

    // In development, log to console with formatting
    if (import.meta.env.DEV) {
      switch (level) {
        case 'info':
          console.info(`[${timestamp}] INFO: ${message}`, context || '')
          break
        case 'warn':
          console.warn(`[${timestamp}] WARN: ${message}`, context || '')
          break
        case 'error':
          console.error(`[${timestamp}] ERROR: ${message}`, context || '', error || '')
          break
      }
    } else {
      // In production, we send this to a logging service (Sentry)
      if (level === 'error') {
        console.error(JSON.stringify(logData))
        void getSentryModule().then((Sentry) => {
          Sentry.captureException(error || new Error(message), {
            extra: context,
          })
        })
      } else {
        // Optional: console.log(JSON.stringify(logData))
        if (level === 'warn') {
          void getSentryModule().then((Sentry) => {
            Sentry.captureMessage(message, { level: 'warning', extra: context })
          })
        }
      }
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: unknown, context?: LogContext) {
    this.log('error', message, context, error)
  }
}

export const logger = new Logger()
