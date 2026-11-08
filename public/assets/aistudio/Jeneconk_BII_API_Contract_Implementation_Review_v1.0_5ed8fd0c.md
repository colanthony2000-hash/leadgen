# JENECONK BII — API CONTRACT IMPLEMENTATION REVIEW

**Review version:** 1.0  
**Review date:** 8 November 2026  
**Documents reviewed:** SAD v1.1; DDD v1.1; UI/UX Application Blueprint v1.1; API Specification v1.0  
**Purpose:** Determine whether the current documentation is sufficiently consistent and precise to be translated into FastAPI/Pydantic schemas and tested as an implementation-ready API contract.

---

## 1. Executive verdict

**Decision: NOT YET IMPLEMENTATION-READY.**

The four documents establish a credible product and architecture direction. They correctly favour a modular monolith, PostgreSQL, FastAPI, Pydantic, SQLAlchemy, Alembic, controlled provider adapters, evidence-backed AI, tenant isolation and usage-based metering.

The API Specification is a useful endpoint catalogue and policy blueprint. It is not yet a complete executable contract. In particular, it does not define all request/response models, every permission code, all resource state transitions, the complete credit operation lifecycle, or the exact relationship between API workspace identifiers and database tenant identifiers.

This review is a documentation-level contract audit. It does **not** claim that code exists, that runtime tests have been run, or that provider/legal arrangements have been validated. No implementation source code was supplied for code review.

### Overall assessment

| Area | Assessment | Finding |
|---|---|---|
| Product/architecture direction | Strong | Clear modular-monolith and industry-configurable direction |
| Domain/database alignment | Partial | Good entity coverage; naming and some endpoint coverage need closure |
| API endpoint coverage | Partial | Broad catalogue, but missing operations and detailed contracts |
| Request/response schemas | Insufficient | Most endpoints lack field-level schemas |
| Authorisation contract | Insufficient | Permission names are incomplete and not fully mapped to roles |
| Metering/idempotency | Partial | Principles are strong; API-level lifecycle is incomplete |
| Async jobs | Partial | Generic job rules exist, but resource-specific and generic status/cancel contracts need tightening |
| UI/API alignment | Partial | Core pilot journeys mostly represented; several screens and later releases are not mapped cleanly |
| Privacy/data governance | Partial | DDD/SAD are stronger than the API routes and scope model |
| Testability | Insufficient | Acceptance principles exist, but no endpoint-level test matrix or test fixtures are defined |

**Conclusion:** Proceed with a short contract-closure stage before implementing feature endpoints. Do not restart the architecture or redesign the product from scratch.

---

## 2. Review method and decision labels

Each document was checked against the other three for:
1. Terminology and identifier consistency.
2. Domain entities and endpoint coverage.
3. UI actions and user journeys against API operations.
4. Request/response fields, validation and error handling.
5. Authentication, authorisation and tenant boundaries.
6. Metering, asynchronous processing and idempotency.
7. Evidence, provenance, privacy and provider restrictions.
8. MVP/release boundaries.
9. Whether requirements can be translated into automated tests.

Severity labels:
- **P0 — Blocking:** resolve before writing the affected API module.
- **P1 — High:** resolve before the affected module is accepted as complete; some foundation work may proceed.
- **P2 — Medium:** resolve before the corresponding feature/release.
- **P3 — Clarification:** document a convention or decision; low implementation risk if isolated.

---

## 3. Critical cross-document findings

### Finding 1 — `workspace_id` versus `tenant_id` is not formally reconciled
**Severity: P0**

The API consistently addresses customer scope through `/workspaces/{workspace_id}/...`. The DDD uses `tenants`, `tenant_id`, memberships and tenant-owned records. The SAD discusses both workspaces and tenancy. The product also supports personal and company workspaces.

A developer cannot safely infer whether:
- a workspace is exactly a tenant;
- a tenant can own multiple workspaces;
- a personal workspace is a tenant of its own;
- a company workspace is a tenant of its own; or
- workspace is a user-facing concept mapped to a separate tenant security boundary.

**Required decision:** Adopt one explicit canonical model. Recommended for the current product: one workspace maps to one tenant/security boundary in Release 1. Use `workspace_id` at the API boundary if that is the product language, but document that it maps one-to-one to `tenants.id` (or rename the database entity consistently before migrations). Never accept a client-provided `tenant_id` as authority.

