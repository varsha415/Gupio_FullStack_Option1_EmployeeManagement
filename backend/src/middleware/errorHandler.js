export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
    message: `No endpoint matches ${req.method} ${req.originalUrl}.`,
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON", message: "Request body must be valid JSON." });
  }

  console.error(err);
  const status = Number.isInteger(err.status) && err.status >= 400 ? err.status : 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : err.error || "Request failed",
    message: status === 500 ? "The server could not complete the request." : err.message,
  });
}