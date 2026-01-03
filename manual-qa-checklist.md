# Manual QA Checklist for Aura Systems Core: All Tools & Features

## General Instructions
- Use the latest version of Chrome, Edge, or Safari.
- Test on both desktop and mobile (responsive mode).
- Log in as both admin and regular user (if RBAC applies).
- For each tool, verify all CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n, docs, webhooks, compliance, plugin, and health check features.
- For each feature, check error handling, loading states, accessibility, and UI/UX polish.
- Use realistic data for all inputs and uploads.
- Record screenshots or screen recordings for any bugs or UI issues.
- Report all issues in the QA tracking system with clear steps to reproduce.

---

## Checklist Structure
- [ ] = Not started
- [/] = In progress
- [x] = Completed

---

## 1. Sidebar & Navigation
- [ ] All tools are visible in the sidebar
- [ ] Sidebar navigation loads correct tool UI
- [ ] Sidebar is responsive and accessible
- [ ] Tool icons and names match branding

## 2. Global Features
- [ ] AI Chatbot widget is visible and functional on all pages
- [ ] Onboarding modal appears for new users
- [ ] Toast notifications display for all actions
- [ ] ErrorBoundary catches and displays errors
- [ ] i18n/language switcher works for all UIs
- [ ] User profile and RBAC features work as expected
- [ ] Dark mode toggle works across all tools

## 3. Tool-Specific QA (Repeat for Each Tool)
For each tool (e.g., Creative Automation Engine, Product SEO Engine, Customer Data Platform, etc.):

### UI/UX
- [ ] Tool loads without errors
- [ ] All main features are visible and accessible
- [ ] Branded UI matches flagship SaaS competitors
- [ ] Responsive layout (desktop/mobile)
- [ ] Accessibility: keyboard navigation, ARIA labels, color contrast

### Core Features
- [ ] CRUD operations (Create, Read, Update, Delete) work for all main entities
- [ ] AI-powered features (if present) work and return expected results
- [ ] Analytics/dashboard loads and updates correctly
- [ ] Import/export (CSV, JSON, etc.) works
- [ ] Shopify sync (if present) works and errors are handled
- [ ] Notifications (in-app/email) trigger on key actions
- [ ] RBAC: Only authorized users can access restricted features
- [ ] i18n: All text is translatable and language switcher works
- [ ] Docs/help links open correct documentation
- [ ] Webhooks: Can be configured and trigger as expected
- [ ] Compliance: GDPR/CCPA/privacy features present
- [ ] Plugin/extensions: Can be enabled/disabled and work as expected
- [ ] Health check/status indicators are present and accurate

### Error Handling & Edge Cases
- [ ] Invalid input shows clear error messages
- [ ] Network/API errors are handled gracefully
- [ ] Loading and empty states are user-friendly
- [ ] Large data sets do not break UI
- [ ] All modals, dialogs, and popovers work as expected

### Advanced/Flagship Features (if present)
- [ ] Bulk actions (edit, delete, export, etc.) work
- [ ] File uploads (images, docs, etc.) work and validate
- [ ] Sharing/collaboration features work
- [ ] Feedback and support links work
- [ ] History/audit log is present and accurate
- [ ] Suggestions/AI recommendations are relevant
- [ ] Custom branding and settings are respected

---

## 4. End-to-End Flows
- [ ] User can sign up, onboard, and access all tools
- [ ] User can connect Shopify and sync data
- [ ] User can use AI features across tools
- [ ] User can export/import data between tools
- [ ] User can trigger and receive notifications
- [ ] User can access help/docs from any tool
- [ ] User can switch languages and see all UIs update
- [ ] User can log out and session is cleared

---

## 5. Regression & Cross-Tool
- [ ] No tool or feature causes errors in others
- [ ] All tools work after deployment/reload
- [ ] All automated tests pass (see e2e/tools-e2e.spec.js)

---

## 6. Reporting
- [ ] All bugs/issues are logged with steps, screenshots, and expected/actual results
- [ ] All failed tests are reported and tracked

---

## Notes
- For each tool, add specific test cases for unique features.
- Update this checklist as new tools/features are added.
- Use this alongside automated E2E tests for full coverage.
