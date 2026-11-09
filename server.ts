import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { db, hashIdentifier } from './server/db';
import { worker } from './server/jobs';
import { CrmLead, PipelineStage, Task, Activity, OutreachDraft, CreditTransaction, RoleCode, User } from './src/types';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseAuthClient = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null;

app.use(express.json());

// Multi-tenant resolution middleware
interface TenantRequest extends Request {
  tenantId: string;
  actorName: string;
  userId: string;
  role: RoleCode;
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Jeneconk BII Enterprise API v1.1',
    revision: process.env.RENDER_GIT_COMMIT?.slice(0, 7) || 'unknown',
    gemini_configured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    prospect_search_provider: process.env.BRAVE_SEARCH_API_KEY ? 'Brave Search + Gemini' : 'Google Search grounding + Gemini',
    database: 'File-backed relational simulation with RLS & SHA-256 suppression',
    timestamp: new Date().toISOString(),
  });
});

// Authenticate every API request and derive the active workspace from server-side membership.
app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') return next();

  const demoApiEnabled =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_UNAUTHENTICATED_DEMO_API === 'true';

  if (demoApiEnabled) {
    const demoRequest = req as TenantRequest;
    demoRequest.tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-jeneconk-hq';
    demoRequest.actorName = 'Local Demo User';
    demoRequest.userId = 'local-demo-user';
    demoRequest.role = 'owner';
    return next();
  }

  if (!supabaseAuthClient) {
    return res.status(503).json({ error: 'Authentication is not configured on the server.' });
  }

  const authorization = req.header('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Bearer access token required.' });

  try {
    const { data, error } = await supabaseAuthClient.auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous) {
      return res.status(401).json({ error: 'A valid signed-in user session is required.' });
    }

    const userId = data.user.id;
    const bootstrapUserId = process.env.PILOT_AUTH_USER_ID;
    const bootstrapUserEmail = process.env.PILOT_AUTH_EMAIL?.trim().toLowerCase();
    const authenticatedEmail = data.user.email?.trim().toLowerCase();
    const isBootstrapUser =
      (!!bootstrapUserId && userId === bootstrapUserId) ||
      (!!bootstrapUserEmail && authenticatedEmail === bootstrapUserEmail && !!data.user.email_confirmed_at);
    const bootstrapTenantId = process.env.PILOT_TENANT_ID || 'tenant-jeneconk-hq';
    if (isBootstrapUser && db.getMembershipsByUserId(userId).length === 0) {
      const tenant = db.getTenant(bootstrapTenantId);
      if (!tenant) return res.status(503).json({ error: 'Configured pilot workspace does not exist.' });
      db.addMembership({
        id: `mem-auth-${userId}`,
        tenant_id: bootstrapTenantId,
        user_id: userId,
        user_name: data.user.email || 'Pilot owner',
        user_email: data.user.email || '',
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      });
    }

    const memberships = db.getMembershipsByUserId(userId).filter((membership) => membership.status === 'active');
    if (memberships.length === 0) {
      return res.status(403).json({ error: 'This account has no active workspace membership.' });
    }

    const requestedTenantId = req.path === '/me' ? undefined : req.header('X-Tenant-Id');
    const membership = requestedTenantId
      ? memberships.find((item) => item.tenant_id === requestedTenantId)
      : memberships.length === 1 ? memberships[0] : undefined;
    if (!membership) {
      return res.status(requestedTenantId ? 403 : 400).json({
        error: requestedTenantId ? 'You are not a member of the requested workspace.' : 'Select an authorized workspace.',
      });
    }

    const tenantRequest = req as TenantRequest;
    tenantRequest.tenantId = membership.tenant_id;
    tenantRequest.actorName = membership.user_name;
    tenantRequest.userId = userId;
    tenantRequest.role = membership.role;
    return next();
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return res.status(503).json({ error: 'Unable to verify the access token right now.' });
  }
});

const requireRoles = (...allowedRoles: RoleCode[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const tenantReq = req as TenantRequest;
    if (!allowedRoles.includes(tenantReq.role)) {
      return res.status(403).json({ error: 'Your workspace role is not allowed to perform this action.' });
    }
    return next();
  };

// --- Workspaces & Members ---
app.get('/api/me', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const memberships = db.getMembershipsByUserId(tenantReq.userId).filter((membership) => membership.status === 'active');
  const currentMembership = memberships.find((membership) => membership.tenant_id === tenantReq.tenantId)!;
  const user: User = {
    id: tenantReq.userId,
    email: currentMembership.user_email,
    display_name: currentMembership.user_name,
    role: currentMembership.role,
    status: 'active',
  };
  res.json({
    user,
    memberships,
    tenants: memberships.map((membership) => db.getTenant(membership.tenant_id)).filter(Boolean),
  });
});

