// Structured logger for production. Wraps console.error behind NODE_ENV check.

export const logger = {
  error(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(message, context ?? "");
    }
    // In production, swap this with Sentry, Pino, or any structured logging service
    // e.g. Sentry.captureException(new Error(message), { extra: context });
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.warn(message, context ?? "");
    }
  },
};
