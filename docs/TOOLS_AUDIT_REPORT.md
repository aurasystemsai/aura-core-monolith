# UI/Backend Tools Audit

## Tools Advertised in ToolsMeta but NOT Registered in Backend API

The following tools appear in `toolMeta.js` (shown to users in the UI) but are NOT registered in `server.js` as accessible API routes:

### Tier: Should Be Added to Backend Routes

1. **ab-testing-suite** - "A/B Testing Suite"
   - Folder exists: ✅ `src/tools/ab-testing-suite/`
   - Frontend component: ✅ `ABTestingSuite.jsx`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js

2. **ad-creative-optimizer** - "Ad Creative Optimizer"
   - Folder exists: ✅ `src/tools/ad-creative-optimizer/`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js or remove from toolMeta

3. **ads-anomaly-guard** - "Ads Anomaly Guard"
   - Folder exists: ✅ `src/tools/ads-anomaly-guard/`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js or remove from toolMeta

4. **advanced-finance-inventory-planning** - "Advanced Finance & Inventory Planning"
   - Folder exists: ✅ `src/tools/advanced-finance-inventory-planning/`
   - Frontend component: ✅ `AdvancedFinanceInventoryPlanning.jsx`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js

5. **advanced-personalization-engine** - "Advanced Personalization Engine"
   - Folder exists: ✅ `src/tools/advanced-personalization-engine/`
   - Frontend component: ✅ `AdvancedPersonalizationEngine.jsx`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js (Enterprise tier)

6. **ai-content-image-gen** - "AI Content & Image Gen"
   - Folder exists: ✅ `src/tools/ai-content-image-gen/`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js or remove from toolMeta

7. **ai-segmentation-engine** - "AI Segmentation"
   - Folder exists: ✅ `src/tools/ai-segmentation-engine/`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js or remove from toolMeta

8. **automation-templates** - "Automation Templates"
   - Folder exists: ✅ `src/tools/automation-templates/`
   - Frontend component: ✅ `AutomationTemplates.jsx`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js

9. **backlink-explorer** - "Backlink Explorer"
   - Folder exists: ✅ `src/tools/backlink-explorer/`
   - Frontend component: ✅ `BacklinkExplorer.jsx`
   - Backend route: ❌ NOT in server.js
   - **Action**: Add to server.js

10. **churn-prediction-playbooks** - "Churn Prediction Playbooks"
    - Folder exists: ✅ `src/tools/churn-prediction-playbooks/`
    - Frontend component: ✅ `ChurnPredictionPlaybooks.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

11. **collaboration-approval-workflows** - "Collaboration & Approval Workflows"
    - Folder exists: ✅ `src/tools/collaboration-approval-workflows/`
    - Frontend component: ✅ `CollaborationApprovalWorkflows.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

12. **competitive-analysis** - "Competitive Analysis"
    - Folder exists: ✅ `src/tools/competitive-analysis/`
    - Frontend component: ✅ `CompetitiveAnalysis.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

13. **compliance-privacy-suite** - "Compliance & Privacy Suite"
    - Folder exists: ✅ `src/tools/compliance-privacy-suite/`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

14. **consent-privacy-management** - "Consent & Privacy Management"
    - Folder exists: ✅ `src/tools/consent-privacy-management/`
    - Frontend component: ✅ `ConsentPrivacyManagement.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

15. **content-scoring-optimization** - "Content Scoring & Optimization"
    - Folder exists: ✅ `src/tools/content-scoring-optimization/`
    - Frontend component: ✅ `ContentScoringOptimization.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

16. **custom-dashboard-builder** - "Custom Dashboard Builder"
    - Folder exists: ✅ `src/tools/custom-dashboard-builder/`
    - Frontend component: ✅ `CustomDashboardBuilder.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