app.get('/api/workspaces', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const tenants = db.getMembershipsByUserId(tenantReq.userId)
    .filter((membership) => membership.status === 'active')
    .map((membership) => db.getTenant(membership.tenant_id))
    .filter(Boolean);
  res.json(tenants);
});

app.get('/api/workspaces/:id/members', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  if (req.params.id !== tenantReq.tenantId) return res.status(403).json({ error: 'Workspace access denied.' });
  const members = db.getMemberships(req.params.id);
  res.json(members);
});

app.post('/api/workspaces/:id/invitations', requireRoles('owner', 'admin'), (req: Request, res: Response) => {
  return res.status(501).json({ error: 'Invitations are unavailable until Supabase invitation delivery is configured.' });
});

// --- Business Profile ---
app.get('/api/profile', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getBusinessProfile(tenantReq.tenantId));
});

app.put('/api/profile', requireRoles('owner', 'admin'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const updated = db.updateBusinessProfile(tenantReq.tenantId, req.body);
  db.logAudit(tenantReq.actorName, 'PROFILE_UPDATED', 'BusinessProfile', updated.id, 'Updated profile metadata');
  res.json(updated);
});

app.post('/api/profile/research', requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const draft = await worker.researchBusinessProfile({
      website: typeof req.body?.website === 'string' ? req.body.website : undefined,
      service_websites: Array.isArray(req.body?.service_websites) ? req.body.service_websites.filter((value: unknown): value is string => typeof value === 'string').slice(0, 25) : undefined,
      company_name: typeof req.body?.company_name === 'string' ? req.body.company_name : undefined,
      context: typeof req.body?.context === 'string' ? req.body.context : undefined,
    });
    res.json(draft);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Company research failed.' });
  }
});

app.post('/api/profile/prospects', requireRoles('owner', 'admin'), async (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const profile = db.getBusinessProfile(tenantReq.tenantId);
  if (!profile.profile_approved_at) return res.status(409).json({ error: 'Review and approve your business profile before searching for prospects.' });
  if (!profile.offerings.length) return res.status(409).json({ error: 'Add or approve at least one offering before searching for prospects.' });
  try {
    const employeeBand = typeof req.body?.employee_band === 'string' ? req.body.employee_band : undefined;
    const matches = await worker.findBusinessProspects(profile, { employee_band: employeeBand });
    res.json(matches);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Prospect search failed.' });
  }
});

app.post('/api/company-search', requireRoles('owner', 'admin', 'manager', 'member'), async (req: Request, res: Response) => {
  try {
    const results = await worker.searchCompanies({
      company_name: typeof req.body?.company_name === 'string' ? req.body.company_name : undefined,
      category: typeof req.body?.category === 'string' ? req.body.category : undefined,
      location: typeof req.body?.location === 'string' ? req.body.location : undefined,
      employee_band: typeof req.body?.employee_band === 'string' ? req.body.employee_band : undefined,
    });
    res.json(results);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Company search failed.' });
  }
});

app.put('/api/profile/scoring', requireRoles('owner', 'admin', 'manager'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { scoring_weights } = req.body;
  if (!scoring_weights) return res.status(400).json({ error: 'scoring_weights required' });

  const updated = db.updateBusinessProfile(tenantReq.tenantId, { scoring_weights });
  db.logAudit(tenantReq.actorName, 'SCORING_WEIGHTS_UPDATED', 'BusinessProfile', updated.id, 'Updated scoring weights');
  res.json(updated);
});

// --- Companies & Enrichment ---
app.get('/api/companies', (_req: Request, res: Response) => {
  res.json(db.getCompanies());
});

app.post('/api/companies/:id/save', (_req: Request, res: Response) => {
  return res.status(501).json({ error: 'Workspace-specific company saves are not implemented yet.' });
});

app.post('/api/companies/:id/enrich', (_req: Request, res: Response) => {
  return res.status(501).json({ error: 'Company enrichment is unavailable until a licensed data provider is connected.' });
});

// --- Contacts & Directory ---
app.get('/api/contacts', (_req: Request, res: Response) => {
  res.json(db.getContacts());
});

// --- Projects & Procurement Tenders ---
app.get('/api/projects', (_req: Request, res: Response) => {
  res.json(db.getProjects());
});

app.get('/api/tenders', (_req: Request, res: Response) => {
  res.json(db.getProcurementNotices());
});

// Analyst Tender Curation Intake Endpoint (Deficit 3 Fix)
app.post('/api/tenders/intake', (_req: Request, res: Response) => {
  return res.status(501).json({ error: 'Tender intake is paused until curator identities and provenance review are configured.' });
});

