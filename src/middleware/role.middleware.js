/**
 * Middleware untuk authorization berdasarkan role
 * Memastikan user memiliki role yang sesuai untuk mengakses endpoint
 */

/**
 * Check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // User info should be attached by auth middleware
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: 'Authentication required.'
        });
      }

      const userRole = req.user.role;
      
      // Convert to array if single role
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user role is in allowed roles
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: true,
          message: 'Access denied. Insufficient permissions.',
          requiredRoles: roles,
          yourRole: userRole
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: 'Error checking permissions.'
      });
    }
  };
};

/**
 * Shorthand middleware untuk role admin saja
 */
const isAdmin = checkRole('admin');

/**
 * Shorthand middleware untuk role support atau admin
 */
const isSupportOrAdmin = checkRole(['support', 'admin']);

/**
 * Shorthand middleware untuk role client, support, atau admin (semua user)
 */
const isAuthenticated = checkRole(['client', 'support', 'admin']);

/**
 * Check if user owns the resource or is admin/support
 * Used for operations like viewing/editing own tickets
 */
const isOwnerOrSupport = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;
    const userId = req.user.id;
    
    // Admin and support can access any resource
    if (userRole === 'admin' || userRole === 'support') {
      return next();
    }

    // For client, check if they own the resource
    // Resource owner ID should be in req.resourceOwnerId (set by controller)
    if (req.resourceOwnerId && req.resourceOwnerId !== userId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'Error checking ownership.'
    });
  }
};

module.exports = {
  checkRole,
  isAdmin,
  isSupportOrAdmin,
  isAuthenticated,
  isOwnerOrSupport
};
