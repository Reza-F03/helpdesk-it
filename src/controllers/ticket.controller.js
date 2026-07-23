const supabase = require('../config/supabase');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.helper');
const { generateTicketPDF } = require('../utils/pdfGenerator');

/**
 * Create new ticket
 * POST /api/tickets
 */
const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      reporter_name,
      reporter_email,
      reporter_phone,
      department
    } = req.body;

    const userId = req.user && !req.user.isGuest ? req.user.id : (req.user?.id || null);

    // Tentukan prefix berdasarkan kategori
    // Perbaikan → INC (Incident), Permintaan Barang → REQ (Request)
    const prefix = category === 'Permintaan Barang' ? 'REQ' : 'INC';

    console.log(`[createTicket] category="${category}" → prefix="${prefix}"`);

    // Generate ticket number dengan format baru (TKT-INC/REQ-YYYYMMDD-NNN)
    const { data: ticketNumber, error: funcError } = await supabase
      .rpc('generate_ticket_number_v2', { prefix });

    if (funcError || !ticketNumber) {
      console.error('[createTicket] generate_ticket_number_v2 error:', funcError);
      return errorResponse(res, `Gagal generate nomor tiket: ${funcError?.message || 'unknown error'}`, 500);
    }

    console.log(`[createTicket] ticket_number="${ticketNumber}"`);

    const finalTicketNumber = ticketNumber;

    // Create ticket
    const { data: newTicket, error: insertError } = await supabase
      .from('tickets')
      .insert([
        {
          ticket_number: finalTicketNumber,
          title,
          description,
          priority: priority || 'medium',
          status: 'open',
          category,
          reporter_name: reporter_name || req.user?.full_name || 'Guest Client',
          reporter_email: reporter_email || req.user?.email || null,
          reporter_phone: reporter_phone || null,
          department: department || null,
          created_by: userId
        }
      ])
      .select(`
        *,
        creator:created_by(id, username, full_name, email, role),
        assignee:assigned_to(id, username, full_name, email, role)
      `)
      .single();

    if (insertError) {
      console.error('Create ticket error:', insertError);
      return errorResponse(res, 'Failed to create ticket', 500);
    }

    return successResponse(res, newTicket, 'Ticket created successfully', 201);
  } catch (error) {
    console.error('Create ticket error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get all tickets with filters and pagination
 * GET /api/tickets
 * Query params: page, limit, status, priority, assigned_to, created_by, search
 */
const getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assigned_to,
      created_by,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build query
    let query = supabase
      .from('tickets')
      .select(`
        *,
        creator:created_by(id, username, full_name, email, role),
        assignee:assigned_to(id, username, full_name, email, role)
      `, { count: 'exact' });

    // Role-based filtering
    // Authenticated client can only see their own tickets; guest client sees public tickets
    if (userRole === 'client' && !req.user.isGuest) {
      query = query.eq('created_by', userId);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,ticket_number.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error('Get tickets error:', error);
      return errorResponse(res, 'Failed to retrieve tickets', 500);
    }

    return paginatedResponse(
      res,
      tickets,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      },
      'Tickets retrieved successfully'
    );
  } catch (error) {
    console.error('Get all tickets error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get ticket by ID
 * GET /api/tickets/:id
 */
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:created_by(id, username, full_name, email, role, phone, department),
        assignee:assigned_to(id, username, full_name, email, role, phone, department)
      `)
      .eq('id', id)
      .single();

    if (error || !ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check access - authenticated client can only view their own tickets
    if (userRole === 'client' && !req.user.isGuest && ticket.created_by !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, ticket, 'Ticket retrieved successfully');
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Update ticket
 * PUT /api/tickets/:id
 */
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, category, assigned_to, hasil_perbaikan } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get existing ticket
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTicket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check permissions
    // Client can only update their own tickets (limited fields)
    if (userRole === 'client' && existingTicket.created_by !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Build update data based on role
    const updateData = {};

    if (userRole === 'client') {
      // Client can only update title and description
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
    } else {
      // Support and Admin can update all fields
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (category !== undefined) updateData.category = category;
      if (hasil_perbaikan !== undefined) updateData.hasil_perbaikan = hasil_perbaikan;
      
      // Handle status updates
      if (status !== undefined) {
        updateData.status = status;
        
        // Set resolved_at when status changes to resolved
        if (status === 'resolved' && existingTicket.status !== 'resolved') {
          updateData.resolved_at = new Date().toISOString();
        }
        
        // Set closed_at when status changes to closed
        if (status === 'closed' && existingTicket.status !== 'closed') {
          updateData.closed_at = new Date().toISOString();
        }
      }
      
      // Handle assignment
      if (assigned_to !== undefined) {
        updateData.assigned_to = assigned_to;
      }
    }

    // Update ticket
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        creator:created_by(id, username, full_name, email, role),
        assignee:assigned_to(id, username, full_name, email, role)
      `)
      .single();

    if (updateError) {
      console.error('Update ticket error:', updateError);
      // Cek apakah error karena kolom tidak ada di database
      const msg = updateError.message || '';
      if (msg.includes('column') || msg.includes('hasil_perbaikan') || msg.includes('does not exist')) {
        return errorResponse(res, 'Kolom hasil_perbaikan belum ada di database. Jalankan SQL migration terlebih dahulu.', 500);
      }
      return errorResponse(res, updateError.message || 'Failed to update ticket', 500);
    }

    // Auto-log activity for important changes
    try {
      const logs = [];

      // Log category change
      if (category !== undefined && existingTicket.category !== category) {
        logs.push({
          ticket_id: id,
          user_id: userId,
          action: 'category_changed',
          description: `Kategori diubah dari "${existingTicket.category || 'Tidak ada'}" ke "${category}"`
        });
      }

      // Log priority change
      if (priority !== undefined && existingTicket.priority !== priority) {
        logs.push({
          ticket_id: id,
          user_id: userId,
          action: 'priority_changed',
          description: `Prioritas diubah dari "${existingTicket.priority}" ke "${priority}"`
        });
      }

      // Log status change
      if (status !== undefined && existingTicket.status !== status) {
        logs.push({
          ticket_id: id,
          user_id: userId,
          action: 'status_changed',
          description: `Status diubah dari "${existingTicket.status}" ke "${status}"`
        });
      }

      // Log assignment change
      if (assigned_to !== undefined && existingTicket.assigned_to !== assigned_to) {
        if (assigned_to === null) {
          logs.push({
            ticket_id: id,
            user_id: userId,
            action: 'unassigned',
            description: 'Penugasan dibatalkan'
          });
        } else if (existingTicket.assigned_to === null) {
          logs.push({
            ticket_id: id,
            user_id: userId,
            action: 'assigned',
            description: `Tiket ditugaskan ke staff`
          });
        } else {
          logs.push({
            ticket_id: id,
            user_id: userId,
            action: 'assigned',
            description: `Penugasan diubah`
          });
        }
      }

      // Insert all logs
      if (logs.length > 0) {
        await supabase.from('ticket_logs').insert(logs);
        console.log(`[updateTicket] Created ${logs.length} activity logs for ticket ${id}`);
      }
    } catch (logError) {
      // Don't fail the update if logging fails
      console.error('Failed to create activity logs:', logError);
    }

    return successResponse(res, updatedTicket, 'Ticket updated successfully');
  } catch (error) {
    console.error('Update ticket error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Delete ticket (Admin only)
 * DELETE /api/tickets/:id
 */
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if ticket exists and get details for logging
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status, category, priority, reporter_name, created_at')
      .eq('id', id)
      .single();

    if (fetchError || !existingTicket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Create detailed activity log BEFORE deleting ticket
    try {
      const deleteDescription = `Tiket "${existingTicket.ticket_number}" - ${existingTicket.title} dihapus. ` +
                               `[Kategori: ${existingTicket.category || '-'}, Status: ${existingTicket.status}, ` +
                               `Prioritas: ${existingTicket.priority}, Dibuat: ${new Date(existingTicket.created_at).toLocaleDateString('id-ID')}]`;
      
      await supabase.from('ticket_logs').insert({
        ticket_id: id,
        user_id: userId,
        action: 'deleted',
        description: deleteDescription
      });
      console.log(`[deleteTicket] Created delete log for ticket ${existingTicket.ticket_number}`);
    } catch (logError) {
      console.error('[deleteTicket] Failed to create delete log:', logError);
      // Continue with delete even if logging fails
    }

    // Delete ticket (logs will remain with ticket_id = NULL after database fix)
    const { error: deleteError } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete ticket error:', deleteError);
      return errorResponse(res, 'Failed to delete ticket', 500);
    }

    return successResponse(res, { 
      deleted_ticket: existingTicket.ticket_number 
    }, 'Ticket deleted successfully');
  } catch (error) {
    console.error('Delete ticket error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Assign ticket to support
 * PUT /api/tickets/:id/assign
 */
const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    // Check if ticket exists
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingTicket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // If assigned_to is provided, verify the user exists and is support/admin
    if (assigned_to) {
      const { data: assignee } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', assigned_to)
        .single();

      if (!assignee) {
        return errorResponse(res, 'Assignee user not found', 404);
      }

      if (assignee.role !== 'support' && assignee.role !== 'admin') {
        return errorResponse(res, 'Can only assign to support or admin users', 400);
      }
    }

    // Update assignment and status
    const updateData = {
      assigned_to: assigned_to || null
    };

    // Auto update status to in_progress if assigning
    if (assigned_to && existingTicket.status === 'open') {
      updateData.status = 'in_progress';
    }

    const { data: updatedTicket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        creator:created_by(id, username, full_name, email, role),
        assignee:assigned_to(id, username, full_name, email, role)
      `)
      .single();

    if (error) {
      console.error('Assign ticket error:', error);
      return errorResponse(res, 'Failed to assign ticket', 500);
    }

    return successResponse(
      res,
      updatedTicket,
      assigned_to ? 'Ticket assigned successfully' : 'Ticket unassigned successfully'
    );
  } catch (error) {
    console.error('Assign ticket error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get ticket statistics
 * GET /api/tickets/stats
 */
const getTicketStats = async (req, res) => {
  try {
    console.log('[getTicketStats] START');
    console.log('[getTicketStats] User:', req.user);
    
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('[getTicketStats] userId:', userId);
    console.log('[getTicketStats] userRole:', userRole);

    // Build query based on role
    let query = supabase.from('tickets').select('status, priority, created_by, assigned_to');

    // Authenticated client can only see stats for their tickets
    if (userRole === 'client' && !req.user.isGuest) {
      console.log('[getTicketStats] Client mode - filtering by created_by');
      query = query.eq('created_by', userId);
    }

    // Support can see stats for assigned tickets OR ALL tickets (changed for dashboard)
    if (userRole === 'support') {
      console.log('[getTicketStats] Support mode - showing ALL tickets (not filtering)');
      // Changed: Support can now see all tickets like admin
      // query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
    }

    // Admin and guest see all tickets (no filter)
    if (userRole === 'admin' || req.user.isGuest) {
      console.log('[getTicketStats] Admin/Guest mode - no filter, show all tickets');
    }

    const { data: tickets, error } = await query;

    console.log('[getTicketStats] Query result - tickets count:', tickets?.length || 0);
    console.log('[getTicketStats] Query error:', error);

    if (error) {
      console.error('[getTicketStats] Get ticket stats error:', error);
      return errorResponse(res, 'Failed to retrieve statistics', 500);
    }

    const statistics = {
      total_tickets: tickets.length,
      by_status: {
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        pending: tickets.filter(t => t.status === 'pending').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length
      },
      by_priority: {
        low: tickets.filter(t => t.priority === 'low').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        high: tickets.filter(t => t.priority === 'high').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length
      },
      assigned: tickets.filter(t => t.assigned_to !== null).length,
      unassigned: tickets.filter(t => t.assigned_to === null).length
    };

    console.log('[getTicketStats] Statistics:', statistics);
    console.log('[getTicketStats] END - Success');

    return successResponse(res, statistics, 'Ticket statistics retrieved successfully');
  } catch (error) {
    console.error('[getTicketStats] Get ticket stats error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get my tickets (current user)
 * GET /api/tickets/my-tickets
 */
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('tickets')
      .select(`
        *,
        creator:created_by(id, username, full_name, email, role),
        assignee:assigned_to(id, username, full_name, email, role)
      `, { count: 'exact' });

    // Filter based on role
    if (userRole === 'client') {
      query = query.eq('created_by', userId);
    } else if (userRole === 'support') {
      query = query.eq('assigned_to', userId);
    }

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error('Get my tickets error:', error);
      return errorResponse(res, 'Failed to retrieve tickets', 500);
    }

    return paginatedResponse(
      res,
      tickets,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      },
      'My tickets retrieved successfully'
    );
  } catch (error) {
    console.error('Get my tickets error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Download ticket as PDF
 * GET /api/tickets/:id/pdf
 */
const downloadTicketPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, ticket_number, created_by')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check access - client can only download their own tickets
    if (userRole === 'client' && ticket.created_by !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Generate PDF
    const pdfDoc = await generateTicketPDF(id);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.ticket_number}.pdf`);

    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Download ticket PDF error:', error);
    
    // If response already started, can't send JSON error
    if (!res.headersSent) {
      return errorResponse(res, 'Failed to generate PDF', 500);
    }
  }
};

/**
 * Print ticket (view PDF inline)
 * GET /api/tickets/:id/print
 */
const printTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, ticket_number, created_by')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check access - client can only print their own tickets
    if (userRole === 'client' && ticket.created_by !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Generate PDF
    const pdfDoc = await generateTicketPDF(id);

    // Set response headers for inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ticket-${ticket.ticket_number}.pdf`);

    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Print ticket error:', error);
    
    // If response already started, can't send JSON error
    if (!res.headersSent) {
      return errorResponse(res, 'Failed to generate PDF', 500);
    }
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  getTicketStats,
  getMyTickets,
  downloadTicketPDF,
  printTicket
};
