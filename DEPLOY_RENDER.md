# 🚀 Panduan Deploy Helpdesk IT ke Render

## 📋 Persiapan Sebelum Deploy

### 1. Pastikan Aplikasi Siap Production

✅ File `.env` sudah dikonfigurasi dengan benar
✅ Database Supabase sudah siap dan terhubung
✅ Semua dependencies di `package.json` sudah terinstall
✅ Aplikasi berjalan dengan baik di local (`npm start`)

---

## 🎯 Langkah-Langkah Deploy ke Render

### **STEP 1: Siapkan Repository Git**

Jika belum menggunakan Git, inisialisasi terlebih dahulu:

```bash
git init
git add .
git commit -m "Initial commit for Helpdesk IT System"
```

Push ke GitHub (atau GitLab/Bitbucket):

```bash
# Buat repository baru di GitHub terlebih dahulu, lalu:
git remote add origin https://github.com/username/helpdesk-it.git
git branch -M main
git push -u origin main
```

**PENTING:** Pastikan file `.env` **TIDAK** ter-push ke Git (sudah ada di `.gitignore`)

---

### **STEP 2: Buat Akun dan Login ke Render**

1. Kunjungi: https://render.com
2. Klik **"Get Started"** atau **"Sign Up"**
3. Login menggunakan GitHub (recommended) atau email
4. Render akan meminta akses ke repository GitHub Anda

---

### **STEP 3: Buat Web Service Baru**

1. Di Render Dashboard, klik **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Pilih repository `helpdesk-it` (atau nama repo Anda)
   - Klik **"Connect"**

3. **Konfigurasi Web Service:**

   | Field | Value |
   |-------|-------|
   | **Name** | `helpdesk-it-system` (atau nama unik Anda) |
   | **Region** | Singapore (untuk Indonesia lebih cepat) |
   | **Branch** | `main` |
   | **Root Directory** | (kosongkan) |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` (untuk testing) atau `Starter` (untuk production) |

4. Klik **"Advanced"** untuk setting tambahan (opsional)

---

### **STEP 4: Tambahkan Environment Variables**

Sebelum deploy, tambahkan semua environment variables dari file `.env` Anda:

1. Scroll ke bagian **"Environment Variables"**
2. Klik **"Add Environment Variable"**
3. Tambahkan satu per satu:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Secret (gunakan string random minimal 32 karakter)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_production

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (akan diisi setelah deploy)
FRONTEND_URL=https://helpdesk-it-system.onrender.com
```

**TIPS:** 
- Untuk `JWT_SECRET`, gunakan generator: https://randomkeygen.com/
- `FRONTEND_URL` bisa diisi dengan URL yang akan Render berikan (format: `https://nama-app.onrender.com`)

---

### **STEP 5: Deploy Aplikasi**

1. Setelah semua konfigurasi selesai, klik **"Create Web Service"**
2. Render akan otomatis:
   - Clone repository Anda
   - Install dependencies (`npm install`)
   - Build aplikasi
   - Start server (`npm start`)
3. Tunggu proses deploy (biasanya 2-5 menit)
4. Status akan berubah menjadi **"Live"** dengan icon hijau

---

### **STEP 6: Akses Aplikasi**

Setelah deploy berhasil:

1. URL aplikasi akan tersedia: `https://helpdesk-it-system.onrender.com`
2. Klik URL tersebut untuk membuka aplikasi
3. Test login dengan akun admin dari database Supabase

---

## ⚙️ Konfigurasi Tambahan (Opsional)

### **Custom Domain**

Jika ingin menggunakan domain sendiri (contoh: `helpdesk.company.com`):

1. Di Render Dashboard → pilih Web Service Anda
2. Klik tab **"Settings"**
3. Scroll ke **"Custom Domain"**
4. Klik **"Add Custom Domain"**
5. Masukkan domain Anda (contoh: `helpdesk.company.com`)
6. Ikuti instruksi untuk update DNS record di domain provider Anda

**DNS Settings yang perlu ditambahkan:**
- Type: `CNAME`
- Name: `helpdesk` (atau subdomain lain)
- Value: `helpdesk-it-system.onrender.com`

---

### **Auto-Deploy on Git Push**