17. **customer-data-platform** - "Customer Data Platform"
    - Folder exists: ✅ `src/tools/customer-data-platform/`
    - Frontend component: ✅ `CustomerDataPlatform.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js (Professional tier)

18. **data-warehouse-connector** - "Data Warehouse Connector"
    - Folder exists: ✅ `src/tools/data-warehouse-connector/`
    - Frontend component: ✅ `DataWarehouseConnector.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js (Enterprise tier)

19. **entity-topic-explorer** - "Entity Topic Explorer"
    - Folder exists: ✅ `src/tools/entity-topic-explorer/`
    - Frontend component: ✅ `EntityTopicExplorer.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

20. **facebook-ads-integration** - "Facebook/Instagram Ads Integration"
    - Folder exists: ✅ `src/tools/facebook-ads-integration/`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js or remove from toolMeta

21. **google-ads-integration** - "Google Ads Integration"
    - Folder exists: ✅ `src/tools/google-ads-integration/`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js or remove from toolMeta

22. **internal-linking-suggestions** - "Internal Linking Suggestions"
    - Folder exists: ✅ `src/tools/internal-linking-suggestions/`
    - Frontend component: ✅ `InternalLinkingSuggestions.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

23. **inventory-forecasting** - "Inventory Forecasting"
    - Folder exists: ✅ `src/tools/inventory-forecasting/`
    - Frontend component: ✅ `InventoryForecasting.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

24. **keyword-research-suite** - "Keyword Research Suite"
    - Folder exists: ✅ `src/tools/keyword-research-suite/`
    - Frontend component: ✅ `KeywordResearchSuite.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js (Professional tier)

25. **link-intersect-outreach** - "Link Intersect & Outreach"
    - Folder exists: ✅ `src/tools/link-intersect-outreach/`
    - Frontend component: ✅ `LinkIntersectOutreach.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

26. **local-seo-toolkit** - "Local SEO Toolkit"
    - Folder exists: ✅ `src/tools/local-seo-toolkit/`
    - Frontend component: ✅ `LocalSEOToolkit.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

27. **loyalty-referral-programs** - "Loyalty & Referral Programs"
    - Folder exists: ✅ `src/tools/loyalty-referral-engine/`
    - Frontend component: ✅ `LoyaltyReferralPrograms.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js (Professional/Enterprise tier)

28. **main-suite** - "Main Suite"
    - Folder exists: ✅ `src/tools/main-suite/`
    - Frontend component: ✅ `MainSuite.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js or it's frontend-only aggregator

29. **omnichannel-campaign-builder** - "Omnichannel Campaign Builder"
    - Folder exists: ✅ `src/tools/omnichannel-campaign-builder/`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js or remove from toolMeta

30. **personalization-recommendation-engine** - "Personalization Recommendation Engine"
    - Folder exists: ✅ `src/tools/personalization-recommendation-engine/`
    - Frontend component: ✅ `PersonalizationRecommendationEngine.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js (Professional/Enterprise tier)

31. **predictive-analytics-widgets** - "Predictive Analytics Widgets"
    - Folder exists: ✅ `src/tools/predictive-analytics-widgets/`
    - Frontend component: ✅ `PredictiveAnalyticsWidgets.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js (Professional tier)

32. **reporting-integrations** - "Reporting Integrations"
    - Folder exists: ✅ `src/tools/reporting-integrations/`
    - Frontend component: ✅ `ReportingIntegrations.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

33. **returns-rma-automation** - "Returns/RMA Automation"
    - Folder exists: ✅ `src/tools/returns-rma-automation/`
    - Frontend component: ✅ `ReturnsRMAAutomation.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

34. **scheduled-export** - "Scheduled Export"
    - Folder exists: ✅ `src/tools/scheduled-export/`
    - Frontend component: ✅ `ScheduledExport.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

35. **self-service-analytics** - "Self-Service Analytics"
    - Folder exists: ✅ `src/tools/self-service-analytics/`
    - Frontend component: ✅ `SelfServiceAnalytics.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

