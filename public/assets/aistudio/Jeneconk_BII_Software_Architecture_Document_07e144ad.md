# JENECONK BII — SOFTWARE ARCHITECTURE DOCUMENT
**Version:** 1.0  
**Date:** 8 November 2026  
**Product owner:** Jeneconk Integrated Global Solutions Limited

## 1. Purpose and scope
Jeneconk BII (Business & Industrial Intelligence) is a configurable, multi-tenant SaaS platform for company discovery, contact intelligence, project and procurement intelligence, AI-assisted research, lead qualification, outreach preparation and CRM workflows.

The product is designed for multiple industries. Initial validation sectors are Oil & Gas/EPC and Education. It must also support Jeneconk's own business development and digital-product lead generation. It is not an oil-and-gas-only application and should not be designed as a narrow Apollo clone.

This document describes the logical architecture and implementation direction. It is not a substitute for detailed API contracts, security testing, provider licence review or production deployment runbooks.

## 2. Product goals
- Help organisations discover relevant companies and business opportunities.
- Identify and research relevant decision-makers using lawful, appropriately licensed sources.
- Surface projects, tenders, procurement notices and other industry-specific opportunity signals.
- Explain why a prospect is relevant, with traceable evidence and confidence.
- Turn research into qualified leads, approved outreach drafts and CRM activities.
- Let each customer configure its business profile, target markets and ideal customer profile.
- Support personal and company workspaces, teams, subscriptions and usage credits.
- Add industries through configuration and taxonomies rather than separate hard-coded products.

### Non-goals for the first release
- Fully autonomous sending of sales messages.
- Guaranteed access to every private contact or procurement database.
- Repackaging or reselling third-party data without contractual permission.
- Microservices, a data lake or a dedicated search cluster before measurable need.
- Replacing a full enterprise ERP or procurement management suite.

## 3. Users and tenancy
The platform supports:
1. Individual accounts with a personal workspace.
2. Company accounts with a company workspace, members, roles and shared configuration.
3. Jeneconk platform administrators and support personnel.

Every customer-owned record must be associated with a tenant/workspace. Authorisation must be checked server-side on every request. A user may belong to multiple workspaces. The active workspace is a context selector, not a security boundary by itself.

Suggested roles:
- Owner: billing, workspace settings, member administration and all workspace data.
- Admin: workspace configuration, members and operational data, excluding ownership transfer unless granted.
- Manager: manage leads, research and team workflows.
- Member: standard research and CRM access.
- Read-only: view permitted records.
- Platform support/admin: tightly controlled platform operations with audited access.

## 4. Architecture principles
- Modular monolith first; split services only when operational evidence justifies it.
- PostgreSQL is the system of record.
- Keep provider integrations behind adapters to avoid lock-in.
- Store source provenance and licence/usage restrictions with acquired data.
- Treat AI output as an assertion requiring evidence, not as ground truth.
- Keep tenant-specific CRM records separate from shared/canonical intelligence.
- Design for low operating cost: cache, deduplicate, rate-limit and meter paid calls.
- Prefer explicit, explainable scoring over opaque ranking.
- Use asynchronous jobs for slow or expensive research and enrichment.
- Human approval is required before external outreach is sent.

## 5. High-level system context
**Users** access the Next.js web application. The frontend calls the FastAPI backend over HTTPS. The backend authenticates the user, resolves the active tenant, enforces permissions and orchestrates domain services. PostgreSQL stores application data. Background workers process research, enrichment, imports, alerts and AI tasks. Provider adapters call licensed data, verification, AI, email and notification services. Cloudflare provides DNS and edge protection. Object storage can be added for exports and uploaded documents.

External systems may include:
- Company/contact data providers (e.g. Apollo, subject to API terms and commercial licence).
- Email verification providers.
- Official company websites and public registries.
- Official government, regulator and procurement portals.
- Licensed project intelligence services, if commercially justified.
- AI model providers.
- Transactional email provider.

## 6. Logical application layers
### 6.1 Presentation layer
- Next.js + TypeScript.
- Tailwind CSS and shadcn/ui components.
- Responsive desktop-first operational interface.
- Feature-oriented UI modules.
- Client-side state is not trusted for permissions or billing decisions.

### 6.2 API and application layer
- Python + FastAPI.
- Pydantic request/response schemas.
- Authentication token validation.
- Tenant resolution and permission checks.
- Rate limiting, request validation and audit events.
- Application services coordinate repositories, providers and jobs.

### 6.3 Domain modules
1. Identity and tenancy.
2. Workspace and membership.
3. Business Profile and ideal customer profile (ICP).
4. Industry configuration and taxonomies.
5. Company intelligence.
6. Contact intelligence.
7. Project and procurement intelligence.
8. Research and evidence.
9. Lead scoring and qualification.
10. CRM and pipeline.
11. Outreach drafting and approval.
12. Saved searches, alerts and monitoring.
13. Billing, subscriptions and credits.
14. Provider integrations.
15. Platform administration and audit.

