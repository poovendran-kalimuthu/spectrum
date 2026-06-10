import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/google/callback` 
      : '/api/auth/google/callback',
    proxy: true,
    state: true,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log("Google profile received:", profile.id, profile.emails[0]?.value);
      // Check if user already exists by googleId or email
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0]?.value }
        ]
      });

      if (user) {
        // Link googleId if it was manually created by an admin
        if (!user.googleId) {
          user.googleId = profile.id;
          if (!user.profilePicture) {
            user.profilePicture = profile.photos[0]?.value;
          }
          await user.save();
        }

        const coordinators = [
          'sksanjay06052005@gmail.com',
          'mukesh.adcbe@gmail.com',
          'arssiva35@gmail.com'
        ];
        if (coordinators.includes(user.email) && user.role === 'user') {
          user.role = 'admin_t1';
          await user.save();
        }
        return done(null, user);
      } else {
        const coordinators = [
          'sksanjay06052005@gmail.com',
          'mukesh.adcbe@gmail.com',
          'arssiva35@gmail.com'
        ];
        const assignedRole = coordinators.includes(profile.emails[0]?.value) ? 'admin_t1' : 'user';

        // If not, create a new user in our db
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0]?.value,
          profilePicture: profile.photos[0]?.value,
          role: assignedRole
        });
        return done(null, user);
      }
    } catch (error) {
      console.error("Passport verify callback error:", error);
      return done(error, null);
    }
  }
));

passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/microsoft/callback` 
      : '/api/auth/microsoft/callback',
    scope: ['user.read'],
    tenant: process.env.MICROSOFT_TENANT_ID,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("Microsoft profile received:", profile.id, profile.emails[0]?.value);
      // Check if user already exists by microsoftId or email
      let user = await User.findOne({ 
        $or: [
          { microsoftId: profile.id },
          { email: profile.emails[0]?.value }
        ]
      });

      if (user) {
        if (!user.microsoftId) {
          user.microsoftId = profile.id;
          await user.save();
        }
        return done(null, user);
      } else {
        user = await User.create({
          microsoftId: profile.id,
          name: profile.displayName,
          email: profile.emails[0]?.value,
          role: 'user'
        });
        return done(null, user);
      }
    } catch (error) {
      console.error("Microsoft Passport verify callback error:", error);
      return done(error, null);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
