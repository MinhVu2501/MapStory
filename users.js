const client = require('./client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const createUser = async ({ email, username, password, subscription_plan = 'free' }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await client.query(`
      INSERT INTO users (email, username, password_hash, subscription_plan)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, username, subscription_plan;
    `, [email, username, hashedPassword, subscription_plan]);

    return rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('Email or username already exists.');
    }
    console.error('Error in createUser:', error);
    throw new Error('Error creating user: ' + error.message);
  }
};


const loginUser = async (login, password) => {
  try {
    const { rows } = await client.query(`
      SELECT id, email, username, password_hash, subscription_plan FROM users WHERE username = $1 OR email = $1;
    `, [login]);

    const user = rows[0];
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1w' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscription_plan: user.subscription_plan
      }
    };
  } catch (err) {
    console.error('Error in loginUser:', err);
    throw new Error('Login failed: ' + err.message);
  }
};

const validateUser = async (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await client.query(`
      SELECT id, email, username, subscription_plan FROM users WHERE id = $1;
    `, [decoded.id]);

    const user = rows[0];
    if (!user) {
      throw new Error('Invalid token: User not found');
    }
    return user;
  } catch (error) {
    console.error('Error in validateUser:', error);
    throw new Error('Token validation failed: ' + error.message);
  }
};

const fetchUsers = async () => {
  try {
    const { rows } = await client.query(`
      SELECT id, email, username, subscription_plan FROM users;
    `);
    return rows;
  } catch (error) {
    console.error('Error in fetchUsers:', error);
    throw new Error('Error fetching users: ' + error.message);
  }
};

const getUserById = async (id) => {
  try {
    const { rows } = await client.query(`
      SELECT id, email, username, subscription_plan FROM users WHERE id = $1;
    `, [id]);
    return rows[0];
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw new Error('Error fetching user by ID: ' + error.message);
  }
};


const deleteUser = async (userId) => {
  try {
    await client.query(`
      DELETE FROM users WHERE id = $1;
    `, [userId]);
    console.log(`User with ID ${userId} deleted.`);
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw new Error('Error deleting user: ' + error.message);
  }
};

module.exports = {
  createUser,
  loginUser,
  validateUser,
  fetchUsers,
  getUserById,
  deleteUser
};