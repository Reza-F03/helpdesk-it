const supabase = require('../config/supabase');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.helper');

/**
 * Create comment on ticket
 * POST /api/comments
 */
const createComment = async (req, res) => {
  try {
    const { ticket_id, comment, is_internal, author_name } = req.body;
    const userId = req.user && !req.user.isGuest ? req.user.id : (req.user?.id || null);
    const userRole = req.user ? req.user.role : 'client';

    // Check if ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, created_by, status')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check access - authenticated client can only comment on their own tickets
    if (userRole === 'client' && req.user && !req.user.isGuest && ticket.created_by !== userId) {
      return errorResponse(res, 'Access denied. You can only comment on your own tickets.', 403);
    }

    // Only support and admin can create internal comments
    const isInternalComment = is_internal && (userRole === 'support' || userRole === 'admin');

    // Create comment
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert([
        {
          ticket_id,
          user_id: userId,
          author_name: author_name || req.user?.full_name || 'Guest Client',
          comment,
          is_internal: isInternalComment
        }
      ])
      .select(`
        *,
        user:user_id(id, username, full_name, email, role),
        ticket:ticket_id(id, ticket_number, title)
      `)
      .single();

    if (insertError) {
      console.error('Create comment error:', insertError);
      return errorResponse(res, 'Failed to create comment', 500);
    }

    return successResponse(res, newComment, 'Comment created successfully', 201);
  } catch (error) {
    console.error('Create comment error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get comments by ticket ID
 * GET /api/comments/ticket/:ticketId
 */
const getCommentsByTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const offset = (page - 1) * limit;

    // Check if ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, created_by')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check access - authenticated client can only view comments on their own tickets
    if (userRole === 'client' && !req.user.isGuest && ticket.created_by !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Build query
    let query = supabase
      .from('comments')
      .select(`
        *,
        user:user_id(id, username, full_name, email, role)
      `, { count: 'exact' })
      .eq('ticket_id', ticketId);

    // Client cannot see internal comments
    if (userRole === 'client') {
      query = query.eq('is_internal', false);
    }

    // Apply pagination
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: true });

    const { data: comments, error, count } = await query;

    if (error) {
      console.error('Get comments error:', error);
      return errorResponse(res, 'Failed to retrieve comments', 500);
    }

    return paginatedResponse(
      res,
      comments,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      },
      'Comments retrieved successfully'
    );
  } catch (error) {
    console.error('Get comments by ticket error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get comment by ID
 * GET /api/comments/:id
 */
const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data: comment, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_id(id, username, full_name, email, role),
        ticket:ticket_id(id, ticket_number, title, created_by)
      `)
      .eq('id', id)
      .single();

    if (error || !comment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    // Check access
    // Client can only view comments on their own tickets and non-internal comments
    if (userRole === 'client') {
      if (comment.ticket.created_by !== userId) {
        return errorResponse(res, 'Access denied', 403);
      }
      if (comment.is_internal) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    return successResponse(res, comment, 'Comment retrieved successfully');
  } catch (error) {
    console.error('Get comment by ID error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Update comment
 * PUT /api/comments/:id
 */
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, is_internal } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get existing comment
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('*, ticket:ticket_id(created_by)')
      .eq('id', id)
      .single();

    if (fetchError || !existingComment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    // Check permissions
    // User can only update their own comments
    // Admin can update any comment
    if (userRole !== 'admin' && existingComment.user_id !== userId) {
      return errorResponse(res, 'Access denied. You can only update your own comments.', 403);
    }

    // Build update data
    const updateData = {};
    if (comment !== undefined) updateData.comment = comment;

    // Only support and admin can change is_internal flag
    if (is_internal !== undefined && (userRole === 'support' || userRole === 'admin')) {
      updateData.is_internal = is_internal;
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:user_id(id, username, full_name, email, role),
        ticket:ticket_id(id, ticket_number, title)
      `)
      .single();

    if (updateError) {
      console.error('Update comment error:', updateError);
      return errorResponse(res, 'Failed to update comment', 500);
    }

    return successResponse(res, updatedComment, 'Comment updated successfully');
  } catch (error) {
    console.error('Update comment error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Delete comment
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get existing comment
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingComment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    // Check permissions
    // User can only delete their own comments
    // Admin can delete any comment
    if (userRole !== 'admin' && existingComment.user_id !== userId) {
      return errorResponse(res, 'Access denied. You can only delete your own comments.', 403);
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete comment error:', deleteError);
      return errorResponse(res, 'Failed to delete comment', 500);
    }

    return successResponse(res, null, 'Comment deleted successfully');
  } catch (error) {
    console.error('Delete comment error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get comment statistics for a ticket
 * GET /api/comments/ticket/:ticketId/stats
 */
const getCommentStats = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, created_by')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check access
    if (userRole === 'client' && ticket.created_by !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get all comments for the ticket
    let query = supabase
      .from('comments')
      .select('id, is_internal, user_id, created_at')
      .eq('ticket_id', ticketId);

    // Client cannot see internal comments in stats
    if (userRole === 'client') {
      query = query.eq('is_internal', false);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error('Get comment stats error:', error);
      return errorResponse(res, 'Failed to retrieve comment statistics', 500);
    }

    const statistics = {
      total_comments: comments.length,
      internal_comments: comments.filter(c => c.is_internal).length,
      public_comments: comments.filter(c => !c.is_internal).length,
      unique_commenters: [...new Set(comments.map(c => c.user_id))].length
    };

    return successResponse(res, statistics, 'Comment statistics retrieved successfully');
  } catch (error) {
    console.error('Get comment stats error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

module.exports = {
  createComment,
  getCommentsByTicket,
  getCommentById,
  updateComment,
  deleteComment,
  getCommentStats
};
