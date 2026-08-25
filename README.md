# Liberty CMS Platform

A production-ready, independent voices platform built on React 19, Vite, Tailwind CSS, Express 5, and MySQL. Includes a full-featured CMS for managing polls, podcasts, cartoons, Mingle content, playlists, and leads.

## Features

### Phase 1 ✅ (Complete)
- **CMS Authentication** - JWT-based login, password reset, role management (Admin/Editor)
- **Poll Management** - Create, edit, publish, and archive poll questions
- **Dashboard** - Real-time stats on active polls, subscribers, and leads
- **Media Upload** - Cloudinary integration for image/video storage
- **Audit Logging** - Track all CMS actions for compliance and debugging
- **Rate Limiting** - Protection against brute force and spam attacks

### Phases 2-7 (In Progress)
- Podcasts & Cartoons CMS + public pages
- Mingle Project (4 sub-sections) with full CRUD
- Playlists & Bumpers management
- Newsletter subscriber persistence & CSV export
- Booking/Advertising/Contact lead system
- Site Settings CMS (social links, badges, hero content)
- Accessibility & SEO optimization

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **React Router 6** - Client-side routing

### Backend
- **Express 5** - API server
- **MySQL 8** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Cloudinary** - Media storage
- **SendGrid** - Email service

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+
- SendGrid account (for email)
- Cloudinary account (for media)

### Installation

1. **Clone and setup**
```bash
cd Liberty
npm install
cd server 
npm install
cd ../admin 
npm install
cd ..
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Initialize database**
```bash
npm run db:init
```

4. **Start development**
```bash
npm run dev:all
```

This starts:
- Public site: http://localhost:5173
- Admin CMS: http://localhost:3000
- Server API: http://localhost:8080

## Project Structure

```
liberty/
├── src/                           # Public React app
│   ├── pages/                     # Public pages (Home, Podcasts, etc.)
│   ├── components/                # Reusable components
│   ├── App.jsx                    # Public app root
│   └── main.jsx                   # Entry point
├── admin/                         # Admin CMS (separate Vite app)
│   ├── src/
│   │   ├── pages/                 # Admin pages (Login, Dashboard, Polls)
│   │   ├── layouts/               # Admin layout (Sidebar, Header)
│   │   ├── api.js                 # API utilities
│   │   ├── App.jsx                # Admin app root
│   │   └── main.jsx               # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                        # Express backend
│   ├── routes/
│   │   ├── polls.js               # Public poll endpoints
│   │   ├── subscribe.js           # Newsletter endpoints
│   │   ├── socialmedia.js         # Social links endpoints
│   │   └── admin/                 # Admin API endpoints
│   │       ├── auth.js            # Login, password reset
│   │       ├── users.js           # User management
│   │       ├── dashboard.js       # Dashboard stats
│   │       ├── pollQuestions.js   # Poll CMS
│   │       └── media.js           # Media upload
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   └── rateLimit.js           # Rate limiting
│   ├── db/
│   │   ├── pool.js                # MySQL connection pool
│   │   └── init.sql               # Database schema
│   ├── scripts/
│   │   └── initDb.js              # Database initialization
│   ├── app.js                     # Express app setup
│   └── package.json
├── vite.config.js
├── package.json
├── .env.example
└── README.md
```

## Database Schema

### Core Tables
- `admin_users` - CMS user accounts with role-based access
- `password_reset_tokens` - Secure password reset flow
- `poll_questions` - Poll definitions with JSON options
- `poll_votes` - Vote records with IP deduplication
- `newsletter_subscribers` - Subscriber management
- `podcasts` - Podcast episodes with media URLs
- `cartoons` - Cartoon gallery with Cloudinary URLs
- `mingle_posts` - Mingle project content (4 sections)
- `playlists` - Audio/music playlists with embeds
- `leads` - Form submissions (booking, advertising, contact)
- `lead_notes` - Internal notes on leads with audit trail
- `site_settings` - CMS-editable configuration (JSON)
- `media_assets` - Media upload tracking
- `audit_log` - Complete action history with IP/UA

## API Reference

### Public Endpoints

```bash
# Polls
GET  /api/polls/active              # Get active poll
POST /api/polls/:id/vote            # Submit vote (rate limited)
GET  /api/polls/:id/results         # Get poll results

# Newsletter
POST /api/subscribe                 # Subscribe to newsletter
GET  /api/subscribe/unsubscribe     # Unsubscribe link
```

### Admin Endpoints (All require JWT)

```bash
# Authentication
POST /api/admin/auth/login          # Login
POST /api/admin/auth/logout         # Logout
POST /api/admin/auth/request-reset  # Request password reset
POST /api/admin/auth/reset-password # Reset password
POST /api/admin/auth/change-password # Change password

# Dashboard
GET  /api/admin/dashboard           # Dashboard stats

# Poll Questions (CRUD)
GET  /api/admin/poll-questions      # List polls
POST /api/admin/poll-questions      # Create poll
GET  /api/admin/poll-questions/:id  # Get poll
PATCH /api/admin/poll-questions/:id # Update poll
DELETE /api/admin/poll-questions/:id # Archive poll
POST /api/admin/poll-questions/:id/publish # Publish poll

