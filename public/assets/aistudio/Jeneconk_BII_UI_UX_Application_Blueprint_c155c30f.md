# JENECONK BII — UI/UX SPECIFICATION & SCREEN-BY-SCREEN APPLICATION BLUEPRINT
**Version:** 1.0  
**Date:** 8 November 2026  
**Product owner:** Jeneconk Integrated Global Solutions Limited

## 1. Purpose
This blueprint translates the product strategy, Software Architecture Document (SAD) and Database Design Document (DDD) into a practical application structure. It defines navigation, screen purpose, primary components, user actions, key states and acceptance criteria.

The first release should be useful for a pilot partner while retaining a configurable foundation for Education and later industries.

## 2. UX principles
- Make the next useful action obvious.
- Show why a company or opportunity is relevant.
- Display evidence, source and last-checked date beside important claims.
- Clearly distinguish verified information, provider data, AI inference and unknowns.
- Avoid overwhelming new users; progressive disclosure for advanced filters.
- Make paid actions and credit consumption visible before execution.
- Use consistent status, confidence and data freshness indicators.
- Require human review before outreach is sent.
- Design for desktop research workflows, with responsive mobile access for review and alerts.
- Do not use colour alone to communicate status.

## 3. Main information architecture
### Primary navigation
1. Overview
2. Discover
   - Companies
   - Contacts
   - Projects & Opportunities
   - Procurement & Tenders
3. Research
   - AI Research
   - Research History
4. CRM
   - Lead Lists
   - Pipeline
   - Tasks & Activities
5. Monitoring
   - Saved Searches
   - Alerts
6. Business Profile
   - Company Profile
   - Products & Services
   - Target Customers
   - Scoring Preferences
7. Workspace
   - Members & Roles
   - Integrations
   - Usage & Credits
   - Subscription & Billing
   - Settings
8. Help & Support

Platform administrators have a separate admin area, not mixed into customer navigation.

## 4. Global application shell
### Header
- Jeneconk BII logo/product name.
- Workspace switcher.
- Global search.
- Notifications.
- Help.
- User menu.

### Sidebar
- Collapsible navigation.
- Active page state.
- Workspace-level context.
- Industry-aware labels where configured.

### Global interaction patterns
- Search filters open in a side panel or expandable region.
- Results use table/list views with saved-view support.
- Detail pages use tabs: Overview, Contacts, Projects/Signals, Research, Activity, Sources.
- Long-running actions show job status and can be revisited.
- Empty states explain how to start and offer sample/demo data in the pilot environment.

## 5. Screen-by-screen specification

### Screen 01 — Sign up / Sign in
**Purpose:** Authenticate an individual user.  
**Components:** Email/password or supported auth methods, verification, password reset, terms/privacy links.  
**Actions:** Sign up, sign in, verify email, reset password.  
**States:** Loading, invalid credentials, unverified account, suspended account.  
**Acceptance:** Authenticated users proceed to workspace selection; unauthenticated users cannot access tenant data.

### Screen 02 — Workspace selection / creation
**Purpose:** Let a user choose or create a personal or company workspace.  
**Components:** Workspace cards, create personal workspace, create company workspace, accept invitation.  
**Actions:** Create, switch, join.  
**Rules:** A user may belong to multiple workspaces; every request must resolve and validate membership server-side.  
**Acceptance:** Workspace switch updates the application context and server authorisation checks.

### Screen 03 — Company workspace setup
**Purpose:** Create a company workspace and invite colleagues.  
**Fields:** Workspace/company name, website (optional initially), country, team size band (optional).  
**Actions:** Create workspace, invite by email, assign role.  
**Acceptance:** Owner membership is created atomically; invitation tokens are hashed and expire.

### Screen 04 — Onboarding checklist
**Purpose:** Guide first-time setup.  
**Checklist:** Complete Business Profile; choose industry; configure target geography; define customer types; review scoring; connect data provider (optional); invite team (optional).  
**UX:** Show progress without blocking exploration. Clearly identify optional steps.  
**Acceptance:** User can save progress and resume later.