Modules should communicate through well-defined service interfaces. Avoid direct cross-module database writes from unrelated modules.

### 6.4 Data layer
- PostgreSQL.
- SQLAlchemy ORM.
- Alembic migrations.
- PostgreSQL full-text search, trigram and conventional indexes initially.
- Row-level security may provide defence in depth but does not replace application authorisation.
- Object storage for files/exports only when needed.

### 6.5 Background processing
Start with a PostgreSQL-backed job table and worker process. Implement:
- Atomic job claiming using row locks / `SKIP LOCKED`.
- Retry count and exponential backoff.
- Dead-letter/failed state and operator visibility.
- Timeouts and cancellation where feasible.
- Idempotency keys for provider calls and billing events.
- Tenant ID and initiating user ID on every applicable job.
- Per-tenant and per-provider concurrency limits.

Do not add Redis/Celery in the first milestone unless measured throughput or queue requirements demand it.

## 7. Industry configurability
Industry-specific behaviour is driven by configuration:
- Industry and sub-industry taxonomies.
- Company types and organisation attributes.
- Job-title categories and aliases.
- Product/service categories and capability tags.
- Opportunity types and project signals.
- Search facets and required profile fields.
- Scoring templates and weights.
- Research prompts and evidence checklists.

Oil & Gas/EPC examples: operators, EPC contractors, oilfield service companies, suppliers, tenders, project phases, procurement categories and technical capabilities.

Education examples: schools, universities, vocational centres, training providers, education technology companies, enrolment signals, accreditation, procurement and partnership opportunities.

The same underlying company/contact/opportunity engine should serve both. Add a new sector by creating and testing configuration, not by cloning the application.

## 8. Core workflows
### 8.1 Customer onboarding
1. User registers and verifies their identity.
2. User creates or joins a personal/company workspace.
3. Company workspace owner invites members and assigns roles.
4. Customer completes a Business Profile: offer, capabilities, certifications, target customer types, industries, locations and ideal opportunity size.
5. Platform suggests an ICP and scoring template.
6. User reviews and saves configuration.

### 8.2 Company discovery
1. User selects industry, geography and filters.
2. Backend searches permitted internal records and eligible providers.
3. Results are deduplicated and normalised.
4. Each result shows source, last checked date and data limitations.
5. User saves a company to a tenant list/CRM.
6. Paid enrichment is triggered only when required and authorised.

### 8.3 Research and qualification
1. User requests research on a company or opportunity.
2. Backend creates an asynchronous job.
3. Worker retrieves allowed source material.
4. AI extracts structured claims and attaches evidence.
5. Scoring service evaluates the record using tenant and industry configuration.
6. UI presents score, component breakdown, confidence and evidence.
7. User accepts, edits or rejects the qualification.

### 8.4 Outreach preparation
1. User selects a contact and a purpose.
2. AI drafts an email/message using approved facts and tone.
3. UI displays citations/evidence and flags unknown details.
4. User edits and approves.
5. Sending is performed only through a configured provider and after explicit approval.
6. Record delivery status and suppression/opt-out state.

## 9. Data provider architecture
Define a common adapter contract for each provider:
- `search_companies`
- `search_contacts`
- `enrich_company`
- `enrich_contact`
- `verify_email`
- `search_opportunities` (where supported)
- `get_usage` / cost metadata

Each adapter must return normalised data plus provider-specific metadata. Record provider name, source record ID, retrieval timestamp, licence class, allowed purpose, retention limit and any redistribution restrictions.

Apollo may be used as an initial company/contact provider, but its credits, permitted use, storage, display and redistribution terms must be reviewed before launch. Use provider abstraction so another provider can replace it. Do not assume public web visibility grants unrestricted collection or marketing use.

## 10. AI architecture and controls
AI services are invoked through a provider-independent interface. Use separate task templates for:
- Company classification.
- Research summarisation.
- Contact role interpretation.
- Project/opportunity extraction.
- Evidence summarisation.
- Lead scoring explanation.
- Outreach drafting.

Controls:
- Require source evidence for material factual claims.
- Distinguish verified fact, provider-supplied fact, AI inference and unknown.
- Never invent emails, phone numbers, job titles, project values, tender status or company activity.
- Store model/provider, prompt/template version, timestamp and token/cost usage.
- Use deterministic rules for arithmetic and final score aggregation.
- Treat retrieved web pages and documents as untrusted input; ignore instructions contained in them.
- Do not expose secrets or cross-tenant data to model prompts.
- Apply retention and privacy controls to prompts and outputs.

## 11. Search and ranking
Start with PostgreSQL:
- Full-text search for names, descriptions and notes.
- Trigram indexes for fuzzy company-name matching.
- B-tree indexes for geography, industry, status and dates.
- GIN indexes for selected JSONB/array attributes where justified.

