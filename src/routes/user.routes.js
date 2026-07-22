const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { isAdmin, isSupportOrAdmin } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validator.middleware');

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Support & Admin)
 */
router.get(
  '/',
  [
    verifyToken,
    isSupportOrAdmin,
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(['admin', 'client', 'support'])
      .withMessage('Invalid role'),
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
    handleValidationErrors
  ],
  userController.getAllUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  [verifyToken, isAdmin],
  userController.getUserStats
);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Private (Support & Admin)
 */
router.get(
  '/role/:role',
  [
    verifyToken,
    isSupportOrAdmin,
    param('role')
      .isIn(['admin', 'client', 'support'])
      .withMessage('Invalid role'),
    handleValidationErrors
  ],
  userController.getUsersByRole
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Support & Admin)
 */
router.get(
  '/:id',
  [
    verifyToken,
    isSupportOrAdmin,
    param('id')
      .isUUID()
      .withMessage('Invalid user ID'),
    handleValidationErrors
  ],
  userController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post(
  '/',
  [
    verifyToken,
    isAdmin,
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('full_name')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters long'),
    body('role')
      .isIn(['admin', 'client', 'support'])
      .withMessage('Invalid role'),
    body('phone')
      .optional()
      .trim(),
    body('department')
      .optional()
      .trim(),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
    handleValidationErrors
  ],
  userController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  [
    verifyToken,
    isAdmin,
    param('id')
      .isUUID()
      .withMessage('Invalid user ID'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters long'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['admin', 'client', 'support'])
      .withMessage('Invalid role'),
    body('phone')
      .optional()
      .trim(),
    body('department')
      .optional()
      .trim(),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    handleValidationErrors
  ],
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  [
    verifyToken,
    isAdmin,
    param('id')
      .isUUID()
      .withMessage('Invalid user ID'),
    handleValidationErrors
  ],
  userController.deleteUser
);

module.exports = router;