**Required artefacts:** terminology glossary, identity/tenancy ERD, mapping rule, Pydantic `WorkspaceContext`, and tenant-isolation tests.

### Finding 2 — Permission catalogue is incomplete
**Severity: P0**

The API lists initial roles and a sample set of permission codes, but endpoint tables reference many codes not defined in the initial list. Examples include:
`members.read`, `companies.read`, `companies.enrich`, `contacts.search`, `contacts.save`, `contacts.verify`, `opportunities.search`, `opportunities.manage`, `research.read`, `leads.score`, `leads.read`, `outreach.approve`, `outreach.send`, `monitoring.manage`, `notifications.read`, `exports.read`, `data.request`, and platform-admin permissions.

The documents do not provide a definitive role-to-permission matrix.

**Required decision:** Create a permission registry with a unique code, description, resource/action, scope, default role grants and whether it is platform-only. Define role grants separately from permission checks. Add explicit policies for owner protection, last-owner removal, self-demotion, invitation authority and billing access.

**Required artefacts:** permission registry, seeded role matrix, authorization dependency design, endpoint permission matrix, and positive/negative access tests.

### Finding 3 — API schemas are not sufficiently specified
**Severity: P0**

The API specification contains detailed examples for company search and research-job creation, plus generic response/error examples. Most endpoint operations do not define:
- exact request body fields;
- field types and nullability;
- length/range constraints;
- allowed enum values;
- nested structures;
- default behaviour;
- response fields;
- update semantics;
- field-level visibility rules;
- validation rules across fields.

A route catalogue is not enough to create reliable Pydantic models.

**Required decision:** Every endpoint must have a request schema (where applicable), response schema, status codes, error codes, permission, side effects, idempotency behaviour and ownership rule. Use separate create, update, read and list DTOs; do not reuse ORM models as API schemas.

**Required artefacts:** endpoint contract register and Pydantic schema catalogue.

### Finding 4 — Credit operations are not fully represented at the API layer
**Severity: P0**

The SAD and DDD define reservations, capture, release, idempotency and an immutable ledger. The API says research creation reserves credits and the billing area exposes reservation history. However, other explicitly metered operations include company enrichment and contact verification. The API does not define one complete reusable metering contract for all such operations.

There is also a mismatch between the general API convention (idempotency for charge-affecting actions) and the research example, which places `idempotency_key` inside the JSON body. The convention does not define a single authoritative transport location or scope.

**Required decision:** Define one common metered-operation lifecycle and use it for research, enrichment, verification, and later paid operations. Specify:
1. estimate;
2. entitlement and balance check;
3. reservation;
4. dispatch;
5. provider/AI usage recording;
6. capture actual amount;
7. release or partial capture on failure/cancellation;
8. reconciliation and reversal;
9. expiry and recovery of stale reservations.

Use an `Idempotency-Key` header consistently (recommended), with a documented tenant + operation scope and payload fingerprint. The body should not be a competing source of truth.

**Required artefacts:** metering state machine, operation pricing catalogue, API schemas, database transaction rules, and concurrency/replay tests.

### Finding 5 — Release boundaries are not consistently reflected in the API
**Severity: P1**

The UI blueprint places contact enrichment/verification, projects/procurement, saved monitoring, advanced exports and outreach sending in later releases. The API catalogue already lists many of these endpoints without a clear release tag or disabled-state behaviour.

This can cause the backend team to build beyond the pilot, increasing cost and delaying validation.

**Required decision:** Add a release/feature-status column to every endpoint: `R1_PILOT`, `R2_INTELLIGENCE`, `R3_COMMERCIAL`, or `PLATFORM_INTERNAL`. Mark future endpoints as planned and do not implement them in the pilot unless an explicit scope change is approved.

**Recommended Release 1 API boundary:** authentication/workspaces/memberships; industry configuration; Business Profile/ICP; seed-data company discovery and one licensed/approved company provider; company details/evidence; research jobs; scoring; lead lists/basic CRM; tasks/notes/activity; usage/credit visibility; admin job/provider/usage health; privacy/security foundations.

### Finding 6 — API response envelope is inconsistent across examples and async operations
**Severity: P1**

