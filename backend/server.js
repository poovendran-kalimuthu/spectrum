import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import connectDB from './config/db.js';
import MongoStore from 'connect-mongo';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Import Passport Config
import './config/passport.js';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import evaluatorRoutes from './routes/evaluator.js';
import attendanceRoutes from './routes/attendance.js';
import projectRoutes from './routes/projects.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import searchRoutes from './routes/search.js';
import notificationRoutes from './routes/notifications.js';
import documentRoutes from './routes/documentRoutes.js';
import { protect } from './middleware/authMiddleware.js';

const app = express();
 
// Essential for Vercel/Render proxy to work correctly
// Essential for Vercel/Render proxy to work correctly
app.set('trust proxy', true); // Trust all upstream proxies (Vercel + Render)

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash if present
  'http://localhost:5173',
  'http://localhost:5000'
];

app.use(cors({
  origin: allowedOrigins,
  methods: 'GET,POST,PUT,PATCH,DELETE',
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Session-Header Injection Middleware (Fix for Brave/Safari cookie blocking)
app.use((req, res, next) => {
  const sid = req.headers['x-auth-token'] || req.query.sid;
  if (sid && (!req.headers.cookie || !req.headers.cookie.includes('token'))) {
    req.headers.cookie = `token=${sid}${req.headers.cookie ? '; ' + req.headers.cookie : ''}`;
  }
  next();
});

// Serve static files (like uploaded PDFs)
app.use('/uploads', express.static('uploads'));

// Session Setup - MUST BE BEFORE PASSPORT MIDDLEWARE
app.use(session({
  name: 'token', // Exact Name requested by user
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Required for cookies over HTTPS behind proxy
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    // Force secure and sameSite: none if we are on a production URL (HTTPS)
    secure: process.env.BACKEND_URL?.startsWith('https') || process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: (process.env.BACKEND_URL?.startsWith('https') || process.env.NODE_ENV === 'production') ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Passport Config middleware
app.use(passport.initialize());
app.use(passport.session()); // Session support for login sessions

// Map Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/evaluator', evaluatorRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);

// Example protected route
app.get('/api/dashboard', protect, (req, res) => {
  res.json({
    message: 'Welcome to the protected dashboard area!',
    user: req.user
  });
});

app.get('/', (req, res) => {
  res.send(`Spectrum Backend is Live! (Environment: ${process.env.NODE_ENV || 'development'})`);
});

app.get('/api/config-check', (req, res) => {
  res.json({
    frontend: process.env.FRONTEND_URL,
    backend: process.env.BACKEND_URL,
    trustProxy: app.get('trust proxy'),
    headers: {
      host: req.headers.host,
      forwardedHost: req.headers['x-forwarded-host'],
      forwardedProto: req.headers['x-forwarded-proto']
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Trigger nodemon restart v3
