# 🚀 Quick Start: Deploy ke Render

## ⚡ 5 Langkah Cepat

### 1️⃣ **Push ke GitHub**
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/helpdesk-it.git
git push -u origin main
```

### 2️⃣ **Login ke Render**
- Buka: https://render.com
- Sign up/Login dengan GitHub
- Connect ke repository GitHub Anda

### 3️⃣ **Buat Web Service**
- Klik **"New +"** → **"Web Service"**
- Pilih repository: `helpdesk-it`
- Klik **"Connect"**

### 4️⃣ **Konfigurasi Settings**
```
Name: helpdesk-it-system
Region: Singapore
Branch: main
Build Command: npm install
Start Command: npm start
Instance Type: Free (atau Starter untuk production)
```

### 5️⃣ **Tambahkan Environment Variables**

Klik **"Add Environment Variable"** dan masukkan:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJxxx...` (dari Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` (dari Supabase) |
| `JWT_SECRET` | Random 32+ karakter |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_URL` | `https://helpdesk-it-system.onrender.com` |

### 6️⃣ **Deploy!**
- Klik **"Create Web Service"**
- Tunggu 3-5 menit
- Akses di: `https://helpdesk-it-system.onrender.com` ✅

---

## 📝 Catatan Penting

✅ **File `.env` JANGAN di-push ke Git** (sudah ada di `.gitignore`)  
✅ **Generate JWT_SECRET baru** untuk production (https://randomkeygen.com)  
✅ **Test aplikasi** setelah deploy berhasil  
✅ **Monitor logs** jika ada error  

---

## 🔧 Update Aplikasi

Setelah edit kode, push ke GitHub:
```bash
npm run deploy
# atau
git add .
git commit -m "Update fitur"
git push origin main
```

Render akan **otomatis re-deploy**! 🎉

---

## 🆘 Troubleshooting

**Deploy gagal?**
- Check logs di Render Dashboard → Logs tab
- Pastikan semua env variables sudah di-set
- Verify `npm start` berjalan di local

**App crash?**
- Check database connection (Supabase)
- Verify JWT_SECRET sudah di-set
- Check PORT environment variable

**CORS error?**
- Update `FRONTEND_URL` dengan URL Render yang benar
- Restart service di Render

---

📖 **Panduan Lengkap:** Lihat file `DEPLOY_RENDER.md`