# Media
GET  /api/admin/media               # List media
POST /api/admin/media/upload        # Upload media
DELETE /api/admin/media/:id         # Delete media

# Users (Admin only)
GET  /api/admin/users               # List users
POST /api/admin/users               # Create user
GET  /api/admin/users/:id           # Get user
PATCH /api/admin/users/:id          # Update user
DELETE /api/admin/users/:id         # Deactivate user
```

## Authentication

### Login Flow
1. POST email/password to `/api/admin/auth/login`
2. Receive JWT token (valid 24 hours)
3. Include token in Authorization header: `Bearer <token>`
4. Token auto-refreshed on each API call

### Roles
- **Admin** - Full access: user management, settings, audit log
- **Editor** - Content only: polls, podcasts, cartoons, leads

### Password Reset
1. Request reset via `/api/admin/auth/request-reset` (email verification)
2. Click link in email (1-hour expiry)
3. POST new password to `/api/admin/auth/reset-password`

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=db_poll

# Server
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-change-in-production

# SendGrid (Email)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@liberty.local

# Cloudinary (Media)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Build & Deploy

### Build for Production
```bash
npm run build:all           # Builds both frontend and admin
```

Output:
- `dist/` - Public site (served at `/`)
- `admin/dist/` - Admin CMS (served at `/admin`)

### Run Production Server
```bash
npm run build:all
cd server
npm install --production
npm start
```

Server will:
- Serve static frontend files
- Serve admin CMS at `/admin`
- Handle API requests at `/api`

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy all source
COPY . .

# Install dependencies
RUN npm install && \
    cd server && npm install --production && \
    cd ../admin && npm install && npm run build && \
    cd .. && npm run build

# Expose port
EXPOSE 8080

# Run server
CMD ["cd", "server", "&&", "npm", "start"]
```

## Features in Detail

### Poll Engine
- 24-hour IP+UserAgent deduplication prevents vote manipulation
- One active poll at a time (auto-deactivates others)
- Live vote tallies in admin dashboard
- Results endpoint for public display
- Rate limiting (5 votes per IP per minute)

### Media Management
- Cloudinary integration for all uploads
- Automatic image optimization and resizing
- Video support (up to 50MB)
- File type/size validation
- Media asset tracking in database

### Email System
- SendGrid integration for transactional emails
- Password reset flow with 1-hour token expiry
- Newsletter subscription management
- Unsubscribe links in all emails
- GDPR-compliant opt-in/out

### Security
- JWT authentication (24-hour expiry)
- bcrypt password hashing (10 rounds)
- Rate limiting on login (5 attempts per 15 min)
- Rate limiting on voting (5 per minute per IP)
- Parameterized SQL queries (no injection)
- CORS validation
- Audit logging of all admin actions
- Soft deletes (no permanent data loss)

### Audit Log
- Tracks: actor, action, entity, timestamp, IP, user agent
- Actions: create, update, delete, publish, login, logout
- Searchable by date range, actor, entity type
- Admin-only access
- Immutable (read-only)

## Development Tips

### Adding a New Content Type
1. Add table to `server/db/init.sql`
2. Create API routes in `server/routes/admin/<type>.js`
3. Create React pages in `admin/src/pages/<Type>.jsx`
4. Add menu item to `admin/src/layouts/DashboardLayout.jsx`
5. Add API functions to `admin/src/api.js`

### Testing Changes
```bash
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Frontend
npm run dev

# Terminal 3: Admin
cd admin
npm run dev
```

### Common Issues

**"Connection refused" on startup**
- Ensure MySQL is running: `mysql -u root`
- Check DB credentials in `.env`
- Run `npm run db:init` to create tables

**"Cloudinary upload fails"**
- Verify API credentials in `.env`
- Check file size limits (10MB images, 50MB video)
- Ensure file is valid media format

**"Email not sending"**
- Verify SendGrid API key in `.env`
- Check sender email is verified in SendGrid
- Review SendGrid dashboard for delivery status

**Admin CMS not loading**
- Clear browser cache (hard refresh: Ctrl+Shift+R)
- Check server is running: curl http://localhost:8080/health
- Review browser console for CORS errors

## Performance

### Frontend Targets
- Lighthouse score ≥ 90 (accessibility, SEO)
- LCP < 2.5s on 4G
- CLS < 0.1
- FID < 100ms

### Backend Targets
- P95 response time < 100ms
- 99.9% uptime (single region acceptable for v1)
- Database query < 50ms

### Optimization Tips
- Use browser DevTools Network tab to profile
- Enable gzip compression in production
- Implement Redis caching for dashboard stats
- Use CDN for static assets (Cloudinary for images)
- Database indexing on frequently queried fields

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and commit: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues or questions, please refer to:
- GitHub Issues: [Liberty Issues](https://github.com/your-org/liberty/issues)
- Documentation: [Liberty Docs](http://localhost:5173/docs)
- Admin Dashboard: http://localhost:3000 (after startup)

---

**Status:** Phase 1 Complete ✅ | Phases 2-7 In Progress 🚀
