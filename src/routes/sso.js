// src/routes/sso.js
// SSO (OAuth2/SAML) integration entrypoint for Aura Core

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
// For SAML, you could use: const { Strategy: SamlStrategy } = require('passport-saml');

const router = express.Router();

// Configure session middleware (required for Passport)
router.use(session({
  secret: process.env.SESSION_SECRET || 'sso-dev-secret',
  resave: false,
  saveUninitialized: false,
}));
router.use(passport.initialize());
router.use(passport.session());

// Serialize/deserialize user
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Example: Google OAuth2 SSO
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/sso/google/callback',
  }, (accessToken, refreshToken, profile, done) => {
    // Map Google profile to Aura user model here
    // e.g., find or create user in your DB
    return done(null, {
      email: profile.emails[0].value,
      name: profile.displayName,
      provider: 'google',
      id: profile.id,
    });
  }));

  // Initiate SSO login
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  // Callback URL
  router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
    session: true,
  }), (req, res) => {
    // Successful SSO login
    // Issue JWT or set session/cookie as needed
    res.redirect('/');
  });
}

// TODO: Add SAML SSO support (see passport-saml)

module.exports = router;
