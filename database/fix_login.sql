-- ============================================
-- FIX LOGIN ISSUE - Quick Fix
-- ============================================
-- Password untuk admin dan support: admin123
-- Run script ini di Supabase SQL Editor

-- Update password dengan hash yang benar
UPDATE users 
SET password = '$2a$10$Rq8nxvOYSPbdaibldN8S3eX4BB3Kq5C6GdM/G70QJIzCaOqfPIefW'
WHERE username = 'admin';

UPDATE users 
SET password = '$2a$10$Rq8nxvOYSPbdaibldN8S3eX4BB3Kq5C6GdM/G70QJIzCaOqfPIefW'
WHERE username = 'support';

-- Verify hasil update
SELECT 
  username, 
  full_name, 
  email,
  role,
  CASE 
    WHEN password = '$2a$10$Rq8nxvOYSPbdaibldN8S3eX4BB3Kq5C6GdM/G70QJIzCaOqfPIefW' 
    THEN '✓ Password BENAR' 
    ELSE '✗ Password SALAH' 
  END as password_status,
  is_active
FROM users 
WHERE username IN ('admin', 'support')
ORDER BY username;

-- Output expected:
-- username | full_name              | email                | role    | password_status    | is_active
-- ---------|------------------------|----------------------|---------|--------------------|-----------
-- admin    | System Administrator   | admin@helpdesk.com   | admin   | ✓ Password BENAR   | true
-- support  | Support Team           | support@helpdesk.com | support | ✓ Password BENAR   | true

-- Setelah run script ini, coba login dengan:
-- Username: admin
-- Password: admin123
