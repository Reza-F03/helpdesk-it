const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const commentController = require('../controllers/comment.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth.middleware');
const { isAdmin, isAuthenticated } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validator.middleware');

/**
 * @route   POST /api/comments
 * @desc    Create comment on ticket
 * @access  Public / Client (Optional Auth)
 */
router.post(
  '/',
  [
    optionalAuth,
    body('ticket_id')
      .isUUID()
      .withMessage('Valid ticket ID is required'),
    body('comment')
      .trim()
      .notEmpty()
      .withMessage('Comment is required')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Comment must be between 1 and 2000 characters'),
    body('is_internal')
      .optional()
      .isBoolean()
      .withMessage('is_internal must be a boolean'),
    handleValidationErrors
  ],
  commentController.createComment
);

/**
 * @route   GET /api/comments/ticket/:ticketId
 * @desc    Get comments by ticket ID
 * @access  Public / Client (Optional Auth)
 */
router.get(
  '/ticket/:ticketId',
  [
    optionalAuth,
    param('ticketId')
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
  commentController.getCommentsByTicket
);

/**
 * @route   GET /api/comments/ticket/:ticketId/stats
 * @desc    Get comment statistics for a ticket
 * @access  Private (All authenticated users)
 */
router.get(
  '/ticket/:ticketId/stats',
  [
    verifyToken,
    isAuthenticated,
    param('ticketId')
      .isUUID()
      .withMessage('Invalid ticket ID'),
    handleValidationErrors
  ],
  commentController.getCommentStats
);

/**
 * @route   GET /api/comments/:id
 * @desc    Get comment by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  [
    verifyToken,
    isAuthenticated,
    param('id')
      .isUUID()
      .withMessage('Invalid comment ID'),
    handleValidationErrors
  ],
  commentController.getCommentById
);

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private (Comment owner or Admin)
 */
router.put(
  '/:id',
  [
    verifyToken,
    isAuthenticated,
    param('id')
      .isUUID()
      .withMessage('Invalid comment ID'),
    body('comment')
      .optional()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Comment must be between 1 and 2000 characters'),
    body('is_internal')
      .optional()
      .isBoolean()
      .withMessage('is_internal must be a boolean'),
    handleValidationErrors
  ],
  commentController.updateComment
);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private (Comment owner or Admin)
 */
router.delete(
  '/:id',
  [
    verifyToken,
    isAuthenticated,
    param('id')
      .isUUID()
      .withMessage('Invalid comment ID'),
    handleValidationErrors
  ],
  commentController.deleteComment
);

module.exports = router;
