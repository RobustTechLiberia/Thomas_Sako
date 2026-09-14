/** Application error with an HTTP status code. */
export class AppError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

/** Wraps an async route handler so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/** 404 fallback for unknown routes. */
export const notFound = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
};

/** Centralized error handler. */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof AppError ? err.status : err.status || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error("[error]", err);
  }

  const body = {
    error:
      status >= 500 ? "Internal server error" : err.message || "Request failed",
  };
  if (isServerError && process.env.NODE_ENV !== "production") {
    body.message = err.message;
  }
  if (err.details !== undefined) {
    body.details = err.details;
  }

  res.status(status).json(body);
};

export default AppError;
