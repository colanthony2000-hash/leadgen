import {
  Tenant,
  Membership,
  BusinessProfile,
  BusinessProfileResearchDraft,
  BusinessProspectMatch,
  CompanySearchInput,
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
  AuditLogEntry,
  ScoringWeights,
  RoleCode,
  PipelineStage,
  User
} from '../types';

export class ApiClient {
  private tenantId: string = import.meta.env.VITE_PILOT_TENANT_ID || 'tenant-jeneconk-hq';
  private accessToken: string | null = null;

  public setAccessToken(accessToken: string | null) {
    this.accessToken = accessToken;
  }

  public setTenantContext(tenantId: string, _actorName?: string) {
    this.tenantId = tenantId;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const accessToken = this.accessToken;
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(path, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  // Workspaces & Members
  async getMe(): Promise<{ user: User; tenants: Tenant[]; memberships: Membership[] }> {
    return this.request('/api/me');
  }

  async getWorkspaces(): Promise<Tenant[]> {
    return this.request<Tenant[]>('/api/workspaces');
  }

  async getMembers(tenantId: string): Promise<Membership[]> {
    return this.request<Membership[]>(`/api/workspaces/${tenantId}/members`);
  }

  async inviteMember(tenantId: string, email: string, role: RoleCode): Promise<Membership> {
    return this.request<Membership>(`/api/workspaces/${tenantId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  // Profile & Scoring
  async getProfile(): Promise<BusinessProfile> {
    return this.request<BusinessProfile>('/api/profile');
  }

  async updateProfile(updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return this.request<BusinessProfile>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async researchBusinessProfile(input: { website?: string; service_websites?: string[]; company_name?: string; context?: string }): Promise<BusinessProfileResearchDraft> {
    return this.request('/api/profile/research', { method: 'POST', body: JSON.stringify(input) });
  }

  async findBusinessProspects(): Promise<BusinessProspectMatch[]> {
    return this.request('/api/profile/prospects', { method: 'POST' });
  }

  async searchCompanies(input: CompanySearchInput): Promise<BusinessProspectMatch[]> {
    return this.request('/api/company-search', { method: 'POST', body: JSON.stringify(input) });
  }

  async updateScoringWeights(scoring_weights: ScoringWeights): Promise<BusinessProfile> {
    return this.request<BusinessProfile>('/api/profile/scoring', {
      method: 'PUT',
      body: JSON.stringify({ scoring_weights }),
    });
  }

  // Companies & Enrichment
  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/api/companies');
  }

  async saveCompany(id: string, is_saved: boolean): Promise<Company> {
    return this.request<Company>(`/api/companies/${id}/save`, {
      method: 'POST',
      body: JSON.stringify({ is_saved }),
    });
  }

  async triggerEnrichmentJob(id: string): Promise<{ job_id: string; status: string; credit_reserved: number }> {
    return this.request(`/api/companies/${id}/enrich`, {
      method: 'POST',
    });
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return this.request<Contact[]>('/api/contacts');
  }

  // Projects & Tenders
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/projects');
  }

  async getTenders(): Promise<ProcurementNotice[]> {
    return this.request<ProcurementNotice[]>('/api/tenders');
  }

  async submitTenderIntake(tenderData: Partial<ProcurementNotice>): Promise<ProcurementNotice> {
    return this.request<ProcurementNotice>('/api/tenders/intake', {
      method: 'POST',
      body: JSON.stringify(tenderData),
    });
  }

  // Asynchronous AI Research & Job Poller
  async startResearchJob(payload: {
    subject_name: string;
    subject_type: string;
    question: string;
    industry: string;
    offerings: any[];
    sources: string[];
    subject_id?: string;
  }): Promise<{ job_id: string; status: string; credit_reserved: number }> {
    return this.request('/api/jobs/research', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    return this.request(`/api/jobs/${jobId}`);
  }

  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (progressPct: number, status: string) => void,
    timeoutMs: number = 120000
  ): Promise<any> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const job = await this.getJobStatus(jobId);
      if (onProgress) {
        onProgress(job.progress_pct || 0, job.status);
      }
      if (job.status === 'completed') {
        return job.result;
      }
      if (job.status === 'failed') {
        throw new Error(job.error_message || 'Background job failed');
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    throw new Error('Background job timed out');
  }

  async getResearchDossiers(): Promise<ResearchJob[]> {
    return this.request<ResearchJob[]>('/api/research/dossiers');
  }

  // CRM
  async getCrmLeads(): Promise<CrmLead[]> {
    return this.request<CrmLead[]>('/api/crm/leads');
  }

  async createCrmLead(data: {
    company_id: string;
    company_name: string;
    contact_id?: string;
    contact_name?: string;
    stage?: PipelineStage;
  }): Promise<CrmLead> {
    return this.request<CrmLead>('/api/crm/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeadStage(leadId: string, stage: PipelineStage): Promise<CrmLead> {
    return this.request<CrmLead>(`/api/crm/leads/${leadId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
  }

  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/api/crm/tasks');
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    return this.request<Task>('/api/crm/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async toggleTask(taskId: string): Promise<Task> {
    return this.request<Task>(`/api/crm/tasks/${taskId}/toggle`, {
      method: 'PATCH',
    });
  }

  async getActivities(leadId?: string): Promise<Activity[]> {
    return this.request<Activity[]>(`/api/crm/activities${leadId ? `?lead_id=${leadId}` : ''}`);
  }

  async logActivity(activity: Partial<Activity>): Promise<Activity> {
    return this.request<Activity>('/api/crm/activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  // Outreach & Suppression
  async getOutreachDrafts(): Promise<OutreachDraft[]> {
    return this.request<OutreachDraft[]>('/api/outreach/drafts');
  }

  async createOutreachDraft(draft: Partial<OutreachDraft>): Promise<OutreachDraft> {
    return this.request<OutreachDraft>('/api/outreach/draft', {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  }

  async approveOutreach(draftId: string): Promise<OutreachDraft> {
    return this.request<OutreachDraft>(`/api/outreach/${draftId}/approve`, {
      method: 'POST',
    });
  }

  async sendOutreach(draftId: string): Promise<{ success: boolean; draft: OutreachDraft }> {
    return this.request(`/api/outreach/${draftId}/send`, {
      method: 'POST',
    });
  }

  async getSuppressionList(): Promise<any[]> {
    return this.request('/api/privacy/suppression');
  }

  async addSuppression(channel_type: string, identifier: string, reason: string): Promise<any> {
    return this.request('/api/privacy/suppress', {
      method: 'POST',
      body: JSON.stringify({ channel_type, identifier, reason }),
    });
  }

  // Credits & Ledger
  async getCreditBalance(): Promise<number> {
    const res = await this.request<{ balance: number }>('/api/credits/balance');
    return res.balance;
  }

  async getCreditTransactions(): Promise<CreditTransaction[]> {
    return this.request<CreditTransaction[]>('/api/credits/transactions');
  }

  async topUpCredits(amount: number, description?: string): Promise<{ balance: number; transaction: CreditTransaction }> {
    return this.request('/api/credits/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  // Platform Admin
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return this.request<AuditLogEntry[]>('/api/admin/audit-logs');
  }

  async getSystemStatus(): Promise<any> {
    return this.request('/api/admin/system-status');
  }
}

export const api = new ApiClient();
