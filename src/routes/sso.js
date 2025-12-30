// src/routes/sso.js
// SSO (OAuth2/SAML) integration entrypoint for Aura Core

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: SamlStrategy } = require('@node-saml/passport-saml');

// SAML SSO configuration (example, update with your IdP details)
if (process.env.SAML_ENTRY_POINT && process.env.SAML_ISSUER && process.env.SAML_CERT) {
  passport.use(new SamlStrategy({
    entryPoint: process.env.SAML_ENTRY_POINT,
    issuer: process.env.SAML_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL || '/sso/saml/callback',
    cert: process.env.SAML_CERT,
    // Additional options: identifierFormat, decryptionPvk, privateCert, etc.
  }, (profile, done) => {
    // Map SAML profile to Aura user model here
    // e.g., find or create user in your DB
    return done(null, {
      email: profile.email || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      name: profile.displayName || profile.cn || profile.nameID,
      provider: 'saml',
      id: profile.nameID,
      saml: profile
    });
  }));

  // Initiate SAML SSO login
  router.get('/saml', passport.authenticate('saml', { failureRedirect: '/login', session: true }), (req, res) => {
    // This will redirect to the IdP
  });

  // SAML callback URL
  router.post('/saml/callback', passport.authenticate('saml', { failureRedirect: '/login', session: true }), (req, res) => {
    // Successful SAML login
    // Issue JWT or set session/cookie as needed
    res.redirect('/');
  });
}

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

// SAML SSO enabled if SAML env vars are set. See above for configuration.

module.exports = router;
