// src/api/middleware/auth.js
const { validateUser } = require('../../../users'); // Path to your users.js in the root folder

/**
 * Middleware to check if a user is authenticated via a JWT.
 * Attaches the user object to req.user if valid.
 */
const authRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization; // Expects "Bearer TOKEN"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({
      name: 'AuthorizationHeaderError',
      message: 'Authorization header (Bearer TOKEN) required.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = await validateUser(token);
    if (!user) {
      return res.status(401).send({
        name: 'InvalidTokenError',
        message: 'Invalid or expired token.'
      });
    }
    req.user = user; // Attach the authenticated user to the request
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    // Be careful not to expose sensitive error details in production
    res.status(401).send({
      name: error.name || 'AuthenticationError',
      message: error.message || 'Authentication failed.'
    });
  }
};

module.exports = { authRequired };