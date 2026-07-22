const supabase = require('../config/supabase');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.helper');

/**
 * Get ticket history/logs
 * GET /api/tickets/:ticketId/history
 */
const getTicketHistory = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { page = 1, limit = 50 } = req.query;
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

    // Check access - client can only view history of their own tickets
    if (userRole === 'client' && ticket.created_by !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get ticket logs
    const { data: logs, error, count } = await supabase
      .from('ticket_logs')
      .select(`
        *,
        user:user_id(id, username, full_name, email, role)
      `, { count: 'exact' })
      .eq('ticket_id', ticketId)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get ticket history error:', error);
      return errorResponse(res, 'Failed to retrieve ticket history', 500);
    }

    return paginatedResponse(
      res,
      logs,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      },
      'Ticket history retrieved successfully'
    );
  } catch (error) {
    console.error('Get ticket history error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get all ticket logs (Admin only)
 * GET /api/logs
 */
const getAllTicketLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      ticket_id,
      user_id,
      action,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('ticket_logs')
      .select(`
        *,
        user:user_id(id, username, full_name, email, role),
        ticket:ticket_id(id, ticket_number, title, status)
      `, { count: 'exact' });

    // Apply filters
    if (ticket_id) {
      query = query.eq('ticket_id', ticket_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Apply pagination
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Get all logs error:', error);
      return errorResponse(res, 'Failed to retrieve logs', 500);
    }

    return paginatedResponse(
      res,
      logs,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      },
      'Ticket logs retrieved successfully'
    );
  } catch (error) {
    console.error('Get all ticket logs error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get log statistics
 * GET /api/logs/stats
 */
const getLogStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build query
    let query = supabase
      .from('ticket_logs')
      .select('action, created_at');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Get log stats error:', error);
      return errorResponse(res, 'Failed to retrieve log statistics', 500);
    }

    // Calculate statistics
    const statistics = {
      total_logs: logs.length,
      by_action: {
        created: logs.filter(l => l.action === 'created').length,
        status_changed: logs.filter(l => l.action === 'status_changed').length,
        assigned: logs.filter(l => l.action === 'assigned').length,
        priority_changed: logs.filter(l => l.action === 'priority_changed').length,
        other: logs.filter(l => !['created', 'status_changed', 'assigned', 'priority_changed'].includes(l.action)).length
      },
      date_range: {
        start: start_date || 'all time',
        end: end_date || 'now'
      }
    };

    return successResponse(res, statistics, 'Log statistics retrieved successfully');
  } catch (error) {
    console.error('Get log stats error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get user activity logs
 * GET /api/logs/user/:userId
 */
const getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    const offset = (page - 1) * limit;

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, full_name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Client can only view their own activity
    if (userRole === 'client' && userId !== currentUserId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get user's activity logs
    const { data: logs, error, count } = await supabase
      .from('ticket_logs')
      .select(`
        *,
        ticket:ticket_id(id, ticket_number, title, status)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user activity logs error:', error);
      return errorResponse(res, 'Failed to retrieve user activity logs', 500);
    }

    return paginatedResponse(
      res,
      {
        user,
        logs
      },
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      },
      'User activity logs retrieved successfully'
    );
  } catch (error) {
    console.error('Get user activity logs error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get recent activity (last 24 hours)
 * GET /api/logs/recent
 */
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Calculate 24 hours ago
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // Build query
    let query = supabase
      .from('ticket_logs')
      .select(`
        *,
        user:user_id(id, username, full_name, email, role),
        ticket:ticket_id(id, ticket_number, title, status, created_by)
      `)
      .gte('created_at', yesterday.toISOString());

    // Client can only see activity on their tickets
    if (userRole === 'client') {
      // We need to filter by tickets created by this user
      // This requires a join, so we'll fetch all and filter
      query = query.limit(100); // Get more to filter
    } else {
      query = query.limit(parseInt(limit));
    }

    query = query.order('created_at', { ascending: false });

    const { data: logs, error } = await query;

    if (error) {
      console.error('Get recent activity error:', error);
      return errorResponse(res, 'Failed to retrieve recent activity', 500);
    }

    // Filter for clients
    let filteredLogs = logs;
    if (userRole === 'client') {
      filteredLogs = logs.filter(log => log.ticket && log.ticket.created_by === userId);
      filteredLogs = filteredLogs.slice(0, parseInt(limit));
    }

    return successResponse(
      res,
      {
        activity: filteredLogs,
        period: '24 hours'
      },
      'Recent activity retrieved successfully'
    );
  } catch (error) {
    console.error('Get recent activity error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

module.exports = {
  getTicketHistory,
  getAllTicketLogs,
  getLogStats,
  getUserActivityLogs,
  getRecentActivity
};
