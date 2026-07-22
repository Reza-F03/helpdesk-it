const jwt = require('jsonwebtoken');

/**
 * Middleware untuk verifikasi JWT token
 * Mengecek Authorization header dan memvalidasi token
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: true,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token format. Use: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expired.'
      });
    }

    return res.status(500).json({
      error: true,
      message: 'Failed to authenticate token.'
    });
  }
};

const supabase = require('../config/supabase');

let cachedGuestUserId = null;

const getGuestUserId = async () => {
  if (cachedGuestUserId) return cachedGuestUserId;
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'client')
      .limit(1)
      .single();
    if (user && user.id) {
      cachedGuestUserId = user.id;
      return cachedGuestUserId;
    }
  } catch (err) {
    console.error('Failed to fetch guest user ID:', err);
  }
  return null;
};

/**
 * Optional auth - tidak wajib login. Jika ada token valid, gunakan info user.
 * Jika tidak ada token, set req.user ke Guest Client.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
          full_name: decoded.full_name,
          isGuest: false
        };
        return next();
      } catch (err) {
        // Fallback to guest if token invalid
      }
    }
    
    // Set default guest user
    const guestId = await getGuestUserId();
    req.user = {
      id: guestId,
      username: 'guest',
      email: 'guest@helpdesk.local',
      role: 'client',
      full_name: 'Guest Client',
      isGuest: true
    };
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  verifyToken,
  optionalAuth
};
