const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const ticketController = require('../controllers/ticket.controller');
const ticketLogController = require('../controllers/ticketLog.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth.middleware');
const { isAdmin, isSupportOrAdmin, isAuthenticated } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validator.middleware');

/**
 * @route   POST /api/tickets
 * @desc    Create new ticket
 * @access  Public / Client (Optional Auth)
 */
router.post(
  '/',
  [
    optionalAuth,
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 5, max: 255 })
      .withMessage('Title must be between 5 and 255 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters long'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters'),
    handleValidationErrors
  ],
  ticketController.createTicket
);

/**
 * @route   GET /api/tickets/stats
 * @desc    Get ticket statistics
 * @access  Public / Client (Optional Auth)
 * IMPORTANT: Must be defined BEFORE /:id route
 */
router.get(
  '/stats',
  [optionalAuth],
  ticketController.getTicketStats
);

/**
 * @route   GET /api/tickets/my-tickets
 * @desc    Get my tickets
 * @access  Public / Client (Optional Auth)
 * IMPORTANT: Must be defined BEFORE /:id route
 */
router.get(
  '/my-tickets',
  [
    optionalAuth,
    query('status')
      .optional()
      .isIn(['open', 'in_progress', 'pending', 'resolved', 'closed'])
      .withMessage('Invalid status'),
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
  ticketController.getMyTickets
);

/**
 * @route   GET /api/tickets
 * @desc    Get all tickets with filters
 * @access  Public / Client (Optional Auth)
 */
router.get(
  '/',
  [
    optionalAuth,
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['open', 'in_progress', 'pending', 'resolved', 'closed'])
      .withMessage('Invalid status'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    query('assigned_to')
      .optional()
      .isUUID()
      .withMessage('Invalid assigned_to ID'),
    query('created_by')
      .optional()
      .isUUID()
      .withMessage('Invalid created_by ID'),
    handleValidationErrors
  ],
  ticketController.getAllTickets
);

/**
 * @route   GET /api/tickets/:id/history
 * @desc    Get ticket history/logs
 * @access  Private (All authenticated users)
 * IMPORTANT: Must be defined BEFORE /:id route
 */
router.get(
  '/:id/history',
  [
    optionalAuth,
    param('id')
      .isUUID()
      .withMessage('Invalid ticket ID'),
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
  ticketLogController.getTicketHistory
);

/**
 * @route   GET /api/tickets/:id/pdf
 * @desc    Download ticket as PDF
 * @access  Public / Client (Optional Auth)
 * IMPORTANT: Must be defined BEFORE /:id route
 */
router.get(
  '/:id/pdf',
  [
    optionalAuth,
    param('id')
      .isUUID()
      .withMessage('Invalid ticket ID'),
    handleValidationErrors
  ],
  ticketController.downloadTicketPDF
);

/**
 * @route   GET /api/tickets/:id/print
 * @desc    Print ticket (view PDF inline)
 * @access  Public / Client (Optional Auth)
 * IMPORTANT: Must be defined BEFORE /:id route
 */
router.get(
  '/:id/print',
  [
    optionalAuth,
    param('id')
      .isUUID()
      .withMessage('Invalid ticket ID'),
    handleValidationErrors
  ],
  ticketController.printTicket
);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket by ID
 * @access  Public / Client (Optional Auth)
 * IMPORTANT: Must be defined LAST among GET routes (catches all other paths)
 */
router.get(
  '/:id',
  [
    optionalAuth,
    param('id')
      .isUUID()
      .withMessage('Invalid ticket ID'),
    handleValidationErrors
  ],
  ticketController.getTicketById
);

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update ticket
 * @access  Private (All authenticated users, with role-based restrictions)
 */
router.put(
  '/:id',
  [
    verifyToken,
    isAuthenticated,
    param('id')
      .isUUID()
      .withMessage('Invalid ticket ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('Title must be between 5 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters long'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('status')
      .optional()
      .isIn(['open', 'in_progress', 'pending', 'resolved', 'closed'])
      .withMessage('Invalid status'),
    body('hasil_perbaikan')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Hasil perbaikan maksimal 5000 karakter'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters'),
    body('assigned_to')
      .optional()
      .custom((value) => {
        if (value === null) return true;
        if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          return true;
        }
        throw new Error('Invalid assigned_to ID');
      }),
    handleValidationErrors
  ],
  ticketController.updateTicket
);

/**
 * @route   PUT /api/tickets/:id/assign
 * @desc    Assign ticket to support
 * @access  Private (Support & Admin)
 */
router.put(
  '/:id/assign',
  [
    verifyToken,
    isSupportOrAdmin,
    param('id')
      .isUUID()
      .withMessage('Invalid ticket ID'),
    body('assigned_to')
      .optional()
      .custom((value) => {
        if (value === null) return true;
        if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          return true;
        }
        throw new Error('Invalid assigned_to ID');
      }),
    handleValidationErrors
  ],
  ticketController.assignTicket
);

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Delete ticket
 * @access  Private (Admin & Support)
 */
router.delete(
  '/:id',
  [
    verifyToken,
    isSupportOrAdmin,
    param('id')
      .isUUID()
      .withMessage('Invalid ticket ID'),
    handleValidationErrors
  ],
  ticketController.deleteTicket
);

module.exports = router;
