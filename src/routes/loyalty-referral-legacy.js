'use strict';

const express = require('express');
const loyaltyRouter = require('./loyalty-referral');

function createForwarder(rewritePath) {
  const router = express.Router();
  router.use((req, res, next) => {
    const originalUrl = req.url;
    req.url = rewritePath(req.url);
    loyaltyRouter.handle(req, res, (error) => {
      req.url = originalUrl;
      next(error);
    });
  });
  return router;
}

module.exports = {
  loyaltyPrograms: createForwarder(path => path),
  referralCampaigns: createForwarder(path => `/referrals${path === '/' ? '' : path}`),
};
