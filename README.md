# Helpdesk IT System

Sistem manajemen helpdesk IT lengkap dengan fitur ticketing, user management, dan reporting.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Deployment**: Vercel

## Fitur Utama

### 1. Manajemen User (Role-Based)
- **Admin**: Full access ke seluruh sistem
- **Client/User**: Buat tiket, lihat tiket sendiri, komentar
- **Support/Teknisi**: Handle tiket, update status, komentar

### 2. Manajemen Tiket (CRUD)
- Create tiket baru
- Read/View tiket
- Update status dan assignment
- Delete tiket (Admin only)
- Filter dan search

### 3. Komentar/Balasan Tiket
- Tambah komentar pada tiket
- Real-time communication
- Attachment support

### 4. Print & Download Tiket
- Export tiket ke PDF
- Print friendly format
- Include ticket history

### 5. Log Histori Tiket
- Track semua perubahan
- Audit trail
- Status changes
- Assignment history

## Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd helpdesk-it-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` ke `.env` dan isi dengan kredensial Anda:

```bash
cp .env.example .env
```

Edit file `.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
PORT=3000
NODE_ENV=development
```

### 4. Setup Database Supabase

Jalankan SQL script di Supabase SQL Editor:

```sql
-- Lihat file: database/schema.sql
```

### 5. Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket (Admin only)
- `GET /api/tickets/:id/pdf` - Download ticket as PDF
- `GET /api/tickets/:id/history` - Get ticket history

### Comments
- `POST /api/comments` - Add comment to ticket
- `GET /api/comments/ticket/:ticketId` - Get comments by ticket
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## Deployment ke Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login ke Vercel

```bash
vercel login
```

### 3. Set Environment Variables

Buat file `.env` atau set via Vercel Dashboard:

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add NODE_ENV
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 5. Verifikasi Deployment

```bash
# Check status
vercel ls

# View logs
vercel logs
```

**📘 Deployment Guide Lengkap:** Lihat [DEPLOYMENT.md](./DEPLOYMENT.md)

**📖 API Documentation:** Lihat [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Struktur Proyek

```
helpdesk-it-system/
├── src/
│   ├── config/
│   │   └── supabase.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── ticket.controller.js
│   │   └── comment.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── ticket.routes.js
│   │   └── comment.routes.js
│   └── utils/
│       ├── pdfGenerator.js
│       └── logger.js
├── database/
│   └── schema.sql
├── public/
│   └── index.html
├── .env.example
├── .gitignore
├── index.js
├── package.json
├── vercel.json
└── README.md
```

## License

ISC
