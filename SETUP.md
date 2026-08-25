# Liberty CMS - Setup & Deployment Guide

## Quick Start (Development)

### 1. Prerequisites
- Node.js 18+
- MySQL 8+
- Git

### 2. Clone & Install

```bash
git clone <repo-url>
cd liberty
npm install
cd server && npm install
cd ../admin && npm install
cd ..
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=db_poll

# Server
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=generate-a-random-key-here

# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@liberty.local

# Cloudinary (Media)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Initialize Database

```bash
npm run db:init
```

This creates all tables and default settings.

### 5. Create First Admin User

```bash
# Use MySQL client to insert
mysql -u root -p db_poll

INSERT INTO admin_users (email, password_hash, role, is_active)
VALUES ('admin@liberty.local', '$2b$10$...', 'admin', TRUE);
```

For the password hash, use bcrypt to hash your password first. Or use this Node.js snippet:

```bash
node -e "require('bcrypt').hash('password123', 10, (err, hash) => console.log(hash))"
```

### 6. Start Development Environment

```bash
npm run dev:all
```

This starts:
- Public site: http://localhost:5173
- Admin CMS: http://localhost:3000
- Server API: http://localhost:8080

---

## Production Deployment

### Build Artifacts

```bash
# Build both frontend and admin
npm run build:all

# Output:
# - dist/              (public site - 5MB)
# - admin/dist/        (admin CMS - 3MB)
```

### Docker Deployment

1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY admin/package*.json ./admin/

# Install dependencies
RUN npm install --production
RUN cd server && npm install --production
RUN cd ../admin && npm install --production

# Copy source
COPY . .

# Build
RUN npm run build:all

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start server
WORKDIR /app/server
CMD ["npm", "start"]
```

2. **Build & Run**

```bash
docker build -t liberty:latest .
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=db.example.com \
  -e DB_USER=prod_user \
  -e DB_PASSWORD=secure_password \
  -e SENDGRID_API_KEY=sg_... \
  -e CLOUDINARY_CLOUD_NAME=... \
  liberty:latest
```

3. **Docker Compose** (for local multi-service setup)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: db_poll
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  liberty:
    build: .
    ports:
      - "8080:8080"
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: root_password
      DB_NAME: db_poll
      JWT_SECRET: ${JWT_SECRET}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
    depends_on:
      - mysql

volumes:
  mysql_data:
```

### Environment Variables (Production)

| Variable | Example | Notes |
|----------|---------|-------|
| `DB_HOST` | `db.prod.internal` | RDS/Cloud DB |
| `DB_USER` | `liberty_app` | Restricted user |
| `DB_PASSWORD` | `${SECRET_MANAGER}` | Use secrets service |
| `JWT_SECRET` | `generate-random-32-char-key` | Keep secret, rotate regularly |
| `SENDGRID_API_KEY` | `SG_...` | Transactional email |
| `CLOUDINARY_CLOUD_NAME` | `your-cloud` | Media CDN |
| `NODE_ENV` | `production` | Enables caching, minification |
| `PORT` | `8080` | Container port |

### Scaling Considerations

**Single Instance (1-100k visitors/month):**
- Single EC2/DigitalOcean droplet
- Local MySQL or RDS
- Cloudinary for media (scales automatically)

**Multi-Instance (100k-1M visitors/month):**
- Load balancer (ALB/Nginx)
- RDS Multi-AZ for MySQL
- Redis for session caching
- Cloudinary for media + CDN

**Enterprise (1M+ visitors/month):**
- Kubernetes cluster
- Managed database (Aurora)
- Message queue (SQS/RabbitMQ)
- ElastiCache for sessions
- CloudFront for static assets

### Monitoring & Logs

```bash
# Docker logs
docker logs <container_id>

# Health check
curl http://localhost:8080/health

# Performance stats
docker stats

# Database query logs (MySQL)
SHOW PROCESSLIST;
SELECT * FROM mysql.general_log LIMIT 10;
```

### Backup Strategy

**Database:**
```bash
# Daily backup
mysqldump -u root -p db_poll > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p db_poll < backup_20240101.sql
```

**Media (Cloudinary):**
- Automatic backup included in Cloudinary paid plans
- Set retention policy in Cloudinary dashboard

**Code:**
- Git repository (GitHub/GitLab)
- Tag releases: `git tag -a v1.0.0 -m "Release v1.0.0"`

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd server && npm install
          cd ../admin && npm install
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build:all
      
      - name: Build Docker image
        run: docker build -t liberty:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag liberty:${{ github.sha }} myregistry/liberty:latest
          docker push myregistry/liberty:latest
      
      - name: Deploy
        run: |
          # Deploy to your infrastructure
          # kubectl apply -f k8s/
          # OR docker compose pull && docker compose up -d
```

