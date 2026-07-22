# 🛠️ Tech Stack - Helpdesk IT System

## 📱 Frontend

### Core Technologies
- **HTML5** - Markup structure
- **CSS3** - Styling & layout
- **Vanilla JavaScript** (ES6+) - Client-side logic
- **No Framework** - Pure JavaScript untuk performa maksimal

### Frontend Features
- ✅ **Responsive Design** - Mobile-friendly
- ✅ **SPA-like Experience** - Dynamic content loading tanpa page reload
- ✅ **RESTful API Integration** - Fetch API untuk komunikasi dengan backend
- ✅ **Local Storage** - JWT token & user session management
- ✅ **Real-time Updates** - Manual refresh untuk data terbaru
- ✅ **Modal Dialogs** - User-friendly forms & confirmations

### Frontend Structure
```
public/
├── index.html          # Landing page (homepage)
├── home.js            # Homepage logic
├── styles.css         # Homepage styles
├── dashboard.html     # Admin/Support dashboard
├── dashboard.js       # Dashboard logic
├── dashboard.css      # Dashboard styles
├── script.js          # Shared utilities
└── debug.html         # Debug tools
```

### UI Components
- Login form dengan show/hide password
- Modal untuk create/edit ticket
- Modal untuk ubah password
- Card-based statistics display
- Filterable ticket list
- Search functionality
- Drag-and-drop ready structure

---

## ⚙️ Backend

### Core Technologies
- **Node.js** (v18.x+) - Runtime environment
- **Express.js** (v4.18.2) - Web framework
- **JavaScript (ES6+)** - Server-side language

### Backend Architecture
**Pattern:** MVC (Model-View-Controller)
- **Models:** Handled by Supabase (serverless)
- **Views:** Static HTML/CSS/JS files
- **Controllers:** Business logic handlers

### Backend Structure
```
src/
├── config/
│   └── supabase.js           # Supabase client config
├── controllers/
│   ├── auth.controller.js     # Authentication logic
│   ├── ticket.controller.js   # Ticket CRUD operations
│   ├── ticketLog.controller.js # Activity logging
│   ├── comment.controller.js  # Ticket comments
│   └── user.controller.js     # User management
├── middleware/
│   ├── auth.middleware.js     # JWT verification
│   ├── role.middleware.js     # Role-based access control
│   └── validator.middleware.js # Input validation
├── routes/
│   ├── auth.routes.js         # /api/auth/*
│   ├── ticket.routes.js       # /api/tickets/*
│   ├── ticketLog.routes.js    # /api/logs/*
│   ├── comment.routes.js      # /api/comments/*
│   └── user.routes.js         # /api/users/*
└── utils/
    ├── jwt.helper.js          # JWT token utilities
    ├── password.helper.js     # Password hashing (bcrypt)
    ├── response.helper.js     # Standardized API responses
    └── pdfGenerator.js        # PDF report generator
```

---

## 🗄️ Database

### Database Technology
- **Supabase** - PostgreSQL as a Service
  - Cloud-hosted PostgreSQL database
  - Built-in authentication
  - Row Level Security (RLS)
  - Real-time subscriptions capability
  - RESTful API auto-generated

### Database Schema
```
Tables:
├── users              # User accounts (admin, support, client)
├── tickets            # Support tickets
├── ticket_logs        # Activity history
└── comments           # Ticket comments (future)

Functions:
└── generate_ticket_number_v2()  # Auto ticket number generation
```

---

## 📦 Dependencies & Libraries

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.18.2 | Web framework |
| `@supabase/supabase-js` | 2.39.3 | Supabase client SDK |
| `cors` | 2.8.5 | Cross-origin resource sharing |
| `dotenv` | 16.3.1 | Environment variables |
| `bcryptjs` | 2.4.3 | Password hashing |
| `jsonwebtoken` | 9.0.2 | JWT authentication |
| `express-validator` | 7.0.1 | Input validation & sanitization |
| `pdfkit` | 0.14.0 | PDF generation |
| `multer` | 1.4.5-lts.1 | File upload handling |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | 3.0.2 | Auto-restart on file changes |

---

## 🔐 Authentication & Authorization

### Authentication Method
- **JWT (JSON Web Tokens)**
  - Stateless authentication
  - Token stored in localStorage
  - Bearer token in Authorization header
  - Token expiration: configurable

### Authorization Levels
1. **Admin** - Full access (CRUD all resources)
2. **Support** - Manage tickets, view stats, access logs
3. **Client** - Create tickets, view own tickets

