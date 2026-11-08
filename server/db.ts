import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Tenant,
  User,
  Membership,
  BusinessProfile,
  Company,
  Contact,
  Project,
  ProcurementNotice,
  ResearchJob,
  CrmLead,
  Task,
  Activity,
  OutreachDraft,
  CreditTransaction,
  SavedSearch,
  LeadList,
  AuditLogEntry
} from '../src/types';
import {
  SEED_TENANTS,
  CURRENT_USER,
  SEED_MEMBERSHIPS,
  INITIAL_BUSINESS_PROFILE,
  SEED_COMPANIES,
  SEED_CONTACTS,
  SEED_PROJECTS,
  SEED_PROCUREMENT_NOTICES,
  SEED_RESEARCH_JOBS,
  SEED_CRM_LEADS,
  SEED_TASKS,
  SEED_ACTIVITIES,
  SEED_OUTREACH_DRAFTS,
  INITIAL_CREDIT_TRANSACTIONS,
  SEED_SAVED_SEARCHES,
  SEED_LEAD_LISTS,
  SEED_AUDIT_LOGS
} from '../src/data/seedData';

export interface SuppressionEntry {
  id: string;
  channel_type: 'work_email' | 'work_phone' | 'domain';
  value_hash: string;
  raw_identifier_masked: string;
  reason: 'marketing_objection' | 'opt_out' | 'invalid_bounced' | 'regulatory_blacklist';
  created_at: string;
}

