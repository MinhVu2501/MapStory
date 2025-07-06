// src/api/users.js
const express = require('express');
const usersRouter = express.Router(); // This creates an Express Router
const {
  createUser,
  loginUser,
  validateUser, // You might need this for later middleware if not global
  fetchUsers,
  getUserById
} = require('../../users'); // Path to your users.js in the root folder

// Optional: Import auth middleware if you plan to protect user routes later
// const { authRequired } = require('./middleware/auth');

// POST /api/users/register
usersRouter.post('/register', async (req, res, next) => {
  try {
    const { email, username, password, subscription_plan } = req.body;
    // Basic validation
    if (!email || !username || !password) {
      return res.status(400).send({ message: 'Email, username, and password are required for registration.' });
    }
    const newUser = await createUser({ email, username, password, subscription_plan });
    // IMPORTANT: Do NOT send back password_hash for security
    const { password_hash, ...userWithoutHash } = newUser;
    res.status(201).send(userWithoutHash);
  } catch (error) {
    // Check for unique constraint errors
    if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
      error.status = 409; // Conflict
      error.message = 'Email already registered.';
    } else if (error.message.includes('duplicate key value violates unique constraint "users_username_key"')) {
        error.status = 409; // Conflict
        error.message = 'Username already taken.';
    }
    next(error); // Pass error to central error handling middleware
  }
});

// POST /api/users/login
usersRouter.post('/login', async (req, res, next) => {
  try {
    const { login, password } = req.body; // 'login' can be email or username
    if (!login || !password) {
        return res.status(400).send({ message: 'Login (email/username) and password are required.' });
    }
    const result = await loginUser(login, password);
    res.send(result); // This result should contain { token, user }
  } catch (error) {
    // Specific error handling for login (e.g., 401 for bad credentials)
    if (error.message.includes('Invalid credentials') || error.message.includes('not found')) {
      error.status = 401; // Unauthorized
    }
    next(error);
  }
});

// GET /api/users (e.g., for admin or public list, consider protecting this later with authRequired)
usersRouter.get('/', async (req, res, next) => {
    try {
        const users = await fetchUsers();
        // Filter out password hashes before sending
        const usersWithoutHashes = users.map(user => {
            const { password_hash, ...rest } = user;
            return rest;
        });
        res.send(usersWithoutHashes);
    } catch (error) {
        next(error);
    }
});

// GET /api/users/:id (e.g., fetch a specific user, ensure user can only fetch their own if not admin)
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

module.exports = usersRouter; // Export the router instance