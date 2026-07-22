# ✅ Pre-Deploy Checklist

## 📋 Sebelum Deploy ke Render

### **1. Environment & Dependencies**
- [ ] File `package.json` memiliki semua dependencies yang diperlukan
- [ ] `engines` di `package.json` sudah di-set (Node >= 18.x)
- [ ] Script `start` di `package.json` sudah benar: `"start": "node index.js"`
- [ ] Test `npm install` berjalan tanpa error
- [ ] Test `npm start` berjalan di local (port 3000)

### **2. Environment Variables**
- [ ] File `.env` sudah dikonfigurasi dengan benar untuk local
- [ ] File `.env` **TIDAK** ter-commit ke Git (ada di `.gitignore`)
- [ ] Siapkan semua environment variables untuk production:
  ```
  SUPABASE_URL=
  SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  JWT_SECRET=
  NODE_ENV=production
  PORT=3000
  FRONTEND_URL=
  ```

### **3. Database (Supabase)**
- [ ] Supabase project sudah dibuat dan aktif
- [ ] Schema database sudah dibuat (`schema.sql`)
- [ ] Minimal 1 user admin sudah dibuat di database
- [ ] Test koneksi database dari aplikasi local berhasil
- [ ] RLS (Row Level Security) sudah dikonfigurasi (opsional)

### **4. Code Quality**
- [ ] Tidak ada console.log yang sensitif (password, keys, dll)
- [ ] Error handling sudah proper di semua controller
- [ ] CORS sudah dikonfigurasi dengan benar di `index.js`
- [ ] Static files (`public/`) sudah serve dengan benar

### **5. Git Repository**
- [ ] Git repository sudah dibuat (local)
- [ ] `.gitignore` sudah lengkap (node_modules, .env)
- [ ] Commit semua perubahan terakhir
- [ ] GitHub/GitLab repository sudah dibuat (remote)
- [ ] Push ke remote berhasil: `git push origin main`

### **6. Testing Local**
- [ ] Homepage (`/`) bisa diakses dan tampil dengan baik
- [ ] Login admin berfungsi (`/api/auth/login`)
- [ ] Dashboard admin bisa diakses setelah login
- [ ] Create ticket (repair & request) berfungsi
- [ ] Download Excel report berfungsi
- [ ] Logout berfungsi dan redirect ke homepage

### **7. Production Configuration**
- [ ] `NODE_ENV=production` sudah siap
- [ ] JWT_SECRET untuk production sudah di-generate (min 32 karakter)
- [ ] CORS `FRONTEND_URL` sudah diketahui atau akan di-update setelah deploy
- [ ] Port sudah sesuai: `PORT=3000`

### **8. Documentation**
- [ ] `README.md` sudah lengkap dengan cara instalasi
- [ ] `DEPLOY_RENDER.md` sudah dibaca dan dipahami
- [ ] Credentials Supabase sudah dicatat dengan aman

---

## ✨ Siap Deploy!

Jika semua checklist di atas sudah ✅, Anda siap untuk deploy ke Render!

**Next Step:** Ikuti panduan di `DEPLOY_QUICKSTART.md` atau `DEPLOY_RENDER.md`

---

## 🔍 Verifikasi Cepat

Test aplikasi local dengan command:

```bash
# Install dependencies
npm install

# Set environment variables di .env
# Lalu start aplikasi
npm start

# Buka browser:
# http://localhost:3000
```

Jika semua berjalan lancar, aplikasi siap di-deploy! 🚀

---

**Tanggal Checklist:** _______________  
**Verified By:** _______________  
**Status:** ⬜ Ready to Deploy | ⬜ Need Fixes
