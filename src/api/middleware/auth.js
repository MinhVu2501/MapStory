const { validateUser } = require('../../../users'); 


const authRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization; 

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
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    
    res.status(401).send({
      name: error.name || 'AuthenticationError',
      message: error.message || 'Authentication failed.'
    });
  }
};

module.exports = { authRequired };