# Liberty CMS - Installation & First Run Guide

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 16.x | 18.x LTS |
| npm | 8.x | 9.x |
| MySQL | 5.7 | 8.0+ |
| RAM | 2 GB | 4 GB |
| Disk | 2 GB | 5 GB |
| OS | Linux/Mac/Windows | Any |

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/liberty.git
cd liberty
```

### Step 2: Environment Setup

```bash
# Copy template
cp .env.example .env

# Edit with your configuration
nano .env  # or use your editor
```

**Required values:**

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=db_poll

# Server
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT (generate random 32-char string)
JWT_SECRET=your-random-secret-key-32-characters-long

# Email (SendGrid)
SENDGRID_API_KEY=SG_xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@liberty.local

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3: Install Dependencies

```bash
# Root project
npm install

# Server
cd server
npm install
cd ..

# Admin
cd admin
npm install
cd ..
```

### Step 4: Initialize Database

```bash
npm run db:init
```

This script:
1. Creates the `db_poll` database
2. Creates all required tables
3. Inserts default settings

### Step 5: Create First Admin User

**Using MySQL CLI:**

```bash
mysql -u root -p

USE db_poll;

-- Generate password hash with this Node command first:
-- node -e "require('bcrypt').hash('your_password_123', 10, (err, hash) => console.log(hash))"

INSERT INTO admin_users (email, password_hash, role, is_active)
VALUES ('admin@liberty.local', '$2b$10$YOUR_BCRYPT_HASH_HERE', 'admin', TRUE);

exit;
```

**Generate bcrypt hash:**

```bash
node -e "require('bcrypt').hash('password123', 10, (err, hash) => console.log(hash))"
```

Copy the output (long string starting with `$2b$`) and paste into the INSERT statement.

### Step 6: Start Development Server

```bash
npm run dev:all
```

This command starts:
- **Public Frontend:** http://localhost:5173
- **Admin CMS:** http://localhost:3000
- **API Server:** http://localhost:8080

### Step 7: Login to Admin Dashboard

1. Navigate to http://localhost:3000/admin
2. Enter email: `admin@liberty.local`
3. Enter password: (whatever you set in step 5)
4. Click "Sign In"

---

## First-Time Setup Checklist

- [ ] MySQL running (`mysql --version` shows 5.7+)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] `.env` file created and filled with all values
- [ ] `npm install` completed in root, server, and admin
- [ ] `npm run db:init` completed without errors
- [ ] Admin user created in database
- [ ] `npm run dev:all` running without errors
- [ ] Can access http://localhost:5173 (public site)
- [ ] Can access http://localhost:3000/admin (admin login)
- [ ] Can login with admin@liberty.local
- [ ] Can access http://localhost:8080/health (returns `{"status":"ok","timestamp":"..."}`

---

## Creating Your First Poll

1. **Login** to admin dashboard (http://localhost:3000/admin)
2. **Navigate** to Polls → New Poll
3. **Fill in:**
   - Question: "What's your favorite feature?"
   - Option 1: "Polls"
   - Option 2: "Cartoons"
   - Option 3: "Mingle"
   - Status: Select "Active"
4. **Click** "Create Poll"
5. **Navigate** to http://localhost:5173 and verify poll appears
6. **Vote** in the poll to test the vote recording

---

## Common Setup Issues

### MySQL Connection Error

**Error:** `Connection failed: access denied for user 'root'@'localhost'`

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p

# If password wrong, reset it (macOS):
mysql.server stop
mysqld_safe --skip-grant-tables
mysql -u root
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
exit;
mysql.server restart
```

### Port Already in Use

**Error:** `listen EADDRINUSE: address already in use :::8080`

**Solution:**
```bash
# Kill process on port 8080 (macOS/Linux)
lsof -i :8080
kill -9 <PID>

# OR use different port
PORT=8081 npm run dev:all
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Same for server and admin
cd server && rm -rf node_modules && npm install
cd ../admin && rm -rf node_modules && npm install
```

### Database Already Exists

**Error:** `Database creation failed: Database db_poll already exists`

**Solution:**
```bash
# This is usually safe—the script will reuse the existing database.
# To reset entirely:
mysql -u root -p
DROP DATABASE db_poll;
exit;
npm run db:init
```

---

## Environment Variables Reference

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `DB_HOST` | string | MySQL server hostname | `localhost` or `db.example.com` |
| `DB_USER` | string | MySQL username | `root` or `liberty_app` |
| `DB_PASSWORD` | string | MySQL password | `password123` |
| `DB_NAME` | string | Database name | `db_poll` |
| `PORT` | number | Express server port | `8080` |
| `NODE_ENV` | string | Environment (dev/prod) | `development` |
| `FRONTEND_URL` | string | Public frontend URL | `http://localhost:5173` |
| `JWT_SECRET` | string | JWT signing key (32+ chars) | `random-secret-...` |
| `SENDGRID_API_KEY` | string | SendGrid API key for emails | `SG_...` |
| `SENDGRID_FROM_EMAIL` | string | Email sender address | `noreply@liberty.local` |
| `CLOUDINARY_CLOUD_NAME` | string | Cloudinary cloud name | `mycloud` |
| `CLOUDINARY_API_KEY` | string | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | string | Cloudinary API secret | `secret123abc` |

---

## Generating a Random JWT Secret

```bash
# macOS/Linux
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

---

## Next Steps

### Verify Installation

```bash
# All three services running:
# - Vite (frontend): http://localhost:5173 ✓
# - Admin: http://localhost:3000 ✓
# - Express (API): http://localhost:8080 ✓

# Test health endpoint
curl http://localhost:8080/health
# Response: {"status":"ok","timestamp":"2024-01-15T10:30:45.123Z"}
```

### Configure Admin Accounts

In the admin dashboard, create additional user accounts:
1. Settings → Users → New User
2. Set email, role (Admin/Editor), and temporary password
3. User receives password reset email
4. User logs in and sets permanent password

### Start Building Content

1. **Create initial polls** (Polls section)
2. **Upload media** (Media section) 
3. **Add podcasts** (Podcasts section)
4. **Create cartoons** (Cartoons section)
5. **Set up site configuration** (Settings section)

### Production Deployment

When ready to deploy:
1. Review [SETUP.md](./SETUP.md) for production checklist
2. Build Docker image: `npm run build:all && docker build -t liberty:latest .`
3. Deploy to your infrastructure (EC2, Kubernetes, DigitalOcean, etc.)
4. Set strong passwords and secure all secrets

---

## Support

- **Docs:** See [README.md](./README.md) for full documentation
- **Troubleshooting:** Check [SETUP.md](./SETUP.md) for common issues
- **API Docs:** See README.md "API Reference" section

---

**Last updated:** 2024
**Version:** 1.0.0