### Security Features
- ✅ Password hashing dengan bcrypt (10 rounds)
- ✅ JWT token verification
- ✅ Role-based middleware protection
- ✅ Input validation & sanitization
- ✅ CORS configuration
- ✅ Environment variables untuk secrets

---

## 🌐 API Architecture

### API Style
**RESTful API**
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- Consistent error handling
- Standardized response structure

### Response Format
```json
{
  "error": false,
  "message": "Success message",
  "data": { ... },
  "pagination": { ... }  // Optional
}
```

### API Endpoints

**Authentication** (`/api/auth`)
- POST `/login` - User login
- GET `/profile` - Get current user
- POST `/register` - Register new user
- PUT `/change-password` - Change password

**Tickets** (`/api/tickets`)
- GET `/` - Get all tickets (with filters)
- GET `/stats` - Get statistics
- GET `/my-tickets` - Get user's tickets
- GET `/:id` - Get ticket by ID
- POST `/` - Create new ticket
- PUT `/:id` - Update ticket
- DELETE `/:id` - Delete ticket
- PUT `/:id/assign` - Assign ticket

**Logs** (`/api/logs`)
- GET `/` - Get all logs
- GET `/recent` - Recent activity
- GET `/stats` - Log statistics

**Users** (`/api/users`)
- GET `/` - Get all users
- GET `/:id` - Get user by ID
- POST `/` - Create new user
- PUT `/:id` - Update user
- DELETE `/:id` - Delete user

---

## 🚀 Deployment

### Server Requirements
- Node.js 18.x or higher
- npm or yarn package manager
- Port 3000 (configurable)

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_secret_min_32_chars
PORT=3000
NODE_ENV=production
```

### Deployment Options
1. **Traditional VPS/Dedicated Server**
   - Direct Node.js deployment
   - PM2 for process management
   - Nginx as reverse proxy

2. **Cloud Platforms**
   - Vercel (serverless)
   - Railway
   - Render
   - Heroku
   - AWS/GCP/Azure

3. **Docker** (containerized)
   - Dockerfile ready
   - Docker Compose for multi-container

---

## 📊 Performance & Optimization

### Frontend Optimization
- ✅ Minimal external dependencies
- ✅ No build process required
- ✅ Cache-busting for CSS/JS
- ✅ Lazy loading for images/modals
- ✅ Debounced search/filters

### Backend Optimization
- ✅ Stateless authentication (JWT)
- ✅ Database connection pooling (Supabase)
- ✅ Async/await for non-blocking operations
- ✅ Middleware chain optimization
- ✅ Query result pagination

---

## 🔧 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run development server (with nodemon)
npm run dev

# Run production server
npm start
```

### File Watching
- `nodemon` auto-restarts server on backend changes
- Frontend: manual refresh (or use live-server)

### Debugging Tools
- `test-stats.html` - API endpoint testing
- `test-dashboard-stats.html` - Dashboard debugging
- Browser DevTools - Frontend debugging
- Server console logs - Backend debugging

---

## 📝 Code Standards

### Naming Conventions
- **Files:** kebab-case (`ticket.controller.js`)
- **Functions:** camelCase (`getUserById()`)
- **Classes:** PascalCase (not used)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Database:** snake_case (`ticket_number`)

### Code Organization
- **Modular structure** - Separation of concerns
- **DRY principle** - Reusable helper functions
- **Comments** - JSDoc-style for functions
- **Error handling** - Try-catch blocks
- **Logging** - Console.log for debugging

---

## 🎯 Key Features

### Implemented Features ✅
- User authentication (login/logout)
- Role-based access control
- Ticket management (CRUD)
- Ticket assignment
- Activity logging
- Statistics dashboard
- PDF export (tickets)
- Password management
- Search & filtering
- Responsive design

### Possible Enhancements 🚀
- Real-time notifications (WebSocket/Supabase Realtime)
- Email notifications (SendGrid/Nodemailer)
- File attachments (images/documents)
- Ticket comments/discussion
- Advanced reporting & analytics
- SLA tracking & reminders
- Knowledge base
- Multi-language support
- Dark mode toggle
- Export to Excel/CSV

---

## 🔗 External Services

1. **Supabase** (https://supabase.com)
   - PostgreSQL database hosting
   - Authentication service
   - Storage (if needed)
   - RESTful API

2. **No other external dependencies** required!
   - No payment gateway
   - No email service (yet)
   - No cloud storage (yet)

---

## 📄 License & Credits

**License:** ISC  
**Version:** 1.0.0  
**Author:** Your Team  
**Built with:** ❤️ and ☕

---

**Last Updated:** 2026-07-22  
**Tech Stack Review:** Complete ✅