export interface AsyncBackgroundJob {
  id: string;
  tenant_id: string;
  job_type: 'ai_research' | 'company_enrichment' | 'nipex_tender_sync' | 'contact_verification';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  payload: any;
  result?: any;
  error_message?: string;
  progress_pct: number;
  credit_reserved: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface DatabaseSchema {
  tenants: Tenant[];
  users: User[];
  memberships: Membership[];
  business_profiles: Record<string, BusinessProfile>; // keyed by tenant_id
  companies: Company[];
  contacts: Contact[];
  projects: Project[];
  procurement_notices: ProcurementNotice[];
  research_jobs: ResearchJob[];
  crm_leads: CrmLead[];
  tasks: Task[];
  activities: Activity[];
  outreach_drafts: OutreachDraft[];
  credit_transactions: CreditTransaction[];
  saved_searches: SavedSearch[];
  lead_lists: LeadList[];
  audit_logs: AuditLogEntry[];
  suppression_records: SuppressionEntry[];
  background_jobs: AsyncBackgroundJob[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data_store.json');

// Helper to hash emails and identifiers for NDPA 2023 compliance
export function hashIdentifier(val: string): string {
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read existing database file, initializing defaults:', err);
    }
    return this.getInitialSchema();
  }

  private getInitialSchema(): DatabaseSchema {
    const initialProfiles: Record<string, BusinessProfile> = {
      'tenant-jeneconk-hq': INITIAL_BUSINESS_PROFILE,
      'tenant-alpha-epc': {
        ...INITIAL_BUSINESS_PROFILE,
        id: 'bp-alpha-epc',
        tenant_id: 'tenant-alpha-epc',
        company_name: 'West Africa EPC Industrial Partners',
        target_industries: ['oil_and_gas'],
      },
      'tenant-personal-adebayo': {
        ...INITIAL_BUSINESS_PROFILE,
        id: 'bp-personal',
        tenant_id: 'tenant-personal-adebayo',
        company_name: 'Dr. Kenneth Adebayo Research Practice',
        target_industries: ['education', 'digital_products'],
      },
    };

    const initialSuppression: SuppressionEntry[] = [
      {
        id: 'supp-01',
        channel_type: 'work_email',
        value_hash: hashIdentifier('optout@competitor.com'),
        raw_identifier_masked: 'o***t@competitor.com',
        reason: 'marketing_objection',
        created_at: '2026-10-01T10:00:00Z',
      },
    ];

    return {
      tenants: SEED_TENANTS,
      users: [CURRENT_USER],
      memberships: SEED_MEMBERSHIPS,
      business_profiles: initialProfiles,
      companies: SEED_COMPANIES,
      contacts: SEED_CONTACTS,
      projects: SEED_PROJECTS,
      procurement_notices: SEED_PROCUREMENT_NOTICES,
      research_jobs: SEED_RESEARCH_JOBS,
      crm_leads: SEED_CRM_LEADS,
      tasks: SEED_TASKS,
      activities: SEED_ACTIVITIES,
      outreach_drafts: SEED_OUTREACH_DRAFTS,
      credit_transactions: INITIAL_CREDIT_TRANSACTIONS,
      saved_searches: SEED_SAVED_SEARCHES,
      lead_lists: SEED_LEAD_LISTS,
      audit_logs: SEED_AUDIT_LOGS,
      suppression_records: initialSuppression,
      background_jobs: [],
    };
  }

  public save(): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Tenancy & Users ---
  public getTenants(): Tenant[] {
    return this.data.tenants;
  }

  public getTenant(id: string): Tenant | undefined {
    return this.data.tenants.find((t) => t.id === id);
  }

  public getMemberships(tenantId: string): Membership[] {
    return this.data.memberships.filter((m) => m.tenant_id === tenantId);
  }

  public getMembershipsByUserId(userId: string): Membership[] {
    return this.data.memberships.filter((m) => m.user_id === userId);
  }

  public addMembership(membership: Membership): void {
    this.data.memberships.push(membership);
    this.save();
  }

  // --- Business Profile ---
  public getBusinessProfile(tenantId: string): BusinessProfile {
    if (!this.data.business_profiles[tenantId]) {
      this.data.business_profiles[tenantId] = {
        ...INITIAL_BUSINESS_PROFILE,
        id: `bp-${tenantId}`,
        tenant_id: tenantId,
      };
      this.save();
    }
    return this.data.business_profiles[tenantId];
  }

  public updateBusinessProfile(tenantId: string, updates: Partial<BusinessProfile>): BusinessProfile {
    const current = this.getBusinessProfile(tenantId);
    const updated: BusinessProfile = {
      ...current,
      ...updates,
      version: current.version + 1,
      updated_at: new Date().toISOString(),
    };
    if (updated.company_profiles?.length) {
      const { company_profiles: _profiles, company_research_records: _researchRecords, scoring_weights: _weights, version: _version, tenant_id: _tenantId, ...activeRecord } = updated;
      const activeIndex = updated.company_profiles.findIndex((profile) => profile.id === updated.id);
      if (activeIndex >= 0) {
        updated.company_profiles = updated.company_profiles.map((profile, index) => index === activeIndex
          ? { ...profile, ...activeRecord, id: updated.id, updated_at: updated.updated_at }
          : profile);
      }
    }
    this.data.business_profiles[tenantId] = updated;
    this.save();
    return updated;
  }

  // --- Companies & Evidence ---
  public getCompanies(): Company[] {
    return this.data.companies;
  }

  public getCompany(id: string): Company | undefined {
    return this.data.companies.find((c) => c.id === id);
  }

  public saveCompany(id: string, isSaved: boolean): Company | undefined {
    const comp = this.getCompany(id);
    if (comp) {
      comp.is_saved = isSaved;
      this.save();
    }
    return comp;
  }

  public enrichCompanyRecord(id: string): Company | undefined {
    const comp = this.getCompany(id);
    if (comp) {
      comp.last_checked_at = new Date().toISOString();
      comp.primary_contacts_count += 1;
      this.save();
    }
    return comp;
  }

  // --- Contacts & Suppression ---
  public getContacts(): Contact[] {
    return this.data.contacts;
  }

  public isSuppressed(identifier: string): boolean {
    const hashed = hashIdentifier(identifier);
    return this.data.suppression_records.some((s) => s.value_hash === hashed);
  }

  public addSuppression(channelType: 'work_email' | 'work_phone' | 'domain', identifier: string, reason: SuppressionEntry['reason']): SuppressionEntry {
    const masked = identifier.length > 5 ? `${identifier.slice(0, 2)}***${identifier.slice(-3)}` : '***';
    const entry: SuppressionEntry = {
      id: `supp-${Date.now()}`,
      channel_type: channelType,
      value_hash: hashIdentifier(identifier),
      raw_identifier_masked: masked,
      reason,
      created_at: new Date().toISOString(),
    };
    this.data.suppression_records.push(entry);
    this.save();
    return entry;
  }

  public getSuppressionRecords(): SuppressionEntry[] {
    return this.data.suppression_records;
  }

  // --- Projects & Tenders ---
  public getProjects(): Project[] {
    return this.data.projects;
  }

  public getProcurementNotices(): ProcurementNotice[] {
    return this.data.procurement_notices;
  }

  public addProcurementNotice(notice: ProcurementNotice): void {
    this.data.procurement_notices.unshift(notice);
    this.save();
  }

  // --- Background Jobs Queue (SKIP LOCKED simulation) ---
  public createBackgroundJob(tenantId: string, jobType: AsyncBackgroundJob['job_type'], payload: any, creditReserved: number): AsyncBackgroundJob {
    const job: AsyncBackgroundJob = {
      id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: tenantId,
      job_type: jobType,
      status: 'queued',
      payload,
      progress_pct: 0,
      credit_reserved: creditReserved,
      created_at: new Date().toISOString(),
    };
    this.data.background_jobs.unshift(job);
    this.save();
    return job;
  }

  public getBackgroundJob(jobId: string, tenantId?: string): AsyncBackgroundJob | undefined {
    return this.data.background_jobs.find((j) => j.id === jobId && (!tenantId || j.tenant_id === tenantId));
  }

  public updateBackgroundJob(jobId: string, updates: Partial<AsyncBackgroundJob>): AsyncBackgroundJob | undefined {
    const job = this.getBackgroundJob(jobId);
    if (job) {
      Object.assign(job, updates);
      this.save();
    }
    return job;
  }

  // --- Research Dossiers ---
  public getResearchJobs(tenantId: string): ResearchJob[] {
    return this.data.research_jobs.filter((j) => j.tenant_id === tenantId);
  }

  public addResearchJob(job: ResearchJob): void {
    this.data.research_jobs.unshift(job);
    this.save();
  }

  // --- CRM Leads, Tasks, Activities, Outreach ---
  public getCrmLeads(tenantId: string): CrmLead[] {
    return this.data.crm_leads.filter((l) => l.tenant_id === tenantId);
  }

  public addCrmLead(lead: CrmLead): void {
    this.data.crm_leads.unshift(lead);
    this.save();
  }

  public updateCrmLead(leadId: string, tenantId: string, updates: Partial<CrmLead>): CrmLead | undefined {
    const lead = this.data.crm_leads.find((l) => l.id === leadId && l.tenant_id === tenantId);
    if (lead) {
      Object.assign(lead, updates, { updated_at: new Date().toISOString() });
      this.save();
    }
    return lead;
  }

  public getTasks(tenantId: string): Task[] {
    const leadIds = new Set(this.getCrmLeads(tenantId).map((lead) => lead.id));
    return this.data.tasks.filter((task) => leadIds.has(task.lead_id));
  }

  public addTask(task: Task): void {
    this.data.tasks.unshift(task);
    this.save();
  }

  public toggleTask(taskId: string, tenantId: string): Task | undefined {
    const task = this.getTasks(tenantId).find((t) => t.id === taskId);
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      this.save();
    }
    return task;
  }