The standard success envelope uses `data` and `meta`. The research job example returns `data` but omits `meta`. Error responses use a separate `error` root. The API does not define whether all endpoints must use the envelope, how paginated responses fit, or how FastAPI's default validation error is converted to the standard error model.

**Required decision:** Define canonical Pydantic `ApiResponse[T]`, `PaginatedResponse[T]`, `ApiErrorResponse` and `JobAcceptedResponse` patterns. Define exact HTTP statuses and whether `meta` is mandatory. Add a global exception handler that normalises validation and application exceptions without leaking internals.

### Finding 7 — Generic asynchronous job contract is incomplete
**Severity: P1**

The API defines job states and says long-running operations return `202 Accepted`, but it does not define:
- a universal job resource endpoint;
- job result representation;
- progress fields;
- safe failure details;
- cancellation response;
- retry policy visible to users;
- expiry and retention behaviour;
- whether research-job endpoints are a specialised view over `background_jobs`.

The UI blueprint requires research history, progress, partial results and admin visibility.

**Required decision:** Define a generic job resource contract, with research-specific result endpoints where needed. Clarify whether `research_jobs` and `background_jobs` are separate domain and execution records or one linked model.

### Finding 8 — Source-scope enum values are inconsistent
**Severity: P1**

The API examples use `eligible_internal`, `approved_provider` and `approved_sources`. These appear to describe related but non-identical source classes. The SAD/DDD also distinguish `SHARED_PERMITTED`, `TENANT_RESTRICTED`, `PROVIDER_RESTRICTED`, `PRIVATE_USER` and `PUBLIC_REFERENCE`.

**Required decision:** Separate:
- source selector values (which connectors/categories may be queried);
- data visibility classes (who may see/use a returned field);
- permitted purposes (why a field may be used);
- export/redistribution rights.

Do not use one enum for all four concepts. Define central enums and their allowed transitions.

### Finding 9 — Privacy request API is narrower than the DDD privacy model
**Severity: P1**

The DDD permits privacy requests with nullable tenant context and includes access, correction, deletion and objection. The API only exposes workspace-scoped privacy request routes. A data subject request may concern a person, user or contact record beyond one active workspace. The API also does not specify platform-level intake, identity verification, processor propagation or exceptions.

**Required decision:** Define user-level/platform privacy intake in addition to tenant workspace requests. Distinguish a customer's request about their own workspace data from a data-subject request about personal data. Keep internal review/fulfilment operations platform-only and audited.

### Finding 10 — API does not expose all relevant DDD concepts
**Severity: P1/P2**

DDD v1.1 adds or describes `contracts_awards`, `project_status_history`, `opportunity_links`, `entity_source_links`, `sourced_field_values`, `provider_request_logs`, `export_jobs`, `privacy_requests`, `deletion_jobs`, `notification_preferences` and `outbox_events`.

Not every table needs a public endpoint. Some are internal persistence/worker structures. However, the contract must classify each as:
- externally accessible resource;
- internal service/worker data;
- read-only admin resource;
- derived data with no direct endpoint.

Specific gaps include no explicit contract-award search/detail route, no notification-preference route, no export download-token or download route, and no explicit user-facing status model for privacy/deletion jobs.

**Required decision:** Add an entity-to-API exposure matrix. Do not mechanically expose every database table.

---

## 4. UI-to-API coverage review

