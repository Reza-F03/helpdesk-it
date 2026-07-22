# 🚀 Deploy Helpdesk IT System ke Render

## 📚 Dokumentasi Lengkap

Proyek ini sudah dilengkapi dengan panduan deploy yang lengkap:

1. **📖 DEPLOY_RENDER.md** - Panduan lengkap dan detail (recommended untuk pemula)
2. **⚡ DEPLOY_QUICKSTART.md** - Quick start 5 langkah cepat
3. **✅ PRE_DEPLOY_CHECKLIST.md** - Checklist sebelum deploy

---

## 🎯 Ringkasan Singkat

### **Persiapan:**
1. ✅ Aplikasi berjalan baik di local
2. ✅ Supabase database sudah siap
3. ✅ Git repository siap di GitHub

### **Deploy:**
1. Login ke https://render.com dengan GitHub
2. Buat **Web Service** baru
3. Connect ke repository GitHub
4. Set **Environment Variables** (lihat `.env.example`)
5. Deploy!

### **Setelah Deploy:**
- URL: `https://nama-app.onrender.com`
- Test semua fitur (login, create ticket, download report)
- Monitor logs untuk error

---

## 🔑 Environment Variables yang Dibutuhkan

Copy dari `.env` local Anda, lalu tambahkan di Render Dashboard:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
JWT_SECRET=random_32_chars_or_more
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://nama-app.onrender.com
```

**⚠️ PENTING:** 
- Jangan commit file `.env` ke Git!
- Gunakan JWT_SECRET yang berbeda untuk production
- Update `FRONTEND_URL` setelah mendapat URL dari Render

---

## 🆘 Butuh Bantuan?

**Error saat deploy?**
1. Check logs di Render Dashboard → Logs tab
2. Pastikan environment variables lengkap
3. Verify database connection

**CORS error?**
- Update environment variable `FRONTEND_URL`
- Restart service di Render

**App sleep di free tier?**
- Upgrade ke Starter plan ($7/month)
- Atau gunakan uptime monitoring (UptimeRobot)

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

## 🎉 Happy Deploying!

Ikuti salah satu panduan di atas, dan aplikasi Helpdesk IT Anda akan online dalam 10 menit!

**Made with ❤️ for IT Support Teams**
