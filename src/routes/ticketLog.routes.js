const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const ticketLogController = require('../controllers/ticketLog.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { isAdmin, isSupportOrAdmin, isAuthenticated } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validator.middleware');

/**
 * @route   GET /api/logs
 * @desc    Get all ticket logs with filters
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
    query('ticket_id')
      .optional()
      .isUUID()
      .withMessage('Invalid ticket ID'),
    query('user_id')
      .optional()
      .isUUID()
      .withMessage('Invalid user ID'),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    handleValidationErrors
  ],
  ticketLogController.getAllTicketLogs
);

/**
 * @route   GET /api/logs/stats
 * @desc    Get log statistics
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  [
    verifyToken,
    isAdmin,
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    handleValidationErrors
  ],
  ticketLogController.getLogStats
);

/**
 * @route   GET /api/logs/recent
 * @desc    Get recent activity (last 24 hours)
 * @access  Private (All authenticated users)
 */
router.get(
  '/recent',
  [
    verifyToken,
    isAuthenticated,
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ],
  ticketLogController.getRecentActivity
);

/**
 * @route   GET /api/logs/user/:userId
 * @desc    Get user activity logs
 * @access  Private (Support & Admin, or own activity)
 */
router.get(
  '/user/:userId',
  [
    verifyToken,
    isAuthenticated,
    param('userId')
      .isUUID()
      .withMessage('Invalid user ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ],
  ticketLogController.getUserActivityLogs
);

module.exports = router;
