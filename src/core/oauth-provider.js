/**
 * OAuth Provider for Marketplace Apps
 * 
 * Allows third-party marketplace apps to access customer CDP data securely
 * Implements OAuth 2.0 authorization code flow
 * 
 * Flow:
 * 1. Customer installs app → redirected to authorization page
 * 2. Customer grants permissions (scopes)
 * 3. App receives authorization code
 * 4. App exchanges code for access token
 * 5. App uses access token to call CDP API
 * 
 * Scopes:
 * - profiles:read - Read customer profiles
 * - profiles:write - Create/update profiles
 * - events:read - Read events
 * - events:write - Track events
 * - segments:read - Read segments
 * - audiences:activate - Activate audiences
 * - analytics:read - Read analytics data
 */

const crypto = require('crypto');

// In-memory storage
const authorizationCodes = new Map();
const accessTokens = new Map();
const refreshTokens = new Map();
const appAuthorizations = new Map();

/**
 * Available OAuth scopes
 */
const OAUTH_SCOPES = {
  'profiles:read': {
    name: 'Read customer profiles',
    description: 'View customer profile data, attributes, and segments',
  },
  'profiles:write': {
    name: 'Create and update profiles',
    description: 'Create new profiles and update existing profile data',
  },
  'events:read': {
    name: 'Read customer events',
    description: 'View customer behavioral events and activity history',
  },
  'events:write': {
    name: 'Track events',
    description: 'Send customer behavioral events to CDP',
  },
  'segments:read': {
    name: 'Read segments',
    description: 'View segment definitions and membership',
  },
  'segments:write': {
    name: 'Create and manage segments',
    description: 'Create, update, and delete customer segments',
  },
  'audiences:activate': {
    name: 'Activate audiences',
    description: 'Send audience data to external platforms',
  },
  'analytics:read': {
    name: 'Read analytics',
    description: 'View analytics, reports, and insights',
  },
  'campaigns:write': {
    name: 'Create campaigns',
    description: 'Create and trigger marketing campaigns',
  },
  'webhooks:manage': {
    name: 'Manage webhooks',
    description: 'Create and manage webhook subscriptions',
  },
};

/**
 * Initiate OAuth authorization flow
 * 
 * Customer clicks "Install App" → redirected here
 */
function initiateAuthorization(customerId, appId, requestedScopes, redirectUri) {
  // Validate requested scopes
  const scopes = requestedScopes.split(' ');
  for (const scope of scopes) {
    if (!OAUTH_SCOPES[scope]) {
      throw new Error(`Invalid scope: ${scope}`);
    }
  }
  
  // Generate authorization code
  const authCode = generateSecureToken('auth');
  
  const authorization = {
    code: authCode,
    customerId,
    appId,
    requestedScopes: scopes,
    redirectUri,
    expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
    used: false,
  };
  
  authorizationCodes.set(authCode, authorization);
  
  // Return authorization URL (would render consent screen)
  return {
    authorizationUrl: `/oauth/authorize?code=${authCode}&customer_id=${customerId}&app_id=${appId}&scopes=${requestedScopes}`,
    code: authCode,
  };
}

/**
 * Customer grants permissions
 * 
 * After customer clicks "Allow" on consent screen
 */
function grantAuthorization(authCode, grantedScopes) {
  const authorization = authorizationCodes.get(authCode);
  
  if (!authorization) {
    throw new Error('Invalid authorization code');
  }
  
  if (authorization.used) {
    throw new Error('Authorization code already used');
  }
  
  if (Date.now() > authorization.expiresAt) {
    throw new Error('Authorization code expired');
  }
  
  // Mark as granted
  authorization.grantedScopes = grantedScopes;
  authorization.grantedAt = new Date().toISOString();
  
  // Redirect back to app with code
  const redirectUrl = `${authorization.redirectUri}?code=${authCode}&state=success`;
  
  return {
    redirectUrl,
    code: authCode,
  };
}

/**
 * Exchange authorization code for access token
 * 
 * App calls this with the authorization code
 */
function exchangeCodeForToken(authCode, appId, clientSecret) {
  const authorization = authorizationCodes.get(authCode);
  
  if (!authorization) {
    throw new Error('Invalid authorization code');
  }
  
  if (authorization.used) {
    throw new Error('Authorization code already used');
  }
  
  if (Date.now() > authorization.expiresAt) {
    throw new Error('Authorization code expired');
  }
  
  if (authorization.appId !== appId) {
    throw new Error('App ID mismatch');
  }
  
  // Validate client secret (would check against registered app)
  // In production, would verify clientSecret matches app
  
  // Mark code as used
  authorization.used = true;
  
  // Generate access token and refresh token
  const accessToken = generateSecureToken('access');
  const refreshToken = generateSecureToken('refresh');
  
  const tokenData = {
    accessToken,
    refreshToken,
    customerId: authorization.customerId,
    appId: authorization.appId,
    scopes: authorization.grantedScopes,
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    createdAt: new Date().toISOString(),
  };
  
  accessTokens.set(accessToken, tokenData);
  refreshTokens.set(refreshToken, tokenData);
  
  // Store app authorization for this customer
  const authId = `${authorization.customerId}_${authorization.appId}`;
  appAuthorizations.set(authId, {
    customerId: authorization.customerId,
    appId: authorization.appId,
    scopes: authorization.grantedScopes,
    accessToken,
    refreshToken,
    authorizedAt: new Date().toISOString(),
  });
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 3600, // seconds
    scope: authorization.grantedScopes.join(' '),
  };
}