// --- Asynchronous AI Research & Job Runner (Deficit 2 Fix) ---
app.post('/api/jobs/research', requireRoles('owner', 'admin', 'manager', 'member'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { subject_name, subject_type, question, industry, offerings, sources } = req.body;

  if (!subject_name) {
    return res.status(400).json({ error: 'subject_name is required' });
  }

  const cost = 5;
  const balance = db.getCreditBalance(tenantReq.tenantId);

  if (balance < cost) {
    return res.status(402).json({ error: `Insufficient credits. Required: ${cost}, Available: ${balance}` });
  }

  // Step 1: Credit Reservation in immutable ledger
  const reserveTx: CreditTransaction = {
    id: `tx-res-${Date.now()}`,
    tenant_id: tenantReq.tenantId,
    transaction_type: 'reservation',
    amount: -cost,
    balance_after: balance - cost,
    description: `Credit reservation: AI Deep Research on ${subject_name}`,
    reference_type: 'ai_research',
    created_at: new Date().toISOString(),
  };
  db.addCreditTransaction(reserveTx);

  // Step 2: Create Queued Job
  const job = db.createBackgroundJob(
    tenantReq.tenantId,
    'ai_research',
    { subject_name, subject_type, question, industry, offerings, sources },
    cost
  );

  // Step 3: Trigger async execution without blocking
  worker.processJobAsync(job.id);

  db.logAudit(tenantReq.actorName, 'RESEARCH_JOB_DISPATCHED', 'BackgroundJob', job.id, `Queued asynchronous research on ${subject_name}`);

  // Step 4: Return 202 Accepted
  res.status(202).json({
    message: 'Research job queued for background synthesis',
    job_id: job.id,
    status: job.status,
    credit_reserved: cost,
    created_at: job.created_at,
  });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const job = db.getBackgroundJob(req.params.id, tenantReq.tenantId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/api/research/dossiers', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getResearchJobs(tenantReq.tenantId));
});

// --- CRM Pipeline & Leads ---
app.get('/api/crm/leads', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getCrmLeads(tenantReq.tenantId));
});

app.post('/api/crm/leads', requireRoles('owner', 'admin', 'manager', 'member'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { company_id, company_name, contact_id, contact_name, stage } = req.body;
  if (!company_id || !company_name || !db.getCompany(company_id)) {
    return res.status(400).json({ error: 'A valid company_id and company_name are required.' });
  }

  const lead: CrmLead = {
    id: `lead-${Date.now()}`,
    tenant_id: tenantReq.tenantId,
    company_id,
    company_name,
    contact_id,
    contact_name,
    stage: stage || 'discovered',
    fit_score: 85,
    estimated_deal_value_usd: 150000,
    owner_user_name: tenantReq.actorName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['Pipeline Lead'],
    notes_count: 0,
    activities_count: 1,
  };
  db.addCrmLead(lead);

  const act: Activity = {
    id: `act-${Date.now()}`,
    lead_id: lead.id,
    activity_type: 'stage_change',
    subject: `Lead Created in Stage '${lead.stage}'`,
    body: `Added to CRM under owner ${tenantReq.actorName}`,
    occurred_at: new Date().toISOString(),
    created_by_user_name: tenantReq.actorName,
  };
  db.addActivity(act);
  db.logAudit(tenantReq.actorName, 'LEAD_CREATED', 'CrmLead', lead.id, `Created lead for ${company_name}`);

  res.status(201).json(lead);
});

app.patch('/api/crm/leads/:id/stage', requireRoles('owner', 'admin', 'manager', 'member'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { stage } = req.body;
  if (!stage) return res.status(400).json({ error: 'stage required' });

  const lead = db.updateCrmLead(req.params.id, tenantReq.tenantId, { stage });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const act: Activity = {
    id: `act-${Date.now()}`,
    lead_id: lead.id,
    activity_type: 'stage_change',
    subject: `Stage Transitioned to '${stage.toUpperCase()}'`,
    body: `Pipeline stage updated by ${tenantReq.actorName}`,
    occurred_at: new Date().toISOString(),
    created_by_user_name: tenantReq.actorName,
  };
  db.addActivity(act);
  db.logAudit(tenantReq.actorName, 'STAGE_TRANSITIONED', 'CrmLead', lead.id, `Advanced lead ${lead.company_name} to ${stage}`);

  res.json(lead);
});

// Tasks & Activities
app.get('/api/crm/tasks', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getTasks(tenantReq.tenantId));
});

app.post('/api/crm/tasks', requireRoles('owner', 'admin', 'manager', 'member'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { lead_id, company_name, title, due_at, priority } = req.body;
  if (!db.getCrmLeads(tenantReq.tenantId).some((lead) => lead.id === lead_id)) {
    return res.status(404).json({ error: 'Lead not found in this workspace.' });
  }
  const task: Task = {
    id: `task-${Date.now()}`,
    lead_id,
    company_name,
    title,
    due_at,
    status: 'pending',
    priority: priority || 'medium',
    assigned_to_user_name: tenantReq.actorName,
  };
  db.addTask(task);
  res.status(201).json(task);
});

