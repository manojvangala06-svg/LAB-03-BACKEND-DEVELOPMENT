const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results.
 * If validation fails, responds immediately with HTTP 400 and structured error details.
 * Otherwise passes control to the next middleware/controller.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format error array to provide clear and actionable messages
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value !== undefined ? err.value : null,
      location: err.location,
    }));

    return res.status(400).json({
      message: 'Validation failed: Invalid input provided',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = {
  validate,
};