### Screen 05 — Business Profile
**Purpose:** Capture what the customer sells and who they want to reach.  
**Sections:**
- Company identity and website.
- Products and services.
- Capabilities and specialisations.
- Certifications and experience.
- Target industries and regions.
- Preferred customer types.
- Ideal project/customer size.
- Exclusions and disqualifiers.
**Actions:** Save draft, validate, publish profile, preview matching logic.  
**Acceptance:** Profile can be edited; changes are versioned and do not silently rewrite historical lead scores.

### Screen 06 — Overview dashboard
**Purpose:** Provide an operational summary and clear next actions.  
**Widgets:**
- Companies discovered/saved.
- Qualified leads by score band.
- New opportunity signals.
- Research jobs in progress.
- Tasks due.
- Credits/usage this period.
- Recent activity.
**Actions:** Start discovery, resume research, review alerts, open pipeline.  
**Rules:** Metrics are tenant-scoped and respect permissions. Empty states guide the user to first discovery.  
**Acceptance:** Dashboard numbers reconcile to underlying tenant records and usage ledger.

### Screen 07 — Company discovery
**Purpose:** Find organisations matching the customer's offer and target market.  
**Search controls:** Keyword, industry/sub-industry, country/region/city, company type, size band, capabilities, activity signals, source, freshness.  
**Results columns:** Company, industry, location, website, fit indicator, available contacts, source/freshness.  
**Actions:** Open profile, save to list, add to CRM, research, enrich (metered), export (permission/credit controlled).  
**Acceptance:** Filters can be combined; no results disclose another tenant's private data; paid enrichment is not triggered merely by viewing a result.

### Screen 08 — Company detail
**Purpose:** Give a trustworthy, actionable company view.  
**Header:** Company name, website, location, industry tags, save/follow controls.  
**Tabs:**
- Overview: concise company summary and fit.
- Offer fit: matched services/capabilities and gaps.
- Contacts: known relevant contacts and source status.
- Projects/signals: linked projects and commercial signals.
- Research: AI research summary with evidence.
- Activity: tenant's notes, tasks and CRM history.
- Sources: source list, retrieval dates and data limitations.
**Actions:** Save, qualify, create lead, assign owner, add note, request research.  
**Acceptance:** Every material claim links to evidence/source details; tenant-only notes never appear in another workspace.

### Screen 09 — Contact discovery
**Purpose:** Find relevant professional contacts.  
**Filters:** Company, role/title category, seniority, geography, department, verification status, source.  
**Results:** Name, role, company, channel availability, verification/freshness indicators.  
**Actions:** Open contact, save, add to lead, verify channel (metered), draft outreach.  
**Rules:** Do not display or use contact channels beyond source licence and permitted purpose. Respect suppression.  
**Acceptance:** Unverified channels are clearly labelled; no fabricated contact data.

### Screen 10 — Contact detail
**Purpose:** Show contact identity, employment and permitted channels.  
**Sections:** Name/role, current and past employment (if sourced), work channels, verification history, evidence, tenant notes and activity.  
**Actions:** Save, associate with company/lead, verify, draft message.  
**Acceptance:** Channel provenance, verification date and permitted-use restrictions are visible to authorised users.

### Screen 11 — Projects & opportunities
**Purpose:** Discover projects and business signals relevant to the tenant.  
**Filters:** Industry, geography, project type, status, date range, company role, source, value band where evidenced.  
**Results:** Opportunity title, organisations, location, stage/status, date, fit score, source.  
**Actions:** Open detail, save to opportunities, research, create CRM lead, monitor.  
**Acceptance:** Inferred values/status are labelled; unknown values remain unknown.

### Screen 12 — Procurement & tenders
**Purpose:** Surface official and licensed procurement notices.  
**Filters:** Buyer, sector, location, category, deadline, notice status, eligibility.  
**Results:** Notice/reference, buyer, published date, deadline, status, source.  
**Actions:** Open original notice, save, assign, create task, monitor.  
**Acceptance:** Original source URL and deadline are prominent; stale/expired notices are clearly labelled.