| UI screen / journey | API coverage | Review result |
|---|---|---|
| Sign up/sign in | Supabase Auth assumed; `/me` exists | Clarify lifecycle, identity mapping and verification; auth provider owns login routes |
| Workspace selection/creation | `/workspaces`, create and detail | Mostly covered; clarify personal/company type and workspace=tenant mapping |
| Company workspace setup | Workspace and invitation endpoints | Partial; define onboarding status and owner rules |
| Onboarding checklist | No dedicated endpoint | Add checklist state or derive it explicitly from profile/configuration completion |
| Business Profile | GET/PUT and versions | Partial; detailed nested schema for offerings, certifications, capabilities, coverage and ICP needed |
| Dashboard | No dashboard/summary endpoint | Add a dashboard aggregation endpoint or define client-side composition from existing endpoints |
| Company discovery | Search/detail/save/enrich/evidence | Good conceptual coverage; schemas, facets, partial-result model and R1 scope need definition |
| Company detail | Company GET and evidence | Partial; define sections, source field visibility and relationships |
| Contact discovery/detail | Search/detail/save/verify/evidence | R2 per UI; schemas and channel-level permissions incomplete |
| Projects/opportunities | Search/detail/save/list/update | Partial; contract awards and project-event details need exposure decision; R2 |
| Procurement/tenders | Search/detail | R2; no source freshness/status/deadline schema |
| AI Research | Estimate/create/status/results | Good direction; missing exact result DTO, progress and generic job linkage |
| Research history | List/get jobs | Mostly covered; filters, pagination and retry/cancel semantics incomplete |
| Lead lists | List/create/detail | Missing explicit add/remove/reorder company or lead membership operations unless embedded in CRM lead creation |
| CRM pipeline | Leads, stage patch, tasks, notes, activity create | Partial; pipeline-stage configuration/list, activity listing, task listing, assignment and transition rules missing |
| Lead detail/timeline | Lead detail and activity create | Missing complete timeline/read contract |
| Outreach | Draft/edit/approve/send | R3; sending must be feature-gated; suppression and lawful-purpose enforcement are essential |
| Saved searches/alerts | CRUD and notifications | R2; schedule, timezone, delivery channel and preferences incomplete |
| Usage/credits | Summary, usage, transactions, reservations | Partial; operation pricing/estimate and reservation lifecycle incomplete |
| Subscription/billing | Summary and checkout | Partial; subscription lifecycle, invoices, payment status, cancellation and webhook events need definition; R3 |
| Members/roles | Members/invitations/update/remove | Partial; complete permission matrix and invitation lifecycle required |
| Integrations | Connect/test/disconnect | R2/R3 depending provider; OAuth callback/state, secret references and ownership need definition |
| Workspace settings | Workspace PATCH | Partial; notification preferences, timezone, defaults and security settings need decision |
| Platform administration | Provider health, jobs, usage, tenants | Partial; admin permission model and safe operational actions not specified |

### Dashboard decision
The UI describes actionable dashboard sections: high-fit companies, new opportunities, research awaiting review, leads without next action, tasks due/overdue, changed source-backed facts, and credits. There is no explicit dashboard endpoint.

For a first pilot, this can be a backend aggregation endpoint such as `GET /workspaces/{workspace_id}/dashboard/summary`, or the frontend can compose a small number of stable endpoints. Choose one approach and document caching/permission behaviour. Avoid a large, expensive dashboard query on every page load.

---

## 5. Database-to-API alignment findings

### 5.1 Strong alignment
The following DDD concepts are represented reasonably well by the API catalogue:
- users, tenants/workspaces, memberships and invitations;
- industry taxonomies;
- Business Profiles, ICPs and scoring configuration;
- companies, contacts and tenant-specific saved records;
- projects, procurement notices and tenant opportunities;
- research jobs/results and lead scores;
- CRM leads, lists, tasks, notes and activities;
- subscriptions, plans, credits and transactions;
- integrations, notifications, saved searches and audit;
- privacy and export operations.

### 5.2 Required clarifications
1. **Workspace/tenant mapping:** blocking; see Finding 1.
2. **Business Profile versioning:** API says PUT current profile creates an immutable version, but request semantics, version concurrency and conflict response are undefined. Add `If-Match`/version precondition or explicit expected version to prevent lost updates.
3. **Scoring configuration:** API uses `{config_id}` while DDD has `tenant_scoring_configs`, `scoring_templates` and version history. Define whether the tenant config is a mutable pointer to an immutable version or a versioned record itself.
4. **Evidence links:** DDD recommends entity-specific junction tables. API must return stable evidence IDs and define whether evidence can be retrieved independently or only through parent resources.
5. **Contracts/awards:** DDD defines a distinct `contracts_awards` entity, but API has no explicit endpoint. Decide whether it is hidden internal evidence, part of project detail, or a searchable resource.
6. **Opportunity links:** define allowed linked entity types and validate links server-side. Do not accept arbitrary polymorphic IDs without existence and tenant/source policy checks.
7. **Contact channels:** Pydantic response models must never serialise encrypted values, matching hashes, provider secrets or restricted channels. Create separate public-safe contact DTOs and privileged internal models.
8. **Provider request logs:** internal/admin only; redact request payloads and secrets.
9. **Outbox/background jobs:** internal worker infrastructure, not tenant-editable resources. Expose safe job status only.
10. **Export jobs:** user-facing export status and secure download flow are needed if exports are in scope.
11. **Notification preferences:** DDD includes them, but API does not expose them. Add before scheduled alerts become user-configurable.
12. **Deletion propagation:** deletion jobs must cover canonical/shared data, tenant copies, derived claims, search indexes, caches, exports and downstream processors where required. The API must expose status without disclosing other tenants' data.