---

## Admin User Setup

### First-Time Login

1. Navigate to `http://localhost:8080/admin`
2. Login with email/password created in database
3. Change password via Settings → Account

### Creating Additional Users

In CMS:
1. Settings → Users → New User
2. Enter email, temporary password, and role
3. User receives password reset email
4. User logs in and sets permanent password

---

## Database Maintenance

### Optimize Tables

```bash
mysql -u root -p db_poll

# Check table sizes
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb 
FROM information_schema.tables 
WHERE table_schema = 'db_poll' 
ORDER BY size_mb DESC;

# Optimize
OPTIMIZE TABLE poll_questions;
OPTIMIZE TABLE audit_log;
```

### Archive Old Data

```sql
-- Archive old polls (older than 1 year)
INSERT INTO audit_log_archive 
SELECT * FROM audit_log 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

DELETE FROM audit_log 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Index Strategy

Key indexes for performance:

```sql
-- Already in schema, but verify:
ALTER TABLE poll_votes ADD INDEX idx_poll_question (poll_question_id);
ALTER TABLE audit_log ADD INDEX idx_created_at (created_at);
ALTER TABLE leads ADD INDEX idx_status_created (status, created_at);
```

---

## Security Hardening

### Before Going Live

1. **Change all defaults:**
   - JWT_SECRET (32+ random chars)
   - Database password (strong, 16+ chars)
   - Sendgrid/Cloudinary keys rotated

2. **SSL/TLS:**
   - Use HTTPS only in production
   - Redirect HTTP → HTTPS
   - Set HSTS header: `Strict-Transport-Security: max-age=31536000`

3. **CORS:**
   - Update `allowedOrigins` in app.js for production domains
   - Remove localhost entries

4. **Rate Limiting:**
   - Already applied to login (5/15min) and polls (5/min)
   - Consider DDoS protection (Cloudflare)

5. **Database:**
   - Use restricted user (not root)
   - Enable SSL for remote connections
   - Regular backups

6. **Secrets Management:**
   - Use AWS Secrets Manager, HashiCorp Vault, or .env files
   - Never commit .env to Git
   - Rotate keys quarterly

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "CORS blocked" | Frontend domain not in allowedOrigins | Update app.js → rebuild |
| Poll not saving | Database connection issue | Check DB_HOST, DB_USER, DB_PASSWORD |
| Email not sending | SendGrid key invalid | Verify SENDGRID_API_KEY in .env |
| Media upload fails | Cloudinary auth issue | Check CLOUDINARY_CLOUD_NAME, API key |
| Port already in use | 8080 occupied | `lsof -i :8080` → kill process or change PORT |
| Build fails | Node version too old | Upgrade to Node 18+ |

---

## Performance Tuning

### Database Query Optimization

```bash
# Enable query logging
SET GLOBAL general_log = 'ON';
SET GLOBAL log_output = 'TABLE';

# Find slow queries
SHOW VARIABLES LIKE 'long_query_time';
SET GLOBAL long_query_time = 2;

# Analyze queries
EXPLAIN SELECT * FROM poll_questions WHERE status = 'active';
```

### Caching Strategy

- **Client-side:** Browser cache (Lighthouse targets > 90)
- **Server-side:** Consider Redis for frequently-fetched settings
- **CDN:** Cloudinary for images; CloudFront for static JS/CSS

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8080/

# Using k6
k6 run load-test.js
```

---

## Success Checklist

- [ ] Database initialized and first admin user created
- [ ] `.env` configured with all secrets
- [ ] SendGrid credentials working (test email sent)
- [ ] Cloudinary credentials working (test upload successful)
- [ ] Public site builds without errors
- [ ] Admin CMS builds without errors
- [ ] Server starts without errors
- [ ] Can login to admin dashboard
- [ ] Can create and publish a poll
- [ ] Poll appears on public site within 2 seconds
- [ ] Health check returns 200: `curl /health`
- [ ] Lighthouse score ≥ 90 on public pages
- [ ] Docker image builds successfully
- [ ] HTTPS enabled in production

---

## Support Resources

- Docs: [Liberty README](./README.md)
- Issues: GitHub Issues
- Email: support@liberty.local
