const express = require('express');
const usersRouter = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const {
  createUser,
  loginUser,
  validateUser,
  fetchUsers,
  getUserById
} = require('../../users'); //

const {
    fetchMaps
} = require('../db/maps');

const { authRequired } = require('./middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message:
    'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false, 
});

usersRouter.post(
  '/register',
  [ 
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(), 
    body('username')
      .trim() 
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),
  ],
  async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, username, password, subscription_plan } = req.body;
      const newUser = await createUser({ email, username, password, subscription_plan });

      const { password_hash, ...userWithoutHash } = newUser;
      res.status(201).send(userWithoutHash);
    } catch (error) {
      if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        error.status = 409;
        error.message = 'Email already registered.';
      } else if (error.message.includes('duplicate key value violates unique constraint "users_username_key"')) {
          error.status = 409;
          error.message = 'Username already taken.';
      }
      next(error);
    }
  }
);

usersRouter.post('/login', loginLimiter, async (req, res, next) => { 
  try {
    const { login, password } = req.body;
    if (!login || !password) {
        return res.status(400).send({ message: 'Login (email/username) and password are required.' });
    }
    const result = await loginUser(login, password);
    res.send(result);
  } catch (error) {

    if (error.message.includes('Invalid credentials') || error.message.includes('not found')) {
      error.status = 401;
    }
    next(error);
  }
});



usersRouter.get('/', async (req, res, next) => {
    try {
        const users = await fetchUsers();

        const usersWithoutHashes = users.map(user => {
            const { password_hash, ...rest } = user;
            return rest;
        });
        res.send(usersWithoutHashes);
    } catch (error) {
        next(error);
    }
});


usersRouter.get('/:id', async (req, res, next) => {
    try {
        const user = await getUserById(req.params.id);
        if (user) {
            const { password_hash, ...userWithoutHash } = user;
            res.send(userWithoutHash);
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
});


usersRouter.get('/me/maps', authRequired, async (req, res, next) => {
  try {

    const userId = req.user.id;
    const searchTerm = req.query.search;
    const maps = await fetchMaps(userId, searchTerm);
    res.send(maps);
  } catch (error) {
    next(error);
  }
});


module.exports = usersRouter;