import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { db, hashIdentifier } from './server/db';
import { worker } from './server/jobs';
import { CrmLead, PipelineStage, Task, Activity, OutreachDraft, CreditTransaction, ProcurementNotice } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Multi-tenant resolution middleware
interface TenantRequest extends Request {
  tenantId: string;
  actorName: string;
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  const tenantReq = req as TenantRequest;
  tenantReq.tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-jeneconk-hq';
  tenantReq.actorName = (req.headers['x-actor-name'] as string) || 'Dr. Kenneth Adebayo';
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Jeneconk BII Enterprise API v1.1',
    gemini_configured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    database: 'File-backed relational simulation with RLS & SHA-256 suppression',
    timestamp: new Date().toISOString(),
  });
});

// --- Workspaces & Members ---
app.get('/api/workspaces', (_req: Request, res: Response) => {
  res.json(db.getTenants());
});

app.get('/api/workspaces/:id/members', (req: Request, res: Response) => {
  const members = db.getMemberships(req.params.id);
  res.json(members);
});

app.post('/api/workspaces/:id/invitations', (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'email and role required' });

  const tenantReq = req as TenantRequest;
  const newMembership = {
    id: `mem-${Date.now()}`,
    tenant_id: req.params.id,
    user_id: `user-inv-${Date.now()}`,
    user_name: email.split('@')[0],
    user_email: email,
    role,
    status: 'invited' as const,
    joined_at: new Date().toISOString(),
  };
  db.addMembership(newMembership);
  db.logAudit(tenantReq.actorName, 'MEMBER_INVITED', 'Membership', newMembership.id, `Invited ${email} with role '${role}'`);
  res.status(201).json(newMembership);
});

// --- Business Profile ---
app.get('/api/profile', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  res.json(db.getBusinessProfile(tenantReq.tenantId));
});

app.put('/api/profile', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const updated = db.updateBusinessProfile(tenantReq.tenantId, req.body);
  db.logAudit(tenantReq.actorName, 'PROFILE_UPDATED', 'BusinessProfile', updated.id, 'Updated profile metadata');
  res.json(updated);
});

