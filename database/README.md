# Database Setup Guide

## Setup Supabase Database

### 1. Login ke Supabase Dashboard
Buka [https://supabase.com](https://supabase.com) dan login ke account Anda.

### 2. Create New Project
- Klik "New Project"
- Pilih Organization
- Isi nama project: `helpdesk-it-system`
- Set database password (simpan dengan aman!)
- Pilih region terdekat
- Klik "Create new project"

### 3. Dapatkan API Credentials

Setelah project dibuat, pergi ke **Settings > API**:

- **Project URL**: Copy `URL` (contoh: https://xxxxx.supabase.co)
- **anon/public key**: Copy `anon public` key
- **service_role key**: Copy `service_role` key (RAHASIA!)

Masukkan ke file `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Run SQL Schema

1. Buka **SQL Editor** di Supabase Dashboard
2. Klik **New Query**
3. Copy seluruh isi file `schema.sql`
4. Paste di SQL Editor
5. Klik **Run** atau tekan `Ctrl + Enter`

### 5. Verify Tables Created

Pergi ke **Table Editor** dan pastikan tabel berikut ada:
- ✅ users
- ✅ tickets
- ✅ comments
- ✅ ticket_logs

### 6. Check Sample Data

Cek apakah sample users sudah ter-insert:

```sql
SELECT email, full_name, role FROM users;
```

Seharusnya ada 3 users:
- `admin@helpdesk.com` (role: admin)
- `support@helpdesk.com` (role: support)
- `client@helpdesk.com` (role: client)

**Default Password semua user**: `Admin123!` atau `Support123!` atau `Client123!`

⚠️ **PENTING**: Ganti password setelah login pertama kali!

## Database Schema Overview

### Table: users
Menyimpan data user dengan role-based access:
- **admin**: Full access
- **support**: Handle tickets, assign, update status
- **client**: Create tickets, view own tickets, comment

### Table: tickets
Menyimpan data tiket dengan:
- Status: open, in_progress, pending, resolved, closed
- Priority: low, medium, high, urgent
- Auto-generate ticket number: `TKT-YYYYMMDD-0001`

### Table: comments
Menyimpan komentar/balasan pada tiket:
- Support internal comments (is_internal = true)
- Public comments visible to client

### Table: ticket_logs
Automatic logging untuk:
- Ticket creation
- Status changes
- Assignment changes
- Priority changes

## Auto Features

### 1. Auto Ticket Number Generation
Setiap ticket baru akan dapat nomor unik:
- Format: `TKT-YYYYMMDD-XXXX`
- Example: `TKT-20260721-0001`

### 2. Auto Logging
Setiap perubahan ticket otomatis tercatat:
- Status berubah: logged
- Assignment berubah: logged
- Priority berubah: logged

### 3. Auto Timestamps
- `created_at`: Otomatis saat insert
- `updated_at`: Otomatis saat update

## Views for Reporting

### ticket_statistics
Summary statistics dari semua ticket:
```sql
SELECT * FROM ticket_statistics;
```

### ticket_details
Full detail ticket dengan info user:
```sql
SELECT * FROM ticket_details WHERE status = 'open';
```

## Security Notes

### Row Level Security (RLS)
RLS dinonaktifkan secara default karena kita pakai API key + JWT di backend.

Jika ingin aktifkan RLS (optional):
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_logs ENABLE ROW LEVEL SECURITY;
```

Kemudian buat policies sesuai kebutuhan.

## Backup & Restore

### Backup Database
Di Supabase Dashboard:
1. Go to **Database > Backups**
2. Enable automatic daily backups
3. Atau download manual backup

### Restore
Di Supabase Dashboard:
1. Go to **Database > Backups**
2. Choose backup point
3. Click **Restore**

## Troubleshooting

### Error: relation "users" already exists
Table sudah ada. Drop dulu atau skip create:
```sql
DROP TABLE IF EXISTS users CASCADE;
```

### Error: permission denied
Pastikan menggunakan service_role key, bukan anon key.

### Cannot insert duplicate key
Email atau ticket_number sudah ada. Gunakan unique email/number.

## Next Steps

Setelah database setup selesai:
1. ✅ Test koneksi dari backend
2. ✅ Test insert data
3. ✅ Implement authentication
4. ✅ Build API endpoints
