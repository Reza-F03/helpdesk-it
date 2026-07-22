-- ============================================
-- HELPDESK IT SYSTEM - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'client', 'support')),
  phone VARCHAR(50),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- TABLE: tickets
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  category VARCHAR(100),
  
  -- Reporter Info (For guest / unauthenticated clients)
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255),
  reporter_phone VARCHAR(50),
  department VARCHAR(100),
  
  -- Foreign Keys (Nullable for guest clients)
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- ============================================
-- TABLE: comments
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(255),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ============================================
-- TABLE: ticket_logs
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket_id ON ticket_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_logs_user_id ON ticket_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_logs_created_at ON ticket_logs(created_at);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to generate ticket number
-- ============================================
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  date_str VARCHAR;
  counter INTEGER;
BEGIN
  date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO counter
  FROM tickets
  WHERE ticket_number LIKE 'TKT-' || date_str || '-%';
  
  new_number := 'TKT-' || date_str || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to auto-log ticket changes
-- ============================================
CREATE OR REPLACE FUNCTION log_ticket_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_logs (ticket_id, user_id, action, field_changed, old_value, new_value, description)
    VALUES (
      NEW.id,
      NEW.assigned_to,
      'status_changed',
      'status',
      OLD.status,
      NEW.status,
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  
  -- Log assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO ticket_logs (ticket_id, user_id, action, field_changed, old_value, new_value, description)
    VALUES (
      NEW.id,
      COALESCE(NEW.assigned_to, OLD.assigned_to),
      'assigned',
      'assigned_to',
      COALESCE(OLD.assigned_to::TEXT, 'unassigned'),
      COALESCE(NEW.assigned_to::TEXT, 'unassigned'),
      CASE 
        WHEN NEW.assigned_to IS NULL THEN 'Ticket unassigned'
        ELSE 'Ticket assigned to support'
      END
    );
  END IF;
  
  -- Log priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_logs (ticket_id, user_id, action, field_changed, old_value, new_value, description)
    VALUES (
      NEW.id,
      NEW.assigned_to,
      'priority_changed',
      'priority',
      OLD.priority,
      NEW.priority,
      'Priority changed from ' || OLD.priority || ' to ' || NEW.priority
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-logging ticket changes
DROP TRIGGER IF EXISTS log_ticket_changes_trigger ON tickets;
CREATE TRIGGER log_ticket_changes_trigger
AFTER UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_changes();

-- ============================================
-- Function to log ticket creation
-- ============================================
CREATE OR REPLACE FUNCTION log_ticket_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_logs (ticket_id, user_id, action, description)
  VALUES (
    NEW.id,
    NEW.created_by,
    'created',
    'Ticket created (' || COALESCE(NEW.reporter_name, 'Guest Client') || ') with priority: ' || NEW.priority || ' and status: ' || NEW.status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for logging ticket creation
DROP TRIGGER IF EXISTS log_ticket_creation_trigger ON tickets;
CREATE TRIGGER log_ticket_creation_trigger
AFTER INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_creation();

-- ============================================
-- INSERT DEFAULT STAF USERS (Admin & Support)
-- ============================================
-- Password untuk semua user: admin123
-- Hash generated with bcrypt rounds=10

-- Admin User
INSERT INTO users (username, password, full_name, email, role, department, is_active)
VALUES (
  'admin',
  '$2a$10$Rq8nxvOYSPbdaibldN8S3eX4BB3Kq5C6GdM/G70QJIzCaOqfPIefW',
  'System Administrator',
  'admin@helpdesk.com',
  'admin',
  'IT',
  true
) ON CONFLICT (username) DO NOTHING;

-- Support User
INSERT INTO users (username, password, full_name, email, role, department, is_active)
VALUES (
  'support',
  '$2a$10$Rq8nxvOYSPbdaibldN8S3eX4BB3Kq5C6GdM/G70QJIzCaOqfPIefW',
  'Support Team',
  'support@helpdesk.com',
  'support',
  'IT Support',
  true
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View: Ticket Statistics
CREATE OR REPLACE VIEW ticket_statistics AS
SELECT
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets
FROM tickets;

-- View: Ticket Details with Reporter & User Info
CREATE OR REPLACE VIEW ticket_details AS
SELECT
  t.id,
  t.ticket_number,
  t.title,
  t.description,
  t.priority,
  t.status,
  t.category,
  t.reporter_name,
  t.reporter_email,
  t.reporter_phone,
  t.department,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  t.closed_at,
  creator.id as creator_id,
  COALESCE(creator.full_name, t.reporter_name, 'Client Guest') as creator_name,
  COALESCE(creator.email, t.reporter_email) as creator_email,
  assignee.id as assignee_id,
  assignee.full_name as assignee_name,
  assignee.email as assignee_email,
  (SELECT COUNT(*) FROM comments WHERE ticket_id = t.id) as comment_count
FROM tickets t
LEFT JOIN users creator ON t.created_by = creator.id
LEFT JOIN users assignee ON t.assigned_to = assignee.id;
