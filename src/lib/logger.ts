/**
 * Global logger utility for the frontend.
 * Provides a centralized way to log errors, warnings, and info messages.
 * Can be extended later to send logs to an external service (e.g., Sentry, Datadog).
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
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
      // In production, we could send this to a logging service
      // For now, just use console.error for errors to ensure they are captured by basic monitoring
      if (level === 'error') {
        console.error(JSON.stringify(logData))
      } else {
        // Optional: console.log(JSON.stringify(logData))
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