  public getActivities(tenantId: string, leadId?: string): Activity[] {
    const tenantLeadIds = new Set(this.getCrmLeads(tenantId).map((lead) => lead.id));
    if (leadId) {
      if (!tenantLeadIds.has(leadId)) return [];
      return this.data.activities.filter((activity) => activity.lead_id === leadId);
    }
    return this.data.activities.filter((activity) => tenantLeadIds.has(activity.lead_id));
  }

  public addActivity(act: Activity): void {
    this.data.activities.unshift(act);
    this.save();
  }

  public getOutreachDrafts(tenantId: string): OutreachDraft[] {
    return this.data.outreach_drafts.filter((d) => d.tenant_id === tenantId);
  }

  public addOutreachDraft(draft: OutreachDraft): void {
    this.data.outreach_drafts.unshift(draft);
    this.save();
  }

  public updateOutreachDraft(draftId: string, tenantId: string, updates: Partial<OutreachDraft>): OutreachDraft | undefined {
    const draft = this.data.outreach_drafts.find((d) => d.id === draftId && d.tenant_id === tenantId);
    if (draft) {
      Object.assign(draft, updates);
      this.save();
    }
    return draft;
  }

  // --- Credits & Metering Ledger ---
  public getCreditBalance(tenantId: string): number {
    const tenantTxs = this.data.credit_transactions.filter((tx) => tx.tenant_id === tenantId);
    if (tenantTxs.length === 0) return 1000;
    return tenantTxs[tenantTxs.length - 1].balance_after;
  }

  public getCreditTransactions(tenantId: string): CreditTransaction[] {
    return this.data.credit_transactions.filter((tx) => tx.tenant_id === tenantId);
  }

  public addCreditTransaction(tx: CreditTransaction): void {
    this.data.credit_transactions.push(tx);
    this.save();
  }

  // --- Audit Logs ---
  public logAudit(actorName: string, action: string, resourceType: string, resourceId: string, details: string): void {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor_name: actorName,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    };
    this.data.audit_logs.unshift(entry);
    this.save();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.data.audit_logs;
  }
}

export const db = new Database();
