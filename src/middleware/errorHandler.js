/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)

  // Default error response
  let statusCode = 500
  let message = 'Internal server error'
  let details = null

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation error'
    details = err.details
  } else if (err.message.includes('OpenAI')) {
    statusCode = 502
    message = 'External service error'
    details = 'OpenAI API error'
  } else if (err.message.includes('Cohere')) {
    statusCode = 502
    message = 'External service error'
    details = 'Cohere API error'
  } else if (err.message.includes('Supabase') || err.message.includes('Database')) {
    statusCode = 503
    message = 'Database error'
    details = 'Database connection or query error'
  } else if (err.message.includes('rate limit')) {
    statusCode = 429
    message = 'Rate limit exceeded'
  } else if (err.statusCode) {
    statusCode = err.statusCode
    message = err.message
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  })
}