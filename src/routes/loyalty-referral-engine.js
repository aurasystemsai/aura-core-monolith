'use strict';

const express = require('express');
const loyaltyRouter = require('./loyalty-referral');
const legacyRouters = require('./loyalty-referral-legacy');

const router = express.Router();

router.use('/loyalty', legacyRouters.loyaltyPrograms);
router.use('/referral/campaigns', legacyRouters.referralCampaigns);
router.use(loyaltyRouter);

module.exports = router;
