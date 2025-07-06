const express = require('express');
const usersRouter = express.Router(); 
const {
  createUser,
  loginUser,
  validateUser, 
  fetchUsers,
  getUserById
} = require('../../users'); 


usersRouter.post('/register', async (req, res, next) => {
  try {
    const { email, username, password, subscription_plan } = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).send({ message: 'Email, username, and password are required for registration.' });
    }
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
});


usersRouter.post('/login', async (req, res, next) => {
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

module.exports = usersRouter;