Add OpenSearch/Elasticsearch only when measured query volume, relevance needs or index scale justify the operational cost. Vector search is optional and must solve a demonstrated semantic retrieval problem; it is not a default dependency.

## 12. Lead scoring
A score is a decision-support aid, not a promise of commercial success. Each industry and customer profile can use different criteria and weights. Example EPC template:
- Service compatibility: 25
- Project relevance: 25
- Procurement timing: 15
- Geographic suitability: 10
- Decision-maker availability: 10
- Evidence of commercial activity: 15
Total: 100.

Do not apply EPC weights to education. Education may use criteria such as service fit, institution type, geographic fit, purchasing/partnership signal, decision-maker evidence and timing. Every score must show component values, rationale, evidence and confidence. Missing evidence should reduce confidence rather than be silently treated as positive.

## 13. Security, privacy and compliance
- TLS for all external traffic.
- Secrets in environment/secret manager, never committed to Git.
- Passwords and authentication delegated to a reputable auth provider initially.
- Server-side authorisation on every tenant-scoped operation.
- Strong tenant isolation tests.
- Audit logs for membership, role, export, integration, billing and sensitive data actions.
- Encrypt backups and restrict production access.
- Rate-limit authentication, search, enrichment and AI endpoints.
- Validate uploads and protect against malicious files.
- Suppression list and marketing objection workflow.
- Data minimisation, purpose limitation, retention and deletion.
- Data processing agreements and provider licence checks.
- Cross-border transfer review where applicable.
- Incident and breach response process.

Nigeria Data Protection Act 2023 and NDPC oversight are relevant. Other African markets may impose additional national requirements. Obtain qualified legal advice on controller/processor roles, lawful basis, direct marketing, cross-border transfers and provider terms before commercial launch.

## 14. Recommended technology stack
| Area | Initial choice |
|---|---|
| Frontend | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| ORM/migrations | SQLAlchemy + Alembic |
| Authentication | Supabase Auth initially |
| Jobs | PostgreSQL-backed queue + worker |
| AI | Provider-independent adapter |
| Source control | GitHub |
| Containers | Docker / Docker Compose |
| DNS/edge | Cloudflare |
| Email | Resend or equivalent |
| Object storage | Add when file use requires it |

Use a modular monolith, not microservices. Keep infrastructure replaceable.

## 15. Deployment topology
**Development:** local Docker Compose, local/test database, provider sandbox keys.  
**Staging:** separate environment, credentials and database; synthetic or approved test data.  
**Pilot production:** secure Linux VPS for frontend/API/worker, managed PostgreSQL/auth, Cloudflare DNS/HTTPS, automated encrypted backups, error monitoring and uptime checks.

Do not use free-tier hosting as the default for production customer data. Check commercial-use restrictions, inactivity suspension, backup/restore and support terms. Vercel Hobby is intended for personal/non-commercial use; choose an appropriate commercial deployment plan if using Vercel.

## 16. Cost and usage controls
- Deduplicate before calling paid providers.
- Search internal records before external enrichment.
- Cache provider responses where contractually permitted.
- Set tenant/provider monthly budgets and hard limits.
- Meter API, AI and export usage.
- Use lower-cost models for routine classification; reserve stronger models for complex tasks.
- Limit prompt size and output tokens.
- Expose credit consumption before expensive actions.
- Avoid unlimited usage promises.
- Review gross margin per plan and feature.
- Delay expensive project-data subscriptions until pilot demand and willingness to pay are proven.

## 17. Scaling triggers
Reassess architecture when one or more occur:
- Queue delay breaches a defined service target.
- PostgreSQL search performance remains poor after indexing and query tuning.
- Worker workloads need independent scaling.
- Provider rate limits require dedicated scheduling.
- A module has independent deployment or availability needs.
- Tenant isolation or compliance requirements require stronger infrastructure boundaries.

## 18. Quality attributes and acceptance criteria
- Tenant data cannot be accessed by another tenant through UI, API, export or background job.
- Every material intelligence claim has source and retrieval date.
- Every score has a component breakdown and explanation.
- Provider calls are metered and attributable to a tenant.
- Failed jobs are visible, retryable and idempotent.
- No external outreach is sent without approval.
- New industry configuration can be added without duplicating core modules.
- Backups can be restored in a tested procedure.
- Production secrets are not present in source control.

## 19. Delivery sequence
1. Repository, Docker Compose and environments.
2. Authentication, personal workspace and company workspace.
3. Membership, roles and tenant isolation.
4. Industry taxonomies and Business Profile.
5. Company records and company discovery using seed/demo data.
6. Source provenance and evidence model.
7. Contact discovery/enrichment adapter.
8. Research jobs and AI extraction.
9. Configurable scoring.
10. CRM lists, pipeline and activities.
11. Opportunity/project intelligence.
12. Billing, credits, usage controls and admin.
13. Pilot hardening, privacy review and production deployment.