### Screen 13 — AI Research workspace
**Purpose:** Run evidence-based research on a company, contact, project or market question.  
**Components:** Subject selector, research question, scope/source options, budget/credit estimate, run button, result panel.  
**Result structure:** Executive summary, findings, unknowns, evidence list, confidence, retrieval time, suggested next steps.  
**Actions:** Start research, cancel where possible, rerun, save to record, create task.  
**Acceptance:** Research is asynchronous; job status is visible; unsupported claims are not presented as verified facts.

### Screen 14 — Research history
**Purpose:** Find prior research jobs and results.  
**Filters:** Subject, user, job type, status, date.  
**Actions:** Open, compare, rerun, save findings.  
**Acceptance:** Results are tenant-scoped and model/prompt version metadata is retained.

### Screen 15 — Lead lists
**Purpose:** Organise discovered companies and contacts.  
**Components:** List cards/table, counts, owner, tags, last updated.  
**Actions:** Create list, rename, share within workspace, add/remove records, bulk assign.  
**Acceptance:** List membership and sharing follow tenant permissions.

### Screen 16 — CRM pipeline
**Purpose:** Manage leads through a configurable sales process.  
**Views:** Kanban by stage and table view.  
**Lead card:** Company/contact, owner, fit score, last activity, next task.  
**Actions:** Move stage, assign owner, add activity, create task, open detail.  
**Acceptance:** Stage changes are audited; pipeline data remains tenant-specific.

### Screen 17 — Lead detail / activity timeline
**Purpose:** Coordinate follow-up and record commercial history.  
**Sections:** Lead summary, associated company/contact/opportunity, score, owner, stage, tasks, notes, activity timeline, outreach drafts.  
**Actions:** Update stage, assign, add note, log call/meeting, create task, draft outreach.  
**Acceptance:** All updates are permission-checked and audited.

### Screen 18 — Outreach draft and approval
**Purpose:** Prepare relevant, evidence-grounded communications.  
**Components:** Recipient and channel, subject/body editor, evidence used, unknowns/warnings, suppression check, approval status.  
**Actions:** Generate draft, edit, request approval, approve, send through configured provider.  
**Rules:** No automatic sending in initial release. Sending requires explicit approval and valid integration.  
**Acceptance:** Approved content and send result are retained; suppression is checked immediately before sending.

### Screen 19 — Saved searches and alerts
**Purpose:** Monitor new companies, contacts, projects and tenders.  
**Components:** Search definition, frequency, alert channels, last run, next run, status.  
**Actions:** Save search, edit schedule, pause, run now, view matches.  
**Acceptance:** Scheduled runs respect provider budgets, tenant limits and time zone preferences.

### Screen 20 — Usage and credits
**Purpose:** Make variable costs transparent.  
**Components:** Current plan, included allowance, credit balance, usage by category, recent transactions, projected cost where available.  
**Actions:** Buy/top up credits, view invoice, set budget/alerts.  
**Acceptance:** Ledger is immutable and idempotent; user sees estimated credit cost before a metered action.

### Screen 21 — Subscription and billing
**Purpose:** Manage commercial plan.  
**Components:** Current plan, renewal date, payment method/provider, invoices, plan comparison.  
**Actions:** Upgrade, downgrade, cancel, update billing details.  
**Acceptance:** Billing provider webhooks are verified and idempotent; plan entitlements update reliably.

### Screen 22 — Members and roles
**Purpose:** Administer company workspace access.  
**Components:** Member table, role, invitation status, last active.  
**Actions:** Invite, resend, revoke invitation, change role, suspend/remove member.  
**Acceptance:** Only authorised owners/admins can manage access; changes are audited.

### Screen 23 — Integrations
**Purpose:** Configure approved external providers.  
**Components:** Provider cards, connection state, permitted scopes, usage status, last test.  
**Actions:** Connect, test, disconnect, rotate credentials.  
**Rules:** Secrets are stored in a secret manager or encrypted credential vault, never displayed again in full.  
**Acceptance:** Integration access is tenant-scoped and least-privilege.

### Screen 24 — Workspace settings
**Purpose:** Configure workspace preferences.  
**Sections:** Name, logo, timezone, default currency, data retention options where configurable, notification preferences.  
**Acceptance:** Settings are permission-checked and changes audited.