app.patch('/api/crm/tasks/:id/toggle', requireRoles('owner', 'admin', 'manager', 'member'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const task = db.toggleTask(req.params.id, tenantReq.tenantId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.get('/api/crm/activities', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getActivities(tenantReq.tenantId, req.query.lead_id as string));
});

app.post('/api/crm/activities', requireRoles('owner', 'admin', 'manager', 'member'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { lead_id, activity_type, subject, body } = req.body;
  if (!db.getCrmLeads(tenantReq.tenantId).some((lead) => lead.id === lead_id)) {
    return res.status(404).json({ error: 'Lead not found in this workspace.' });
  }
  const act: Activity = {
    id: `act-${Date.now()}`,
    lead_id,
    activity_type,
    subject,
    body,
    occurred_at: new Date().toISOString(),
    created_by_user_name: tenantReq.actorName,
  };
  db.addActivity(act);
  res.status(201).json(act);
});

// --- Outreach & Suppression (NDPA 2023 Compliance) ---
app.get('/api/outreach/drafts', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getOutreachDrafts(tenantReq.tenantId));
});

app.post('/api/outreach/draft', requireRoles('owner', 'admin', 'manager', 'member'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { lead_id, company_name, contact_id, contact_name, contact_email, subject, body, evidence_citations, unknown_warnings } = req.body;
  if (!db.getCrmLeads(tenantReq.tenantId).some((lead) => lead.id === lead_id)) {
    return res.status(404).json({ error: 'Lead not found in this workspace.' });
  }

  // Check suppression list before drafting
  const isSuppressed = db.isSuppressed(contact_email);

  const draft: OutreachDraft = {
    id: `draft-${Date.now()}`,
    tenant_id: tenantReq.tenantId,
    lead_id,
    company_name,
    contact_id,
    contact_name,
    contact_email,
    channel: 'email',
    subject,
    body,
    evidence_citations: evidence_citations || [],
    unknown_warnings: unknown_warnings || [],
    suppression_verified: !isSuppressed,
    status: 'draft',
  };

  db.addOutreachDraft(draft);
  db.logAudit(tenantReq.actorName, 'DRAFT_CREATED', 'OutreachDraft', draft.id, `Created draft for ${contact_name}`);
  res.status(201).json(draft);
});

app.post('/api/outreach/:id/approve', requireRoles('owner', 'admin', 'manager'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const existingDraft = db.getOutreachDrafts(tenantReq.tenantId).find((item) => item.id === req.params.id);
  if (!existingDraft) return res.status(404).json({ error: 'Draft not found in this workspace.' });
  const draft = db.updateOutreachDraft(req.params.id, tenantReq.tenantId, {
    status: 'approved',
    approved_by: tenantReq.actorName,
    approved_at: new Date().toISOString(),
  });
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  db.logAudit(tenantReq.actorName, 'OUTREACH_APPROVED', 'OutreachDraft', draft.id, `Approved outreach to ${draft.contact_email}`);
  res.json(draft);
});

app.post('/api/outreach/:id/send', (req: Request, res: Response) => {
  return res.status(501).json({ error: 'Email delivery is not configured; this action will not mark a draft as sent.' });
});

// Privacy & Suppression Registry
app.get('/api/privacy/suppression', requireRoles('owner', 'admin'), (_req: Request, res: Response) => {
  res.json(db.getSuppressionRecords());
});

app.post('/api/privacy/suppress', requireRoles('owner', 'admin', 'manager'), (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { channel_type, identifier, reason } = req.body;
  if (!identifier) return res.status(400).json({ error: 'identifier required' });

  const record = db.addSuppression(channel_type || 'work_email', identifier, reason || 'marketing_objection');
  db.logAudit(tenantReq.actorName, 'SUPPRESSION_RECORDED', 'SuppressionEntry', record.id, `Hashed identifier added to global suppression list`);
  res.status(201).json(record);
});

// --- Credits & Metering ---
app.get('/api/credits/balance', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json({ balance: db.getCreditBalance(tenantReq.tenantId) });
});

app.get('/api/credits/transactions', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getCreditTransactions(tenantReq.tenantId));
});

app.post('/api/credits/topup', (_req: Request, res: Response) => {
  return res.status(501).json({ error: 'Credit purchases are unavailable until payment processing is configured.' });
});

// --- Platform Admin & Audit ---
app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  return res.status(501).json({ error: 'Audit logs are unavailable until tenant-scoped audit storage is implemented.' });
});

app.get('/api/admin/system-status', (_req: Request, res: Response) => {
  return res.status(501).json({ error: 'System status is unavailable until provider health checks are implemented.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jeneconk BII server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
