const jwt = require('jsonwebtoken');

/**
 * Generate JWT token untuk user
 * @param {Object} user - User object dari database
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };

  const options = {
    expiresIn: '24h' // Token berlaku 24 jam
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Generate refresh token (optional, untuk future enhancement)
 * @param {Object} user - User object dari database
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  const options = {
    expiresIn: '7d' // Refresh token berlaku 7 hari
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken
};
