-- ============================================
-- FIX: Ticket Delete Log Issue
-- ============================================
-- Problem: Logs terhapus saat ticket dihapus (CASCADE)
-- Solution: Ubah ON DELETE CASCADE ke ON DELETE SET NULL
-- ============================================

-- Step 1: Drop existing foreign key constraint
ALTER TABLE ticket_logs 
DROP CONSTRAINT IF EXISTS ticket_logs_ticket_id_fkey;

-- Step 2: Recreate with ON DELETE SET NULL
ALTER TABLE ticket_logs
ADD CONSTRAINT ticket_logs_ticket_id_fkey 
FOREIGN KEY (ticket_id) 
REFERENCES tickets(id) 
ON DELETE SET NULL;

-- Step 3: Allow ticket_id to be NULL (if not already)
ALTER TABLE ticket_logs 
ALTER COLUMN ticket_id DROP NOT NULL;

-- Step 4: Verify changes
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action
FROM pg_constraint
WHERE conname = 'ticket_logs_ticket_id_fkey';

-- on_delete_action codes:
-- 'a' = no action
-- 'r' = restrict
-- 'c' = cascade
-- 'n' = set null
-- 'd' = set default

-- Expected result: on_delete_action should be 'n' (set null)

-- ============================================
-- TESTING
-- ============================================

-- Test 1: Create dummy ticket
INSERT INTO tickets (ticket_number, title, description, priority, status, reporter_name)
VALUES ('TKT-TEST-DELETE-001', 'Test Delete', 'Testing delete log', 'low', 'open', 'Test User')
RETURNING id;

-- Note the ID, then check logs created
SELECT * FROM ticket_logs WHERE ticket_id = 'YOUR_TICKET_ID_HERE' ORDER BY created_at DESC;

-- Test 2: Delete the ticket
DELETE FROM tickets WHERE ticket_number = 'TKT-TEST-DELETE-001';

-- Test 3: Check logs still exist (ticket_id will be NULL)
SELECT * FROM ticket_logs WHERE description LIKE '%TKT-TEST-DELETE-001%' ORDER BY created_at DESC;

-- Expected: Log should still exist with ticket_id = NULL

-- ============================================
-- NOTES
-- ============================================
-- After this change:
-- 1. Logs will NOT be deleted when ticket is deleted
-- 2. ticket_id will be set to NULL for orphaned logs
-- 3. Logs still contain ticket_number in description for reference
-- 4. Can still query deleted ticket logs by searching description
-- ============================================
