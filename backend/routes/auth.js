import express from 'express';
import passport from 'passport';
import { loginSuccess, loginFailed, logout, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Auth with Google (Initiates the OAuth flow)
// @route   GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('Google Auth Error:', err);
      return res.redirect('/api/auth/login/failed');
    }
    if (!user) {
      console.error('Google Auth Failed (no user):', info);
      return res.redirect('/api/auth/login/failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Google logIn Error:', err);
        return res.redirect('/api/auth/login/failed');
      }
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=session_loss`);
        }
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?sid=${req.sessionID}`);
      });
    });
  })(req, res, next);
});

// @desc    Auth with Microsoft (Initiates the OAuth flow)
// @route   GET /api/auth/microsoft
router.get('/microsoft', passport.authenticate('microsoft', { prompt: 'select_account' }));

// @desc    Microsoft auth callback
// @route   GET /api/auth/microsoft/callback
router.get('/microsoft/callback', (req, res, next) => {
  passport.authenticate('microsoft', (err, user, info) => {
    if (err) {
      console.error('Microsoft Auth Error:', err);
      return res.redirect('/api/auth/login/failed');
    }
    if (!user) {
      console.error('Microsoft Auth Failed (no user):', info);
      return res.redirect('/api/auth/login/failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Microsoft logIn Error:', err);
        return res.redirect('/api/auth/login/failed');
      }
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=session_loss`);
        }
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?sid=${req.sessionID}`);
      });
    });
  })(req, res, next);
});

// @desc    Check successful login and return user details
// @route   GET /api/auth/login/success
router.get('/login/success', loginSuccess);

// @desc    Failed login response
// @route   GET /api/auth/login/failed
router.get('/login/failed', loginFailed);

// @desc    Logout user
// @route   GET /api/auth/logout
router.get('/logout', logout);

// @desc    Update user profile data
// @route   PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

// @desc    Developer login (dev mode only)
// @route   GET /api/auth/dev-login
router.get('/dev-login', async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const User = (await import('../models/User.js')).default;
      let user = await User.findOne({ email: 'admin@test.com' });
      if (!user) {
        user = await User.create({
          googleId: 'dev-admin-id',
          name: 'Developer Admin',
          email: 'admin@test.com',
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          role: 'admin',
          isProfileComplete: true
        });
      } else if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Dev login session creation failed', details: err });
        }
        req.session.save(() => {
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/events`);
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Developer login failed', details: error.message });
    }
  } else {
    res.status(404).send('Not Found');
  }
});

export default router;
