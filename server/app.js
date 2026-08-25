/* eslint-disable no-undef */
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Import routes
import pollsRouter from './routes/polls.js';
import subscribeRouter from './routes/subscribe.js';
import socialMediaRouter from './routes/socialmedia.js';
import adminAuthRouter from './routes/admin/auth.js';
import adminUsersRouter from './routes/admin/users.js';
import adminDashboardRouter from './routes/admin/dashboard.js';
import adminPollQuestionsRouter from './routes/admin/pollQuestions.js';
import adminMediaRouter from './routes/admin/media.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS blocked: origin not allowed'));
      }
    },
    credentials: true,
  })
);

// ============================================
// PUBLIC ROUTES
// ============================================

// Polls
app.use('/api/polls', pollsRouter);

// Newsletter
app.use('/api/subscribe', subscribeRouter);

// Social media links
app.use('/api/social', socialMediaRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// ADMIN ROUTES
// ============================================

// Admin Authentication
app.use('/api/admin/auth', adminAuthRouter);

// Admin Users Management
app.use('/api/admin/users', adminUsersRouter);

// Admin Dashboard
app.use('/api/admin/dashboard', adminDashboardRouter);

// Admin Poll Questions
app.use('/api/admin/poll-questions', adminPollQuestionsRouter);

// Admin Media Upload
app.use('/api/admin/media', adminMediaRouter);

// ============================================
// STATIC FILES & SPA FALLBACK
// ============================================

// Serve admin SPA if it exists
const adminDist = path.join(__dirname, '../admin/dist');
app.use('/admin', express.static(adminDist));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

// Serve public SPA
const clientDist = path.join(__dirname, '../dist');
app.use(express.static(clientDist));

app.get('/*', (req, res, next) => {
  // Don't send SPA for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return next();
  }

  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({
        error: 'Client build not found. Run npm run build',
      });
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
});
