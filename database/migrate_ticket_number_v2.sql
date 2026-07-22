-- ============================================================
-- MIGRATION: Format Nomor Tiket v2
-- Format baru:
--   Perbaikan         → TKT-INC-YYYYMMDD-NNN
--   Permintaan Barang → TKT-REQ-YYYYMMDD-NNN
--
-- Jalankan script ini di Supabase SQL Editor
-- CATATAN: Jalankan seluruh script sekaligus (select all → run)
-- ============================================================

-- Hapus fungsi lama jika ada konflik signature
DROP FUNCTION IF EXISTS generate_ticket_number_v2(VARCHAR);
DROP FUNCTION IF EXISTS generate_ticket_number_v2(text);

-- Buat fungsi baru dengan tipe TEXT (lebih kompatibel di Supabase)
CREATE OR REPLACE FUNCTION generate_ticket_number_v2(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  new_number  TEXT;
  date_str    TEXT;
  counter     INTEGER;
  full_prefix TEXT;
BEGIN
  date_str    := TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
  full_prefix := 'TKT-' || UPPER(prefix) || '-' || date_str || '-';

  SELECT COALESCE(COUNT(*), 0) + 1 INTO counter
  FROM tickets
  WHERE ticket_number LIKE full_prefix || '%';

  new_number := full_prefix || LPAD(counter::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berikan akses ke role anon dan authenticated (diperlukan Supabase RPC)
GRANT EXECUTE ON FUNCTION generate_ticket_number_v2(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_ticket_number_v2(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ticket_number_v2(TEXT) TO service_role;

-- Test fungsi (opsional, bisa di-comment)
-- SELECT generate_ticket_number_v2('INC');
-- SELECT generate_ticket_number_v2('REQ');