---

## 6. FastAPI/Pydantic contract rules to standardise

Before implementing feature endpoints, approve these conventions.

### 6.1 Schema families
For each resource, define separate models:
- `ResourceCreate`
- `ResourceUpdate` (PATCH semantics explicitly defined)
- `ResourceRead`
- `ResourceListItem`
- `ResourceFilter` / `ResourceSearchRequest`
- `ResourceSearchResult`
- `ResourceVersionRead` where versioned.

Do not return SQLAlchemy ORM objects directly. Use explicit response DTOs and allow-list fields. Pydantic `from_attributes` may be used internally, but it is not a permission system.

### 6.2 Validation
Every field must define:
- type and format;
- required/optional/null behaviour;
- length/range constraints;
- enum values;
- default;
- normalisation rules;
- cross-field constraints;
- ownership and visibility constraints.

Use Pydantic v2 validators for structure and FastAPI dependencies/services for database-dependent checks. Do not put tenant permission decisions only in Pydantic validators.

### 6.3 PATCH semantics
Decide whether omitted means “leave unchanged” and explicit `null` means “clear”. Apply this consistently. Use `model_fields_set` or equivalent to distinguish omission from null. Do not make every field optional without documenting clearability.

### 6.4 Responses and errors
Define reusable response models:
- `ApiMeta`
- `ApiResponse[T]`
- `PaginatedResponse[T]`
- `ApiError`
- `ApiErrorResponse`
- `JobAcceptedResponse`
- `PartialResultWarning`

Define one stable error-code registry and map each code to HTTP status, safe message and optional typed details. Normalise FastAPI 422 errors into the API error contract. Never return exception text, SQL, stack traces, provider secrets or restricted field values.

### 6.5 Pagination and filtering
Specify cursor encoding, stable ordering, tie-breaker, filter validation, maximum page size and cursor invalidation. Sort fields must be allowlisted. Define whether total counts are returned; avoid expensive counts by default.

### 6.6 Idempotency
Use one standard `Idempotency-Key` header for all side-effecting or charge-affecting requests. Define:
- maximum key length and format;
- scope (recommended: workspace + operation + key);
- request payload fingerprint;
- retention period;
- behaviour for same key/same payload;
- behaviour for same key/different payload;
- concurrent duplicate handling;
- response replay rules.

### 6.7 Time and money
Use timezone-aware UTC timestamps in API responses. Accept explicit timezone where user scheduling requires it. Use decimal strings and ISO currency codes for money. Define credit unit as an integer with a documented conversion and avoid float arithmetic.

### 6.8 API version and OpenAPI
Generate OpenAPI from the FastAPI implementation. Check it into the repository or publish it from a controlled build. Add schema compatibility checks so accidental breaking changes are detected.

---

## 7. Recommended Release 1 endpoint baseline

The following is the proposed implementation baseline, not a claim that all these routes already have complete contracts.