### Screen 25 — Platform administration
**Purpose:** Operate the SaaS safely.  
**Sections:** Tenant status, user support, provider health, job queue, usage anomalies, audit events, configuration, feature flags.  
**Rules:** Least privilege, just-in-time access where possible, reason capture and audit for support access.  
**Acceptance:** Platform administrators cannot casually browse customer content; sensitive access is controlled and logged.

## 6. Industry-specific configuration examples
### Oil & Gas / EPC
Suggested facets:
- Operator, EPC contractor, engineering consultant, oilfield service provider, supplier.
- Upstream, midstream, downstream, LNG, power/industrial projects.
- Project stage and procurement category.
- Technical service/capability.
- NipeX/official procurement source status where permitted.

### Education
Suggested facets:
- School, university, vocational centre, training provider, edtech, education supplier.
- Public/private, institution type, geography, student/learner size band where reliable.
- Accreditation/affiliation signals where sourced.
- Procurement, partnership, training and curriculum opportunities.

### Jeneconk internal use
Business Profile can include digital educational resources, teacher training materials, lesson-note resources and other products/services. Discovery should match these offerings to relevant institutions, educators, training organisations, resellers or other suitable buyers. This is an example configuration, not a hard-coded special case.

## 7. Core UI components
- `WorkspaceSwitcher`
- `GlobalSearch`
- `IndustryFilter`
- `AdvancedFilterPanel`
- `CompanyResultRow`
- `ContactResultRow`
- `OpportunityCard`
- `EvidencePanel`
- `SourceBadge`
- `FreshnessIndicator`
- `ConfidenceIndicator`
- `FitScoreBreakdown`
- `CreditCostConfirmation`
- `ResearchJobStatus`
- `ActivityTimeline`
- `LeadStageSelect`
- `ApprovalPanel`
- `EmptyState`
- `PermissionGate`

Components should receive data from typed API responses. They must not independently infer permissions or calculate authoritative billing balances.

## 8. Key states and error handling
Every data-heavy screen must support:
- Initial loading.
- Empty result.
- No search matches.
- Partial provider failure.
- Rate limit or quota reached.
- Stale data.
- Permission denied.
- Network/server error.
- Background job pending/running/failed/completed.
- Provider disconnected.
- Credit insufficient.

Errors should explain what happened and a safe next step. Never display raw provider secrets or stack traces.

## 9. Accessibility and responsive behaviour
- Keyboard-operable navigation and controls.
- Visible focus states.
- Form labels and helpful validation.
- Adequate contrast and text resizing.
- Status labels include text, not colour only.
- Tables collapse to useful cards on narrow screens.
- Research and CRM workflows remain usable on tablets.
- Critical actions require clear confirmation.

## 10. MVP release boundary
### Must-have for pilot
- Authentication and workspace switching.
- Personal and company workspaces.
- Membership and roles.
- Industry selection and Business Profile.
- Company discovery using seed data and one approved provider adapter.
- Company detail with evidence/source panel.
- Research jobs and basic AI summary.
- Configurable lead scoring.
- Save to lead list/CRM.
- Basic pipeline, tasks and notes.
- Usage metering for paid provider/AI operations.
- Admin visibility into jobs, usage and provider health.

### Later releases
- Full contact enrichment and verification.
- Rich project intelligence and procurement integrations.
- Scheduled monitoring and alerts.
- Customer-managed multiple integrations.
- Advanced reporting and exports.
- Outreach sending and sequence management.
- More industries and country-specific data connectors.

## 11. Screen acceptance checklist
- Every screen is tenant-aware and permission-checked.
- Important factual claims show source and retrieval date.
- AI-generated content is labelled and evidence-linked.
- Metered actions show expected credit cost.
- Empty, loading, error and partial-failure states exist.
- All destructive and external actions are confirmed.
- User can understand why a lead received its score.
- Industry labels and filters are configuration-driven.
- No customer can see another customer's private notes, contacts, integrations, lists or pipeline.

## 12. Recommended next implementation artefacts
After this blueprint, create:
1. API specification with endpoint contracts and permission matrix.
2. Prioritised engineering backlog with acceptance criteria.
3. Wireframes for the MVP screens.
4. Initial Alembic migration plan and executable schema.
5. Pilot test plan with the EPC design partner and Education test cases.