/**
 * Refresh access token
 * 
 * When access token expires, use refresh token to get new one
 */
function refreshAccessToken(refreshToken) {
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData) {
    throw new Error('Invalid refresh token');
  }
  
  // Revoke old access token
  accessTokens.delete(tokenData.accessToken);
  
  // Generate new access token
  const newAccessToken = generateSecureToken('access');
  
  const newTokenData = {
    accessToken: newAccessToken,
    refreshToken, // Same refresh token
    customerId: tokenData.customerId,
    appId: tokenData.appId,
    scopes: tokenData.scopes,
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    createdAt: new Date().toISOString(),
  };
  
  accessTokens.set(newAccessToken, newTokenData);
  refreshTokens.set(refreshToken, newTokenData);
  
  // Update app authorization
  const authId = `${tokenData.customerId}_${tokenData.appId}`;
  const appAuth = appAuthorizations.get(authId);
  if (appAuth) {
    appAuth.accessToken = newAccessToken;
  }
  
  return {
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: tokenData.scopes.join(' '),
  };
}

/**
 * Validate access token and check scope permission
 * 
 * Called on every API request from marketplace app
 */
function validateToken(accessToken, requiredScope) {
  const tokenData = accessTokens.get(accessToken);
  
  if (!tokenData) {
    return {
      valid: false,
      error: 'invalid_token',
      message: 'Access token not found or revoked',
    };
  }
  
  if (Date.now() > tokenData.expiresAt) {
    return {
      valid: false,
      error: 'token_expired',
      message: 'Access token has expired',
    };
  }
  
  // Check if token has required scope
  if (requiredScope && !tokenData.scopes.includes(requiredScope)) {
    return {
      valid: false,
      error: 'insufficient_scope',
      message: `Token does not have required scope: ${requiredScope}`,
      has: tokenData.scopes,
      needs: requiredScope,
    };
  }
  
  return {
    valid: true,
    customerId: tokenData.customerId,
    appId: tokenData.appId,
    scopes: tokenData.scopes,
  };
}

/**
 * Revoke app access
 * 
 * Customer can revoke app permissions
 */
function revokeAppAuthorization(customerId, appId) {
  const authId = `${customerId}_${appId}`;
  const appAuth = appAuthorizations.get(authId);
  
  if (!appAuth) {
    throw new Error('App authorization not found');
  }
  
  // Revoke tokens
  accessTokens.delete(appAuth.accessToken);
  refreshTokens.delete(appAuth.refreshToken);
  
  // Remove authorization
  appAuthorizations.delete(authId);
  
  return {
    revoked: true,
    customerId,
    appId,
    revokedAt: new Date().toISOString(),
  };
}

/**
 * Get customer's authorized apps
 */
function getAuthorizedApps(customerId) {
  const authorized = [];
  
  for (const [authId, appAuth] of appAuthorizations.entries()) {
    if (appAuth.customerId === customerId) {
      authorized.push({
        appId: appAuth.appId,
        scopes: appAuth.scopes,
        authorizedAt: appAuth.authorizedAt,
      });
    }
  }
  
  return authorized;
}

/**
 * Get app's authorized customers
 * 
 * For app developers to see who installed their app
 */
function getAppAuthorizations(appId) {
  const installations = [];
  
  for (const [authId, appAuth] of appAuthorizations.entries()) {
    if (appAuth.appId === appId) {
      installations.push({
        customerId: appAuth.customerId,
        scopes: appAuth.scopes,
        authorizedAt: appAuth.authorizedAt,
      });
    }
  }
  
  return installations;
}

// Helper functions
function generateSecureToken(type) {
  const prefix = {
    auth: 'aura_auth',
    access: 'aura_access',
    refresh: 'aura_refresh',
  }[type];
  
  const random = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${random}`;
}

// Export
module.exports = {
  // Authorization flow
  initiateAuthorization,
  grantAuthorization,
  exchangeCodeForToken,
  
  // Token management
  refreshAccessToken,
  validateToken,
  
  // Revocation
  revokeAppAuthorization,
  
  // Queries
  getAuthorizedApps,
  getAppAuthorizations,
  
  // Constants
  OAUTH_SCOPES,
};
