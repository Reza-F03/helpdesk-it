-- ============================================
-- MIGRATION: Tambah kolom hasil_perbaikan
-- Tanggal: 2026-07-22
-- Cara pakai: Buka Supabase Dashboard → SQL Editor → Paste & Run
-- ============================================

-- Tambah kolom hasil_perbaikan (aman dijalankan berkali-kali)
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS hasil_perbaikan TEXT DEFAULT NULL;

-- Update trigger updated_at agar otomatis update saat hasil_perbaikan diubah
-- (biasanya sudah ada trigger ini, tapi pastikan aktif)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Verifikasi kolom berhasil ditambahkan
-- Hasil yang diharapkan: 1 baris dengan column_name = 'hasil_perbaikan'
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
  AND column_name = 'hasil_perbaikan';
