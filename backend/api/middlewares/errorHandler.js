const errorHandler = (error, req, res, next) => {
  console.error("Error:", error);

  // Handle database errors
  if (error.code === "23505") {
    // Unique constraint violation
    return res.status(400).json({
      error: "Duplicate entry",
      message: "This entry already exists in the database",
    });
  }

  // Handle rate limit errors
  if (
    error.message === "Too many requests from this IP, please try again later."
  ) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: error.message,
    });
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      message: error.message,
    });
  }

  // Default error handling
  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

module.exports = errorHandler;