36. **self-service-portal** - "Self Service Portal"
    - Folder exists: ✅ `src/tools/self-service-portal/`
    - Frontend component: ✅ `SelfServicePortal.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

37. **seo-master-suite** - "SEO Master Suite"
    - Folder exists: ✅ `src/tools/seo-master-suite/`
    - Frontend component: ✅ `SeoMasterSuite.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js or it's frontend-only aggregator

38. **seo-site-crawler** - "SEO Site Crawler"
    - Folder exists: ✅ `src/tools/seo-site-crawler/`
    - Frontend component: ✅ `SEOSiteCrawler.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

39. **serp-tracker** - "SERP Tracker"
    - Folder exists: ✅ `src/tools/serp-tracker/`
    - Frontend component: ✅ `SERPTracker.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

40. **site-audit-health** - "Site Audit Health"
    - Folder exists: ✅ `src/tools/site-audit-health/`
    - Frontend component: ✅ `SiteAuditHealth.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

41. **social-media-analytics-listening** - "Social Media Analytics & Listening"
    - Folder exists: ✅ `src/tools/social-media-analytics-listening/`
    - Frontend component: ✅ `SocialMediaAnalyticsListening.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

42. **tiktok-ads-integration** - "TikTok Ads Integration"
    - Folder exists: ✅ `src/tools/tiktok-ads-integration/`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js or remove from toolMeta

43. **upsell-cross-sell-engine** - "Upsell/Cross-Sell Engine"
    - Folder exists: ✅ `src/tools/upsell-cross-sell-engine/`
    - Frontend component: ✅ `UpsellCrossSellEngine.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

44. **visual-workflow-builder** - "Visual Workflow Builder"
    - Folder exists: ✅ `src/tools/visual-workflow-builder/`
    - Frontend component: ✅ `VisualWorkflowBuilder.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

45. **webhook-api-triggers** - "Webhook & API Triggers"
    - Folder exists: ✅ `src/tools/webhook-api-triggers/`
    - Frontend component: ✅ `WebhookApiTriggers.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

46. **workflow-automation-builder** - "Workflow Automation Builder"
    - Folder exists: ✅ `src/tools/workflow-automation-builder/`
    - Frontend component: ✅ `WorkflowAutomationBuilder.jsx`
    - Backend route: ❌ NOT in server.js
    - **Action**: Add to server.js

## Summary

**Total Tools in ToolsMeta**: ~100
**Tools NOT Registered in Backend**: 46
**Percentage Missing**: ~46%

## Recommendations

### Option 1: Add All Missing Routes (Recommended if tools are functional)
Add all 46 tools to server.js with appropriate middleware (requireTool) and plan tiers.

### Option 2: Remove Non-Functional Tools from UI (Recommended for now)
Remove incomplete/non-functional tools from toolMeta.js so users don't see tools they can't use.

### Option 3: Hybrid Approach (Recommended)
1. Keep high-value enterprise tools that are complete
2. Remove stub tools or incomplete features
3. Add "Coming Soon" badge in UI for planned features

## Tools That Are Definitely Complete and Should Be Added

1. **keyword-research-suite** - Has comprehensive backend
2. **customer-data-platform** - Has comprehensive backend
3. **social-media-analytics** - Has backend router
4. **personalization-recommendation-engine** - Has backend
5. **loyalty-referral-engine** - Has extensive backend
6. **ab-testing-suite** - Has comprehensive backend
7. **advanced-personalization-engine** - Has backend
8. **predictive-analytics-widgets** - Mentioned in routes

## Items in toolMeta to REMOVE (Empty States/Placeholders)

1. **winback-empty-state** - UI component, not a tool
2. **winback-feature-card** - UI component, not a tool
3. **winback-help-docs** - Documentation, not a tool
4. **tool-scaffold** - Development scaffold, not a user tool

## Next Steps

1. Review each missing tool's backend implementation
2. Add functional tools to server.js
3. Remove stub/incomplete tools from toolMeta.js
4. Update plan access control to include new tools
5. Test each tool's API endpoints
6. Update documentation
