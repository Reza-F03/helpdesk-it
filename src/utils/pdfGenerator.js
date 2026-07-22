const PDFDocument = require('pdfkit');
const supabase = require('../config/supabase');

/**
 * Generate PDF for ticket
 * @param {Object} ticket - Ticket data with related information
 * @param {Array} comments - Comments on the ticket
 * @param {Array} logs - Ticket history logs
 * @returns {PDFDocument} PDF document stream
 */
const generateTicketPDF = async (ticketId) => {
  try {
    // Fetch complete ticket data
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:created_by(id, username, full_name, email, phone, department, role),
        assignee:assigned_to(id, username, full_name, email, phone, department, role)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket not found');
    }

    // Fetch comments
    const { data: comments } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_id(username, full_name, email, role)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Fetch ticket logs
    const { data: logs } = await supabase
      .from('ticket_logs')
      .select(`
        *,
        user:user_id(username, full_name, email)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Ticket ${ticket.ticket_number}`,
        Author: 'Helpdesk IT System',
        Subject: ticket.title
      }
    });

    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Helper function to add section title
    const addSectionTitle = (title) => {
      doc.fontSize(14)
        .fillColor('#2563eb')
        .text(title, { underline: true })
        .moveDown(0.5);
    };

    // Helper function to add field
    const addField = (label, value) => {
      doc.fontSize(10)
        .fillColor('#374151')
        .font('Helvetica-Bold')
        .text(label + ':', { continued: true })
        .font('Helvetica')
        .fillColor('#000000')
        .text(' ' + (value || 'N/A'))
        .moveDown(0.3);
    };

    // Helper function to get status color
    const getStatusColor = (status) => {
      const colors = {
        'open': '#ef4444',
        'in_progress': '#f59e0b',
        'pending': '#eab308',
        'resolved': '#10b981',
        'closed': '#6b7280'
      };
      return colors[status] || '#000000';
    };

    // Helper function to get priority color
    const getPriorityColor = (priority) => {
      const colors = {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#ef4444',
        'urgent': '#dc2626'
      };
      return colors[priority] || '#000000';
    };

    // --- HEADER ---
    doc.fontSize(20)
      .fillColor('#1f2937')
      .text('HELPDESK IT SYSTEM', { align: 'center' })
      .fontSize(12)
      .fillColor('#6b7280')
      .text('Ticket Report', { align: 'center' })
      .moveDown(1);

    // Add horizontal line
    doc.strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);

    // --- TICKET INFORMATION ---
    addSectionTitle('TICKET INFORMATION');

    // Ticket Number (large)
    doc.fontSize(16)
      .fillColor('#1f2937')
      .text(ticket.ticket_number)
      .moveDown(0.5);

    addField('Title', ticket.title);
    
    // Status with color
    doc.fontSize(10)
      .fillColor('#374151')
      .font('Helvetica-Bold')
      .text('Status:', { continued: true })
      .fillColor(getStatusColor(ticket.status))
      .font('Helvetica')
      .text(' ' + ticket.status.toUpperCase())
      .moveDown(0.3);

    // Priority with color
    doc.fontSize(10)
      .fillColor('#374151')
      .font('Helvetica-Bold')
      .text('Priority:', { continued: true })
      .fillColor(getPriorityColor(ticket.priority))
      .font('Helvetica')
      .text(' ' + ticket.priority.toUpperCase())
      .moveDown(0.3);

    addField('Category', ticket.category);
    addField('Created Date', formatDate(ticket.created_at));
    addField('Last Updated', formatDate(ticket.updated_at));
    
    if (ticket.resolved_at) {
      addField('Resolved Date', formatDate(ticket.resolved_at));
    }
    
    if (ticket.closed_at) {
      addField('Closed Date', formatDate(ticket.closed_at));
    }

    doc.moveDown(0.5);

    // --- DESCRIPTION ---
    addSectionTitle('DESCRIPTION');
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica')
      .text(ticket.description, {
        align: 'justify',
        lineGap: 2
      })
      .moveDown(1);

    // --- PEOPLE INVOLVED ---
    addSectionTitle('PEOPLE INVOLVED');

    // Creator / Reporter
    doc.fontSize(11)
      .fillColor('#374151')
      .font('Helvetica-Bold')
      .text('Reported By:')
      .moveDown(0.2);
    
    if (ticket.creator) {
      if (ticket.creator.username) addField('  Username', ticket.creator.username);
      addField('  Name', ticket.creator.full_name);
      if (ticket.creator.email) addField('  Email', ticket.creator.email);
      addField('  Role', ticket.creator.role);
      if (ticket.creator.department) {
        addField('  Department', ticket.creator.department);
      }
    } else {
      addField('  Name', ticket.reporter_name || 'Guest Client');
      if (ticket.reporter_email) addField('  Email', ticket.reporter_email);
      if (ticket.reporter_phone) addField('  Phone/WA', ticket.reporter_phone);
      if (ticket.department) addField('  Department', ticket.department);
    }
    doc.moveDown(0.3);

    // Assignee
    if (ticket.assignee) {
      doc.fontSize(11)
        .fillColor('#374151')
        .font('Helvetica-Bold')
        .text('Assigned To:')
        .moveDown(0.2);
      
      addField('  Username', ticket.assignee.username);
      addField('  Name', ticket.assignee.full_name);
      if (ticket.assignee.email) addField('  Email', ticket.assignee.email);
      addField('  Role', ticket.assignee.role);
      if (ticket.assignee.department) {
        addField('  Department', ticket.assignee.department);
      }
    } else {
      doc.fontSize(10)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text('Not assigned yet')
        .moveDown(0.3);
    }

    doc.moveDown(0.5);

    // --- COMMENTS ---
    if (comments && comments.length > 0) {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      addSectionTitle(`COMMENTS (${comments.length})`);

      comments.forEach((comment, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        // Comment header
        doc.fontSize(9)
          .fillColor('#6b7280')
          .font('Helvetica-Bold')
          .text(`#${index + 1} - ${comment.user.full_name} (${comment.user.role})`, {
            continued: true
          })
          .font('Helvetica')
          .text(` - ${formatDate(comment.created_at)}`)
          .moveDown(0.2);

        // Internal badge
        if (comment.is_internal) {
          doc.fontSize(8)
            .fillColor('#ef4444')
            .text('[INTERNAL ONLY]')
            .moveDown(0.2);
        }

        // Comment text
        doc.fontSize(9)
          .fillColor('#000000')
          .font('Helvetica')
          .text(comment.comment, {
            indent: 10,
            lineGap: 1
          })
          .moveDown(0.5);

        // Separator
        if (index < comments.length - 1) {
          doc.strokeColor('#e5e7eb')
            .lineWidth(0.5)
            .moveTo(60, doc.y)
            .lineTo(535, doc.y)
            .stroke()
            .moveDown(0.5);
        }
      });

      doc.moveDown(0.5);
    }

    // --- TICKET HISTORY ---
    if (logs && logs.length > 0) {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      addSectionTitle(`TICKET HISTORY (${logs.length})`);

      logs.forEach((log, index) => {
        // Check if we need a new page
        if (doc.y > 720) {
          doc.addPage();
        }

        doc.fontSize(8)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(formatDate(log.created_at), { continued: true })
          .text(' - ')
          .fillColor('#374151')
          .font('Helvetica-Bold')
          .text(log.action.replace('_', ' ').toUpperCase(), { continued: true });

        if (log.user && log.user.full_name) {
          doc.font('Helvetica')
            .fillColor('#6b7280')
            .text(' by ' + log.user.full_name);
        } else {
          doc.text('');
        }

        if (log.description) {
          doc.fontSize(8)
            .fillColor('#000000')
            .font('Helvetica')
            .text('  ' + log.description)
            .moveDown(0.3);
        } else {
          doc.moveDown(0.3);
        }
      });
    }

    // --- FOOTER ---
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(50, 770)
        .lineTo(545, 770)
        .stroke();

      // Footer text
      doc.fontSize(8)
        .fillColor('#6b7280')
        .text(
          `Generated: ${formatDate(new Date().toISOString())}`,
          50,
          780,
          { align: 'left', width: 240 }
        )
        .text(
          `Page ${i + 1} of ${pageCount}`,
          0,
          780,
          { align: 'center' }
        )
        .text(
          'Helpdesk IT System',
          0,
          780,
          { align: 'right', width: 545 }
        );
    }

    return doc;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

module.exports = {
  generateTicketPDF
};