Render sudah otomatis enable auto-deploy. Setiap kali Anda push ke branch `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render akan otomatis re-deploy aplikasi Anda.

---

## 🔍 Monitoring dan Troubleshooting

### **Melihat Logs**

1. Di Render Dashboard → pilih Web Service Anda
2. Klik tab **"Logs"**
3. Lihat real-time logs untuk debugging

### **Common Issues dan Solusi**

#### ❌ **Deploy Failed: "Build failed"**
- **Penyebab:** Dependencies tidak terinstall atau error di `package.json`
- **Solusi:** 
  - Pastikan `package.json` valid
  - Test `npm install` di local terlebih dahulu
  - Check logs untuk error spesifik

#### ❌ **App Crashed: "Application failed to respond"**
- **Penyebab:** Environment variables tidak lengkap atau salah
- **Solusi:**
  - Pastikan semua env variables sudah di-set di Render
  - Check logs untuk error database connection
  - Pastikan `PORT` di-set ke `3000` atau sesuai Render

#### ❌ **Database Connection Error**
- **Penyebab:** Supabase credentials salah atau database tidak accessible
- **Solusi:**
  - Verifikasi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` benar
  - Pastikan Supabase project dalam status aktif
  - Check Supabase dashboard untuk connection string

#### ❌ **CORS Error**
- **Penyebab:** `FRONTEND_URL` tidak sesuai dengan deployed URL
- **Solusi:**
  - Update environment variable `FRONTEND_URL` dengan URL Render yang benar
  - Format: `https://nama-app.onrender.com` (tanpa trailing slash)

---

## 📊 Performance Tips

### **Free Tier Limitations**

Render Free tier memiliki batasan:
- **Sleep after 15 minutes inactivity** (first request akan lambat ~30 detik)
- **750 hours/month** (cukup untuk 1 service 24/7)
- **Shared resources** (performa terbatas)

**Solusi untuk menghindari sleep:**
- Upgrade ke **Starter plan** ($7/month) → No sleep, better performance
- Atau gunakan uptime monitoring tool (contoh: UptimeRobot) untuk ping setiap 10 menit

### **Optimization**

Tambahkan ke `package.json` jika perlu optimasi:

```json
"scripts": {
  "start": "node index.js",
  "build": "echo 'Build complete'",
  "postinstall": "echo 'Dependencies installed'"
}
```

---

## 🔒 Security Checklist

✅ **Environment Variables:**
- [ ] `JWT_SECRET` menggunakan string random yang kuat (min 32 karakter)
- [ ] Semua credentials (Supabase keys) tidak ter-commit ke Git
- [ ] `NODE_ENV` di-set ke `production`

✅ **Database:**
- [ ] Supabase RLS (Row Level Security) sudah dikonfigurasi
- [ ] Password admin sudah di-hash dengan bcrypt
- [ ] Backup database secara berkala

✅ **Application:**
- [ ] CORS sudah dikonfigurasi dengan benar
- [ ] Rate limiting diaktifkan (jika perlu)
- [ ] Input validation berjalan dengan baik

---

## 📱 Testing Setelah Deploy

### **Test Checklist:**

1. **Homepage:**
   - [ ] Buka `https://your-app.onrender.com`
   - [ ] Pastikan tampilan loading dengan baik
   - [ ] CSS dan JavaScript berfungsi

2. **Login Admin:**
   - [ ] Klik "Login Admin"
   - [ ] Login dengan credentials dari database
   - [ ] Redirect ke dashboard berhasil

3. **Create Ticket:**
   - [ ] Buat tiket perbaikan baru
   - [ ] Buat permintaan barang baru
   - [ ] Verify tiket tersimpan di database

4. **Dashboard Admin:**
   - [ ] Lihat statistik dashboard
   - [ ] Edit dan delete tiket
   - [ ] Download Excel report
   - [ ] View logs

5. **Logout:**
   - [ ] Logout berhasil
   - [ ] Redirect ke homepage

---

## 🆘 Butuh Bantuan?

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Supabase Documentation:** https://supabase.com/docs

---

## 🎉 Deploy Berhasil!

Jika semua langkah di atas berhasil, aplikasi Helpdesk IT Anda sudah live di internet dan bisa diakses dari mana saja!

**Next Steps:**
1. Share URL ke tim IT Anda
2. Buat user admin tambahan jika perlu
3. Monitor logs dan performance
4. Setup backup database secara berkala
5. Pertimbangkan upgrade ke paid plan untuk better performance

---

**Catatan:** File ini adalah panduan lengkap untuk deployment. Simpan file ini untuk referensi di kemudian hari.

**Versi:** 1.0.0  
**Last Updated:** 2026-07-22  
**Author:** Helpdesk IT System Team