### Foundation and tenancy
- `GET /api/v1/me`
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/{workspace_id}`
- `PATCH /api/v1/workspaces/{workspace_id}`
- `GET /api/v1/workspaces/{workspace_id}/members`
- `POST /api/v1/workspaces/{workspace_id}/invitations`
- `POST /api/v1/invitations/{token}/accept`
- `PATCH /api/v1/workspaces/{workspace_id}/members/{membership_id}`
- `DELETE /api/v1/workspaces/{workspace_id}/members/{membership_id}`

### Industry and customer fit
- `GET /api/v1/industries`
- `GET /api/v1/industries/{industry_id}/configuration`
- `GET|PUT /api/v1/workspaces/{workspace_id}/business-profile`
- `GET /api/v1/workspaces/{workspace_id}/business-profile/versions`
- ICP and scoring configuration CRUD with version semantics.

### Company intelligence
- company search, detail, save/unsave and evidence;
- one approved company provider adapter plus seed data;
- no automatic paid enrichment on search;
- correction/reporting operation if included in pilot.

### Research and qualification
- estimate research;
- create research job with idempotency;
- list/get job and results;
- cancel request if supported;
- calculate/read lead score with profile/ICP/scoring version references.

### CRM
- lead lists and membership operations;
- CRM lead create/list/detail/update;
- pipeline stage definitions;
- activities list/create;
- tasks list/create/update;
- notes list/create.

### Usage and administration
- billing/usage summary and ledger read;
- generic metered-operation estimate/reservation contract;
- safe job status and admin queue/usage/provider health;
- audit records for sensitive operations.

**Keep outside Release 1 unless explicitly approved:** contact enrichment/verification, project/procurement connectors, scheduled monitoring, advanced exports, customer-managed provider credentials, payment checkout automation and outreach sending. Security/privacy obligations themselves are not deferred merely because a UI feature is later.

---

## 8. Required endpoint contract register

Create one row per operation, with these mandatory columns:

| Field | Required content |
|---|---|
| Operation ID | Stable identifier, e.g. `companies.search` |
| Release | R1/R2/R3/platform |
| Method + path | Exact route and path parameter types |
| Purpose | User-visible business outcome |
| Authentication | Required/none/provider webhook |
| Permission | Exact permission code |
| Scope | Platform/user/workspace/resource |
| Request schema | Model name and full field definition |
| Response schema | Model name and full field definition |
| Status codes | Success and expected failures |
| Error codes | Stable machine-readable codes |
| Side effects | Database, provider, job, email, billing |
| Idempotency | Required/optional/not applicable |
| Metering | Free/estimate/reserve/capture/release |
| Data policy | Source classes, permitted purpose, field visibility |
| Audit | Event(s) to record |
| Tests | Positive, negative, security, idempotency cases |
| Dependencies | Tables, services, providers, feature flags |

No endpoint should be marked `READY` until all required columns are completed and reviewed.

---

## 9. Minimum automated test strategy

### 9.1 Schema/unit tests
- valid create/read/update payloads;
- missing required fields;
- null versus omitted fields;
- invalid URLs, UUIDs, enums, dates and currencies;
- maximum lengths and list sizes;
- cross-field validation;
- output DTO excludes restricted/internal fields.

### 9.2 API functional tests
- create workspace and owner membership atomically;
- invite, accept, change role and revoke;
- create/update Business Profile and preserve historical versions;
- search seed companies with validated filters;
- save company to correct workspace;
- create research job and read result;
- calculate score with version references;
- create CRM lead, activity, task and note.

### 9.3 Security tests
- no token;
- invalid/expired token;
- valid user from another workspace;
- revoked member;
- insufficient permission;
- cross-tenant object ID substitution;
- nested object belonging to another tenant;
- hidden resource returns the documented 404/403 behaviour;
- platform admin route denied to ordinary tenant owner;
- provider-restricted fields absent from read and export DTOs.

### 9.4 Metering and concurrency tests
- insufficient balance creates no job;
- two concurrent requests cannot overspend;
- repeated idempotency key does not double-charge;
- same key with changed payload returns conflict;
- successful operation captures actual cost once;
- failed/cancelled operation releases or partially captures according to policy;
- stale reservation recovery is safe;
- webhook replay is ignored after first processing.

### 9.5 Worker/provider tests
- provider timeout and retry;
- non-retryable provider error;
- partial source results;
- worker crash and job recovery;
- duplicate job delivery;
- tenant and actor context retained;
- provider budget/concurrency limit enforced;
- AI output without evidence is marked unsupported/unknown rather than asserted as fact.

### 9.6 Database/migration tests
- migrations apply to a clean database;
- upgrade from previous migration works;
- tenant composite foreign keys prevent cross-tenant links;
- evidence junction FKs are enforced;
- immutable ledger/audit rules hold;
- deletion and retention jobs respect shared versus tenant-owned records.

---

## 10. Priority action register

| ID | Priority | Action | Completion evidence |
|---|---|---|---|
| A01 | P0 | Decide workspace-to-tenant mapping and glossary | Approved identity/tenancy model and ERD |
| A02 | P0 | Complete permission registry and role matrix | Seedable permission catalogue and endpoint matrix |
| A03 | P0 | Define full request/response schemas for Release 1 | Schema catalogue with field-level definitions |
| A04 | P0 | Finalise generic metering and idempotency contract | State machine, header convention, operation rules |
| A05 | P0 | Define canonical response/error/job envelopes | Pydantic base models and error registry |
| A06 | P1 | Tag every endpoint by release and feature status | Versioned endpoint inventory |
| A07 | P1 | Define source selector, visibility and purpose enums separately | Approved shared enums and policy mapping |
| A08 | P1 | Reconcile generic jobs, research jobs and worker tables | Job/resource model and endpoint contracts |
| A09 | P1 | Close privacy intake and fulfilment scope | User/platform/tenant request model and permissions |
| A10 | P1 | Add missing dashboard/CRM/list/notification/export operations or document composition | UI-to-API coverage matrix |
| A11 | P1 | Map DDD entities to public/internal/admin exposure | Entity-to-API exposure matrix |
| A12 | P1 | Define profile/scoring version concurrency semantics | Version precondition and conflict response |
| A13 | P1 | Specify provider adapter and source metadata DTOs | Normalised provider result contract |
| A14 | P2 | Define integration OAuth/callback and credential handling | Integration lifecycle contract |
| A15 | P2 | Define billing checkout, invoice and subscription state machine | Billing/payment API contract |
| A16 | P2 | Define country-specific privacy and marketing controls with legal review | Approved operational/legal checklist |
| A17 | P2 | Build endpoint-level automated test matrix and fixtures | Test plan linked to operation IDs |

---

## 11. Recommended implementation sequence after contract closure

1. **Contract closure:** finish A01–A05 and agree Release 1 boundary.
2. **Backend skeleton:** FastAPI app, settings, logging, request ID, health endpoint, error envelope, test harness.
3. **Database foundation:** PostgreSQL, SQLAlchemy base, Alembic, users/workspaces/memberships/roles/permissions.
4. **Authentication/tenancy:** Supabase token verification, internal user mapping, workspace context and permission dependencies.
5. **Industry/Profile:** industry taxonomies, Business Profile, ICP and versioned scoring configuration.
6. **Evidence/source foundation:** source registry, source records, field provenance and evidence response DTOs.
7. **Company discovery:** seed-data search first; then one provider adapter only after licence and cost approval.
8. **Research/score:** async job contract, credit reservation and research evidence.
9. **CRM:** lists, leads, stages, tasks, activities and notes.
10. **Operational readiness:** admin observability, audit, backups, privacy workflows and pilot acceptance tests.

This sequence is intentionally conservative. It establishes tenant safety and a working pilot before adding expensive data providers and advanced commercial features.

---

## 12. Final decision

The four documents should be treated as **architecture-approved but API-contract-incomplete**.

Do not discard them or begin a wholesale rewrite. Preserve the existing product and architecture decisions. Create a controlled API contract revision (recommended `API Specification v1.1`) that:
- resolves the P0 items;
- labels every endpoint by release;
- defines all Release 1 schemas and error cases;
- aligns API workspace identifiers with DDD tenant identifiers;
- supplies a complete permission registry;
- defines metering/idempotency and generic job contracts;
- closes the UI-to-API and DDD-to-API mapping;
- includes a test matrix.

Only after those changes should the team translate the Release 1 API into FastAPI routers, Pydantic models, service interfaces and automated tests.

**Recommended gate:** no Release 1 endpoint is considered implementation-ready until its contract register row is complete, its generated OpenAPI schema is reviewed, and its positive, negative, permission and tenant-isolation tests pass.

---

## Appendix A — Explicit limitations of this review

- This is a cross-document requirements and contract review, not a source-code audit.
- No FastAPI implementation, SQLAlchemy model code, migrations or test suite were supplied; therefore no runtime behaviour was verified.
- Provider contracts, commercial data licences, payment-provider terms and jurisdiction-specific legal obligations require separate verification.
- Suggested routes and model names are proposals for closing gaps; they are not represented as existing implemented endpoints.