app.put('/api/profile/scoring', (req: Request, res: Response) => {
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

app.post('/api/companies/:id/save', (req: Request, res: Response) => {
  const { is_saved } = req.body;
  const company = db.saveCompany(req.params.id, is_saved ?? true);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(company);
});

app.post('/api/companies/:id/enrich', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const cost = 2;
  const balance = db.getCreditBalance(tenantReq.tenantId);

  if (balance < cost) {
    return res.status(402).json({ error: `Insufficient credits. Required: ${cost}, Available: ${balance}` });
  }

  // Reserve credits
  const reserveTx: CreditTransaction = {
    id: `tx-res-${Date.now()}`,
    tenant_id: tenantReq.tenantId,
    transaction_type: 'reservation',
    amount: -cost,
    balance_after: balance - cost,
    description: `Credit reservation: Registry enrichment for #${req.params.id}`,
    reference_type: 'company_enrichment',
    reference_id: req.params.id,
    created_at: new Date().toISOString(),
  };
  db.addCreditTransaction(reserveTx);

  // Spawn background job
  const job = db.createBackgroundJob(tenantReq.tenantId, 'company_enrichment', { company_id: req.params.id }, cost);
  worker.processJobAsync(job.id);

  res.status(202).json({
    message: 'Enrichment job queued successfully',
    job_id: job.id,
    status: job.status,
    credit_reserved: cost,
  });
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
app.post('/api/tenders/intake', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { notice_reference, title, buyer_name, procurement_category, published_at, deadline_at, scope_summary, eligibility_summary, estimated_budget_usd, source_portal, source_url, industry_id } = req.body;

  if (!notice_reference || !title || !buyer_name || !deadline_at) {
    return res.status(400).json({ error: 'Missing mandatory tender fields (reference, title, buyer, deadline)' });
  }

  const notice: ProcurementNotice = {
    id: `proc-intake-${Date.now()}`,
    notice_reference: notice_reference.trim(),
    title: title.trim(),
    buyer_company_id: 'comp-curated',
    buyer_name: buyer_name.trim(),
    industry_id: industry_id || 'oil_and_gas',
    procurement_category: procurement_category || 'General Procurement',
    published_at: published_at || new Date().toISOString(),
    deadline_at: deadline_at,
    status: 'open',
    scope_summary: scope_summary || '',
    eligibility_summary: eligibility_summary || '',
    estimated_budget_usd: estimated_budget_usd ? Number(estimated_budget_usd) : undefined,
    source_portal: source_portal || 'NipeX Portal',
    source_url: source_url || 'https://nipex-ng.com/tenders',
    is_monitored: true,
  };

  db.addProcurementNotice(notice);
  db.logAudit(tenantReq.actorName, 'TENDER_CURATED', 'ProcurementNotice', notice.id, `Analyst intake: published tender ${notice.notice_reference}`);
  res.status(201).json(notice);
});

// --- Asynchronous AI Research & Job Runner (Deficit 2 Fix) ---
app.post('/api/jobs/research', (req: Request, res: Response) => {
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
  const job = db.getBackgroundJob(req.params.id);
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

app.post('/api/crm/leads', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { company_id, company_name, contact_id, contact_name, stage } = req.body;

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

app.patch('/api/crm/leads/:id/stage', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { stage } = req.body;
  if (!stage) return res.status(400).json({ error: 'stage required' });

  const lead = db.updateCrmLead(req.params.id, { stage });
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
app.get('/api/crm/tasks', (_req: Request, res: Response) => {
  res.json(db.getTasks());
});

app.post('/api/crm/tasks', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { lead_id, company_name, title, due_at, priority } = req.body;
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

app.patch('/api/crm/tasks/:id/toggle', (req: Request, res: Response) => {
  const task = db.toggleTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.get('/api/crm/activities', (req: Request, res: Response) => {
  res.json(db.getActivities(req.query.lead_id as string));
});

app.post('/api/crm/activities', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { lead_id, activity_type, subject, body } = req.body;
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

app.post('/api/outreach/draft', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { lead_id, company_name, contact_id, contact_name, contact_email, subject, body, evidence_citations, unknown_warnings } = req.body;

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

app.post('/api/outreach/:id/approve', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const draft = db.updateOutreachDraft(req.params.id, {
    status: 'approved',
    approved_by: tenantReq.actorName,
    approved_at: new Date().toISOString(),
  });
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  db.logAudit(tenantReq.actorName, 'OUTREACH_APPROVED', 'OutreachDraft', draft.id, `Approved outreach to ${draft.contact_email}`);
  res.json(draft);
});

app.post('/api/outreach/:id/send', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const draft = db.getOutreachDrafts(tenantReq.tenantId).find((d) => d.id === req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft not found' });

  if (draft.status !== 'approved') {
    return res.status(403).json({ error: 'NDPA Governance Violation: Human approval required before sending.' });
  }

  // Immediate suppression check prior to send
  if (db.isSuppressed(draft.contact_email)) {
    return res.status(403).json({ error: `Outreach blocked: Contact ${draft.contact_email} has opted out or is suppressed.` });
  }

  const updated = db.updateOutreachDraft(draft.id, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  });

  const act: Activity = {
    id: `act-${Date.now()}`,
    lead_id: draft.lead_id,
    activity_type: 'email',
    subject: `Outreach Sent: ${draft.subject}`,
    body: `Dispatched approved communication to ${draft.contact_email}`,
    occurred_at: new Date().toISOString(),
    created_by_user_name: tenantReq.actorName,
  };
  db.addActivity(act);
  db.logAudit(tenantReq.actorName, 'OUTREACH_DISPATCHED', 'OutreachDraft', draft.id, `Dispatched message to ${draft.contact_email}`);

  res.json({ success: true, draft: updated });
});

// Privacy & Suppression Registry
app.get('/api/privacy/suppression', (_req: Request, res: Response) => {
  res.json(db.getSuppressionRecords());
});

app.post('/api/privacy/suppress', (req: Request, res: Response) => {
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

app.post('/api/credits/topup', (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest;
  const { amount, description } = req.body;
  const amt = Number(amount) || 100;
  const current = db.getCreditBalance(tenantReq.tenantId);

  const tx: CreditTransaction = {
    id: `tx-top-${Date.now()}`,
    tenant_id: tenantReq.tenantId,
    transaction_type: 'top_up',
    amount: amt,
    balance_after: current + amt,
    description: description || `Credit Top-Up (${amt} credits)`,
    reference_type: 'top_up_purchase',
    created_at: new Date().toISOString(),
  };
  db.addCreditTransaction(tx);
  db.logAudit(tenantReq.actorName, 'CREDITS_TOPPED_UP', 'CreditAccount', tenantReq.tenantId, `Added ${amt} credits`);
  res.status(201).json({ balance: tx.balance_after, transaction: tx });
});

// --- Platform Admin & Audit ---
app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  res.json(db.getAuditLogs());
});

app.get('/api/admin/system-status', (_req: Request, res: Response) => {
  res.json({
    tenants_count: db.getTenants().length,
    canonical_companies_count: db.getCompanies().length,
    suppression_count: db.getSuppressionRecords().length,
    queues: [
      { name: 'ai_research_workers', workers: 4, status: 'active', active_jobs: 0 },
      { name: 'nipex_tender_sync', workers: 2, status: 'active', active_jobs: 0 },
      { name: 'enrichment_metering_queue', workers: 2, status: 'active', active_jobs: 0 },
    ],
    adapters: [
      { name: 'NipeX JQS Tender Scraper', latencyMs: 240, status: 'nominal' },
      { name: 'Apollo Commercial Adapter', latencyMs: 180, status: 'nominal' },
      { name: 'CAC Public Registry Connector', latencyMs: 310, status: 'nominal' },
      { name: 'Google GenAI (gemini-2.5-flash)', latencyMs: 420, status: 'nominal' },
    ],
  });
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
