import React, { createContext, useContext, useState, useEffect } from 'react';
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
  AuditLogEntry,
  ToastMessage,
  IndustryCode,
  PipelineStage,
  ScoringWeights,
  RoleCode
} from '../types';
import {
  SEED_TENANTS,
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
} from '../data/seedData';
import { api } from '../services/api';

interface AppContextType {
  // Tenancy & Identity
  activeTenant: Tenant;
  tenants: Tenant[];
  currentUser: User;
  memberships: Membership[];
  signOut: () => void;
  isDemoMode: boolean;
  switchWorkspace: (tenantId: string) => void;
  inviteMember: (email: string, role: RoleCode) => void;

  // Industry & Configuration
  activeIndustry: IndustryCode | 'all';
  setActiveIndustry: (industry: IndustryCode | 'all') => void;
  businessProfile: BusinessProfile;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  updateScoringWeights: (weights: ScoringWeights) => void;

  // Intelligence Entities
  companies: Company[];
  contacts: Contact[];
  projects: Project[];
  procurementNotices: ProcurementNotice[];
  savedSearches: SavedSearch[];
  leadLists: LeadList[];

  // Company Actions
  saveCompany: (companyId: string) => void;
  unsaveCompany: (companyId: string) => void;
  enrichCompany: (companyId: string) => Promise<boolean>;

  // Research Actions
  researchJobs: ResearchJob[];
  runResearchJob: (
    subjectType: 'company' | 'contact' | 'opportunity' | 'market_topic',
    subjectId: string,
    subjectName: string,
    prompt: string,
    sources: string[],
    onProgress?: (progressPct: number, status: string) => void
  ) => Promise<ResearchJob>;

  // CRM & Pipeline Actions
  crmLeads: CrmLead[];
  addCompanyToCrm: (companyId: string, stage?: PipelineStage, contactId?: string) => CrmLead;
  updateLeadStage: (leadId: string, stage: PipelineStage) => void;
  tasks: Task[];
  createTask: (leadId: string, title: string, dueAt: string, priority: 'low' | 'medium' | 'high') => void;
  toggleTaskStatus: (taskId: string) => void;
  activities: Activity[];
  logActivity: (leadId: string, type: 'call' | 'meeting' | 'email' | 'research_note', subject: string, body: string) => void;

  // Outreach Drafting & Approval
  outreachDrafts: OutreachDraft[];
  generateOutreachDraft: (leadId: string, contactId: string, purpose?: string) => OutreachDraft;
  approveOutreachDraft: (draftId: string) => void;
  sendOutreachDraft: (draftId: string) => Promise<boolean>;

  // Credits & Metering
  creditBalance: number;
  creditTransactions: CreditTransaction[];
  topUpCredits: (amount: number, note: string) => void;

  // Audit Logs
  auditLogs: AuditLogEntry[];

  // Global UI State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCompanyForDetail: Company | null;
  setSelectedCompanyForDetail: (company: Company | null) => void;
  selectedContactForDetail: Contact | null;
  setSelectedContactForDetail: (contact: Contact | null) => void;
  activeOutreachModalLead: CrmLead | null;
  setActiveOutreachModalLead: (lead: CrmLead | null) => void;

  // Modals & Curation Actions
  isIntakeModalOpen: boolean;
  setIsIntakeModalOpen: (open: boolean) => void;
  isPrivacyModalOpen: boolean;
  setIsPrivacyModalOpen: (open: boolean) => void;
  submitTenderIntake: (tender: Partial<ProcurementNotice>) => Promise<void>;

  // Sweet Rewarding Toast Feedback
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  user: User;
  tenants?: Tenant[];
  memberships?: Membership[];
  onSignOut?: () => void;
  demoMode?: boolean;
}> = ({ children, user, tenants: authorizedTenants, memberships: authorizedMemberships, onSignOut, demoMode = false }) => {
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  // Tenancy
  const [tenants] = useState<Tenant[]>(authorizedTenants || SEED_TENANTS);
  const [activeTenantId, setActiveTenantId] = useState<string>(authorizedTenants?.[0]?.id || import.meta.env.VITE_PILOT_TENANT_ID || 'tenant-jeneconk-hq');
  const [currentUser] = useState<User>(user);
  const [memberships, setMemberships] = useState<Membership[]>(authorizedMemberships || SEED_MEMBERSHIPS);

  // Industry & Profile
  const [activeIndustry, setActiveIndustry] = useState<IndustryCode | 'all'>('all');
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_profile') : null;
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_PROFILE;
  });

  // Entities
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_companies') : null;
    return saved ? JSON.parse(saved) : SEED_COMPANIES;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_contacts') : null;
    return saved ? JSON.parse(saved) : SEED_CONTACTS;
  });

  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [procurementNotices, setProcurementNotices] = useState<ProcurementNotice[]>(SEED_PROCUREMENT_NOTICES);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(SEED_SAVED_SEARCHES);
  const [leadLists, setLeadLists] = useState<LeadList[]>(SEED_LEAD_LISTS);

  // Research
  const [researchJobs, setResearchJobs] = useState<ResearchJob[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_research_jobs') : null;
    return saved ? JSON.parse(saved) : demoMode ? SEED_RESEARCH_JOBS : [];
  });

  // CRM
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_crm_leads') : null;
    return saved ? JSON.parse(saved) : demoMode ? SEED_CRM_LEADS : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_tasks') : null;
    return saved ? JSON.parse(saved) : demoMode ? SEED_TASKS : [];
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_activities') : null;
    return saved ? JSON.parse(saved) : demoMode ? SEED_ACTIVITIES : [];
  });

  const [outreachDrafts, setOutreachDrafts] = useState<OutreachDraft[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_outreach_drafts') : null;
    return saved ? JSON.parse(saved) : demoMode ? SEED_OUTREACH_DRAFTS : [];
  });

  // Credits
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>(() => {
    const saved = demoMode ? localStorage.getItem('jeneconk_bii_credit_tx') : null;
    return saved ? JSON.parse(saved) : demoMode ? INITIAL_CREDIT_TRANSACTIONS : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(SEED_AUDIT_LOGS);

  // UI States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompanyForDetail, setSelectedCompanyForDetail] = useState<Company | null>(null);
  const [selectedContactForDetail, setSelectedContactForDetail] = useState<Contact | null>(null);
  const [activeOutreachModalLead, setActiveOutreachModalLead] = useState<CrmLead | null>(null);

  // Ingestion & Privacy Modal States
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  // Calculate current credit balance from transaction ledger
  const [authoritativeCreditBalance, setAuthoritativeCreditBalance] = useState<number | null>(null);
  const creditBalance = !demoMode && authoritativeCreditBalance !== null
    ? authoritativeCreditBalance
    : creditTransactions.length > 0
    ? creditTransactions[creditTransactions.length - 1].balance_after
    : demoMode ? 1000 : 0;

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  // Set API client tenant context
  useEffect(() => {
    api.setTenantContext(activeTenantId, currentUser.display_name);
  }, [activeTenantId, currentUser]);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    const loadWorkspaceData = async () => {
      const results = await Promise.allSettled([
        api.getProfile(),
        api.getCompanies(),
        api.getContacts(),
        api.getProjects(),
        api.getTenders(),
        api.getCreditTransactions(),
        api.getCreditBalance(),
        api.getResearchDossiers(),
        api.getCrmLeads(),
        api.getTasks(),
        api.getActivities(),
        api.getOutreachDrafts(),
      ]);
      if (!active) return;

      const [profile, companyData, contactData, projectData, tenderData, creditData, balanceData, researchData, leadData, taskData, activityData, draftData] = results;
      if (profile.status === 'fulfilled' && profile.value) setBusinessProfile(profile.value);
      if (companyData.status === 'fulfilled') setCompanies(companyData.value);
      if (contactData.status === 'fulfilled') setContacts(contactData.value);
      if (projectData.status === 'fulfilled') setProjects(projectData.value);
      if (tenderData.status === 'fulfilled') setProcurementNotices(tenderData.value);
      if (creditData.status === 'fulfilled') setCreditTransactions(creditData.value);
      if (balanceData.status === 'fulfilled') setAuthoritativeCreditBalance(balanceData.value);
      if (researchData.status === 'fulfilled') setResearchJobs(researchData.value);
      if (leadData.status === 'fulfilled') setCrmLeads(leadData.value);
      if (taskData.status === 'fulfilled') setTasks(taskData.value);
      if (activityData.status === 'fulfilled') setActivities(activityData.value);
      if (draftData.status === 'fulfilled') setOutreachDrafts(draftData.value);

      const failures = results.filter((result) => result.status === 'rejected').length;
      if (failures) addToast('warning', 'Some workspace data could not load', `${failures} API requests failed. Check your connection and permissions.`);
    };
    void loadWorkspaceData();
    return () => { active = false; };
  }, [activeTenantId, demoMode]);

  // Sync to localStorage
  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_companies', JSON.stringify(companies));
  }, [companies, demoMode]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_contacts', JSON.stringify(contacts));
  }, [contacts, demoMode]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_crm_leads', JSON.stringify(crmLeads));
  }, [crmLeads, demoMode]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_tasks', JSON.stringify(tasks));
  }, [tasks, demoMode]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_activities', JSON.stringify(activities));
  }, [activities, demoMode]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_outreach_drafts', JSON.stringify(outreachDrafts));
  }, [outreachDrafts, demoMode]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_credit_tx', JSON.stringify(creditTransactions));
  }, [creditTransactions, demoMode]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('jeneconk_bii_profile', JSON.stringify(businessProfile));
  }, [businessProfile, demoMode]);

  const switchWorkspace = (tenantId: string) => {
    setActiveTenantId(tenantId);
    api.setTenantContext(tenantId, currentUser.display_name);
    const targetTenant = tenants.find((t) => t.id === tenantId);
    if (targetTenant) {
      if (targetTenant.industry_focus) {
        setActiveIndustry(targetTenant.industry_focus);
      }
      logAudit(
        'WORKSPACE_SWITCHED',
        'Tenant',
        tenantId,
        `User switched active workspace context to: ${targetTenant.name}`
      );
    }
  };

  const inviteMember = (email: string, role: RoleCode) => {
    if (!demoMode) {
      void api.inviteMember(activeTenant.id, email, role)
        .then((membership) => setMemberships((prev) => [...prev, membership]))
        .catch((error) => addToast('warning', 'Invitation unavailable', error instanceof Error ? error.message : 'Invitation delivery is not configured.'));
      return;
    }
    const newMembership: Membership = {
      id: `mem-${Date.now()}`,
      tenant_id: activeTenant.id,
      user_id: `user-inv-${Date.now()}`,
      user_name: email.split('@')[0],
      user_email: email,
      role,
      status: 'invited',
      joined_at: new Date().toISOString(),
    };
    setMemberships((prev) => [...prev, newMembership]);
    logAudit(
      'MEMBER_INVITED',
      'Membership',
      newMembership.id,
      `Invited ${email} with role '${role}' to ${activeTenant.name}`
    );
  };

  const logAudit = (action: string, resource_type: string, resource_id: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor_name: currentUser.display_name,
      action,
      resource_type,
      resource_id,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const saveCompany = (companyId: string) => {
    if (!demoMode) {
      addToast('warning', 'Company saving unavailable', 'Workspace-specific company lists are not connected yet.');
      return;
    }
    const comp = companies.find((c) => c.id === companyId);
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, is_saved: true } : c))
    );
    addToast('success', 'Company Saved', `${comp?.canonical_name || 'Company'} added to your workspace roster.`);
    logAudit('COMPANY_SAVED', 'Company', companyId, `Saved company ${companyId} to tenant workspace.`);
  };

  const unsaveCompany = (companyId: string) => {
    if (!demoMode) {
      addToast('warning', 'Company saving unavailable', 'Workspace-specific company lists are not connected yet.');
      return;
    }
    const comp = companies.find((c) => c.id === companyId);
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, is_saved: false } : c))
    );
    addToast('info', 'Company Removed', `${comp?.canonical_name || 'Company'} removed from saved roster.`);
  };

  const enrichCompany = async (companyId: string): Promise<boolean> => {
    if (!demoMode) {
      addToast('warning', 'Enrichment unavailable', 'A licensed company data provider is not connected. No credits were charged.');
      return false;
    }
    const cost = 2;
    if (creditBalance < cost) {
      alert(`Insufficient credits! This operation requires ${cost} credits. Current balance: ${creditBalance}`);
      return false;
    }

    const targetCompany = companies.find((c) => c.id === companyId);
    if (!targetCompany) return false;

    // Deduct credits with transaction record
    const newBalance = creditBalance - cost;
    const tx: CreditTransaction = {
      id: `tx-${Date.now()}`,
      tenant_id: activeTenant.id,
      transaction_type: 'capture',
      amount: -cost,
      balance_after: newBalance,
      description: `Enriched registry filings and verified contacts for ${targetCompany.canonical_name}`,
      reference_type: 'company_enrichment',
      reference_id: companyId,
      created_at: new Date().toISOString(),
    };
    setCreditTransactions((prev) => [...prev, tx]);

    // Update company last checked timestamp and evidence count
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              last_checked_at: new Date().toISOString(),
              primary_contacts_count: c.primary_contacts_count + 1,
            }
      : c
      )
    );

    logAudit(
      'COMPANY_ENRICHED',
      'Company',
      companyId,
      `Enriched company intelligence for ${targetCompany.canonical_name} (${cost} credits).`
    );

    addToast('success', 'Intelligence Enriched', `Filings & verified contacts updated for ${targetCompany.canonical_name}.`);

    return true;
  };

  const addCompanyToCrm = (companyId: string, stage: PipelineStage = 'discovered', contactId?: string): CrmLead => {
    const company = companies.find((c) => c.id === companyId);
    const contact = contacts.find((ct) => ct.id === contactId) || contacts.find((ct) => ct.company_id === companyId);

    // Check if already in CRM
    const existing = crmLeads.find((l) => l.company_id === companyId && l.tenant_id === activeTenant.id);
    if (existing) {
      if (stage !== existing.stage) {
        updateLeadStage(existing.id, stage);
      }
      return existing;
    }

    const newLead: CrmLead = {
      id: `lead-${Date.now()}`,
      tenant_id: activeTenant.id,
      company_id: companyId,
      company_name: company ? company.canonical_name : 'Unknown Company',
      contact_id: contact?.id,
      contact_name: contact?.full_name,
      contact_title: contact?.job_title,
      stage,
      fit_score: company?.fit_score || 80,
      estimated_deal_value_usd: company?.annual_revenue_band?.includes('B') ? 850000 : 150000,
      owner_user_name: currentUser.display_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      next_action_due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      next_action_description: 'Conduct initial discovery outreach and verify technical project requirements.',
      tags: [company?.company_type || 'Industrial', 'Pipeline Lead'],
      notes_count: 0,
      activities_count: 1,
    };

    setCrmLeads((prev) => [newLead, ...prev]);

    // Mark company as saved and update tenant CRM status
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, is_saved: true, tenant_crm_status: stage } : c))
    );

    // Initial activity log
    const act: Activity = {
      id: `act-${Date.now()}`,
      lead_id: newLead.id,
      activity_type: 'stage_change',
      subject: `Lead Created in Stage '${stage}'`,
      body: `Added ${company?.canonical_name} to CRM pipeline under owner ${currentUser.display_name}.`,
      occurred_at: new Date().toISOString(),
      created_by_user_name: currentUser.display_name,
    };
    setActivities((prev) => [act, ...prev]);

    addToast('success', 'Lead Added to Pipeline', `${company?.canonical_name || 'Opportunity'} entered stage '${stage.toUpperCase()}'.`);
    logAudit('LEAD_CREATED', 'CrmLead', newLead.id, `Created CRM lead for ${company?.canonical_name} in stage ${stage}`);

    return newLead;
  };

  const updateLeadStage = (leadId: string, stage: PipelineStage) => {
    setCrmLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage,
              updated_at: new Date().toISOString(),
              activities_count: l.activities_count + 1,
            }
          : l
      )
    );

    const targetLead = crmLeads.find((l) => l.id === leadId);
    if (targetLead) {
      const act: Activity = {
        id: `act-${Date.now()}`,
        lead_id: leadId,
        activity_type: 'stage_change',
        subject: `Stage updated to: ${stage.toUpperCase()}`,
        body: `Lead stage transitioned to '${stage}'. Pipeline velocity updated.`,
        occurred_at: new Date().toISOString(),
        created_by_user_name: currentUser.display_name,
      };
      setActivities((prev) => [act, ...prev]);

      // update company CRM status tag
      setCompanies((prev) =>
        prev.map((c) => (c.id === targetLead.company_id ? { ...c, tenant_crm_status: stage } : c))
      );

      addToast('success', 'Pipeline Velocity Advanced', `${targetLead.company_name} transitioned to ${stage.toUpperCase()}.`);
      logAudit('LEAD_STAGE_UPDATED', 'CrmLead', leadId, `Transitioned lead ${targetLead.company_name} to stage ${stage}`);
    }
  };

  const createTask = (leadId: string, title: string, dueAt: string, priority: 'low' | 'medium' | 'high') => {
    const lead = crmLeads.find((l) => l.id === leadId);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      lead_id: leadId,
      company_name: lead ? lead.company_name : 'General Task',
      title,
      due_at: dueAt,
      status: 'pending',
      priority,
      assigned_to_user_name: currentUser.display_name,
    };
    setTasks((prev) => [newTask, ...prev]);
    addToast('info', 'Task Scheduled', `Created task for ${newTask.company_name}`);
    logAudit('TASK_CREATED', 'Task', newTask.id, `Created task: "${title}" for ${newTask.company_name}`);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = t.status === 'completed' ? 'pending' : 'completed';
          if (newStatus === 'completed') {
            addToast('success', 'Task Completed!', `Great job: "${t.title}" is done.`);
          }
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const logActivity = (leadId: string, type: 'call' | 'meeting' | 'email' | 'research_note', subject: string, body: string) => {
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      lead_id: leadId,
      activity_type: type,
      subject,
      body,
      occurred_at: new Date().toISOString(),
      created_by_user_name: currentUser.display_name,
    };
    setActivities((prev) => [newAct, ...prev]);
    setCrmLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, activities_count: l.activities_count + 1 } : l))
    );
    logAudit('ACTIVITY_LOGGED', 'Activity', newAct.id, `Logged ${type} activity for lead ${leadId}`);
  };

  const runResearchJob = async (
    subjectType: 'company' | 'contact' | 'opportunity' | 'market_topic',
    subjectId: string,
    subjectName: string,
    prompt: string,
    sources: string[],
    onProgress?: (progressPct: number, status: string) => void
  ): Promise<ResearchJob> => {
    const cost = 5;
    onProgress?.(0, 'Checking workspace credits...');
    const serverBalance = await api.getCreditBalance();
    setAuthoritativeCreditBalance(serverBalance);
    setCreditTransactions(await api.getCreditTransactions());
    if (serverBalance < cost) {
      throw new Error(`Insufficient credits. Required: ${cost}, Available: ${serverBalance}`);
    }

    onProgress?.(5, 'Submitting research job...');
    const accepted = await api.startResearchJob({
      subject_name: subjectName,
      subject_type: subjectType,
      question: prompt,
      industry: activeIndustry === 'all' ? 'General Industry' : activeIndustry,
      offerings: businessProfile.offerings,
      sources,
      subject_id: subjectId,
    });

    const queuedJob: ResearchJob = {
      id: accepted.job_id,
      tenant_id: activeTenant.id,
      subject_type: subjectType,
      subject_id: subjectId,
      subject_name: subjectName,
      research_question: prompt,
      scope_sources: sources,
      status: 'queued',
      credit_cost: accepted.credit_reserved,
      created_at: new Date().toISOString(),
    };
    setResearchJobs((prev) => [queuedJob, ...prev.filter((job) => job.id !== queuedJob.id)]);
    setAuthoritativeCreditBalance((balance) => balance === null ? null : balance - accepted.credit_reserved);

    try {
      setCreditTransactions(await api.getCreditTransactions());
      setAuthoritativeCreditBalance(await api.getCreditBalance());
      const result = await api.pollJobUntilComplete(accepted.job_id, (progress, status) => {
        onProgress?.(progress, status === 'running' ? 'AI analysis is running...' : 'Waiting for the research worker...');
      });
      const completedJob: ResearchJob = {
        ...queuedJob,
        status: 'completed',
        completed_at: new Date().toISOString(),
        result,
      };
      setResearchJobs((prev) => prev.map((job) => job.id === completedJob.id ? completedJob : job));
      setCreditTransactions(await api.getCreditTransactions());
      setAuthoritativeCreditBalance(await api.getCreditBalance());
      logAudit('AI_RESEARCH_COMPLETED', 'ResearchJob', accepted.job_id, `Completed AI-assisted analysis for ${subjectName}.`);
      return completedJob;
    } catch (error) {
      let status: ResearchJob['status'] = 'failed';
      try {
        const serverJob = await api.getJobStatus(accepted.job_id);
        if (serverJob.status === 'queued' || serverJob.status === 'running') {
          status = serverJob.status;
        }
      } catch {
        // Keep the last known status if the server cannot be reached.
      }
      const interruptedJob: ResearchJob = { ...queuedJob, status };
      setResearchJobs((prev) => prev.map((job) => job.id === interruptedJob.id ? interruptedJob : job));
      setCreditTransactions(await api.getCreditTransactions());
      throw error;
    }
  };
  const generateOutreachDraft = (leadId: string, contactId: string, purpose?: string): OutreachDraft => {
    const lead = crmLeads.find((l) => l.id === leadId);
    const contact = contacts.find((c) => c.id === contactId);
    const company = companies.find((c) => c.id === lead?.company_id);

    const isOAG = company?.industry_id === 'oil_and_gas';
    const recipientName = contact ? contact.full_name : 'Executive Director';
    const recipientEmail = contact?.channels.find((ch) => ch.channel_type === 'work_email')?.value || 'contact@example.com';

    const subject = isOAG
      ? `NipeX JQS Category 3.01.05 Subsea Inspection & Asset Integrity Support — Jeneconk`
      : `Accredited Modular STEM Science Apparatus & Faculty Training — Jeneconk`;

    const body = isOAG
      ? `Dear ${recipientName},

I am writing on behalf of Jeneconk Integrated Global Solutions Limited regarding your upcoming asset integrity and turnaround inspection requirements for ${company?.canonical_name}.

Our engineering team holds active NIPEX JQS Category 3.01.05 and 3.01.08 registrations alongside ISO 9001:2015 quality accreditation. We provide phased-array ultrasonic wall-thickness mapping and weld integrity verification tailored to West African marine terminals.

Given ${company?.canonical_name}'s focus on operational uptime, we would appreciate the opportunity to share our technical methodology and discuss how our in-country certified teams can support your upcoming maintenance campaign.

Respectfully yours,
${currentUser.display_name}
${businessProfile.company_name}`
      : `Dear ${recipientName},

In recognition of ${company?.canonical_name}'s dedication to academic excellence and modern instructional technology, Jeneconk would like to introduce our accredited secondary STEM laboratory kits.

Built specifically to align with British, IB, and WAEC practical curricula, our hands-on apparatus bundles modular physics, chemistry, and robotics experiments with comprehensive teacher CPD guides and digitized lesson notes.

We would be delighted to deliver a sample kit to your administrative offices for your academic team to review firsthand.

Warm regards,
${currentUser.display_name}
${businessProfile.company_name}`;

    const newDraft: OutreachDraft = {
      id: `draft-${Date.now()}`,
      tenant_id: activeTenant.id,
      lead_id: leadId,
      company_name: company?.canonical_name || 'Prospect Company',
      contact_id: contactId,
      contact_name: recipientName,
      contact_email: recipientEmail,
      channel: 'email',
      subject,
      body,
      evidence_citations: [
        {
          claim: isOAG
            ? 'Active pre-qualification requirements under NipeX guidelines.'
            : 'Accredited STEM laboratory practical curriculum requirements.',
          source: 'Verified portal registry (Audited 2026)',
        },
      ],
      unknown_warnings: isOAG
        ? ['Offshore accommodation logistics on site must be confirmed with field logistics.']
        : ['Delivery lead time for bulk orders above 50 classroom units is 14 business days.'],
      suppression_verified: true,
      status: 'draft',
    };

    setOutreachDrafts((prev) => [newDraft, ...prev]);
    logAudit('OUTREACH_DRAFT_CREATED', 'OutreachDraft', newDraft.id, `Created outreach draft for ${recipientName} (${company?.canonical_name})`);

    return newDraft;
  };

  const approveOutreachDraft = (draftId: string) => {
    setOutreachDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? {
              ...d,
              status: 'approved',
              approved_by: currentUser.display_name,
              approved_at: new Date().toISOString(),
            }
          : d
      )
    );
    logAudit('OUTREACH_DRAFT_APPROVED', 'OutreachDraft', draftId, `Human approval granted for draft ${draftId}.`);
  };

  const sendOutreachDraft = async (draftId: string): Promise<boolean> => {
    if (!demoMode) {
      addToast('warning', 'Email delivery unavailable', 'No email provider is connected. The draft was not sent.');
      return false;
    }
    const draft = outreachDrafts.find((d) => d.id === draftId);
    if (!draft) return false;
    if (draft.status !== 'approved') {
      alert('Draft must be approved by an authorized user before sending.');
      return false;
    }

    // Check suppression list again immediately prior to send per requirement
    const contact = contacts.find((c) => c.id === draft.contact_id);
    if (contact?.is_suppressed) {
      alert(`Outreach blocked: Contact ${contact.full_name} is marked as suppressed.`);
      return false;
    }

    setOutreachDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? {
              ...d,
              status: 'sent',
              sent_at: new Date().toISOString(),
            }
          : d
      )
    );

    // Record activity in CRM
    const act: Activity = {
      id: `act-${Date.now()}`,
      lead_id: draft.lead_id,
      activity_type: 'email',
      subject: `Outreach Sent: ${draft.subject}`,
      body: `Approved email successfully dispatched to ${draft.contact_name} (${draft.contact_email}).`,
      occurred_at: new Date().toISOString(),
      created_by_user_name: currentUser.display_name,
    };
    setActivities((prev) => [act, ...prev]);

    logAudit('OUTREACH_DISPATCHED', 'OutreachDraft', draftId, `Dispatched approved outreach to ${draft.contact_email}`);
    return true;
  };

  const updateBusinessProfile = (profileUpdate: Partial<BusinessProfile>) => {
    setBusinessProfile((prev) => ({
      ...prev,
      ...profileUpdate,
      version: prev.version + 1,
      updated_at: new Date().toISOString(),
    }));
    logAudit('BUSINESS_PROFILE_UPDATED', 'BusinessProfile', businessProfile.id, 'Updated profile and offerings.');
  };

  const updateScoringWeights = (weights: ScoringWeights) => {
    setBusinessProfile((prev) => ({
      ...prev,
      scoring_weights: weights,
      version: prev.version + 1,
      updated_at: new Date().toISOString(),
    }));

    // Recalculate company fit scores dynamically
    setCompanies((prev) =>
      prev.map((c) => {
        const total =
          (weights.service_compatibility * (c.fit_breakdown.service_compatibility / 25)) +
          (weights.project_relevance * (c.fit_breakdown.project_relevance / 25)) +
          (weights.procurement_timing * (c.fit_breakdown.procurement_timing / 15)) +
          (weights.geographic_suitability * (c.fit_breakdown.geographic_suitability / 10)) +
          (weights.decision_maker_availability * (c.fit_breakdown.decision_maker_availability / 10)) +
          (weights.commercial_activity * (c.fit_breakdown.commercial_activity / 15));

        const clamped = Math.min(100, Math.max(40, Math.round(total)));
        return {
          ...c,
          fit_score: clamped,
        };
      })
    );

    logAudit('SCORING_WEIGHTS_UPDATED', 'ScoringConfig', 'weights', 'Updated scoring weight distribution and recalculated lead scores.');
  };

  const topUpCredits = (amount: number, note: string) => {
    if (!demoMode) {
      addToast('warning', 'Credit purchases unavailable', 'Payment processing is not connected for this workspace.');
      return;
    }
    const newBal = creditBalance + amount;
    const tx: CreditTransaction = {
      id: `tx-${Date.now()}`,
      tenant_id: activeTenant.id,
      transaction_type: 'top_up',
      amount,
      balance_after: newBal,
      description: `Manual credit top-up: ${note}`,
      reference_type: 'top_up_purchase',
      created_at: new Date().toISOString(),
    };
    setCreditTransactions((prev) => [...prev, tx]);
    addToast('success', 'Credits Deposited', `+${amount} credits deposited. New balance: ${newBal}`);
    logAudit('CREDIT_TOP_UP', 'CreditAccount', activeTenant.id, `Topped up ${amount} credits. New balance: ${newBal}`);
  };

  const submitTenderIntake = async (tenderData: Partial<ProcurementNotice>): Promise<void> => {
    try {
      const res = await api.submitTenderIntake(tenderData);
      setProcurementNotices((prev) => [res, ...prev]);
      addToast('success', 'Tender Notice Published', `Verified notice ${res.notice_reference} ingested into workspace.`);
      logAudit('TENDER_INTAKE_SUBMITTED', 'ProcurementNotice', res.id, `Analyst curated tender intake: ${res.title}`);
    } catch (error) {
      if (!demoMode) {
        addToast('error', 'Tender intake unavailable', error instanceof Error ? error.message : 'Curator intake is not configured.');
        return;
      }
      // Local fallback
      const fallback: ProcurementNotice = {
        id: `tender-${Date.now()}`,
        notice_reference: tenderData.notice_reference || 'NIPEX-MANUAL-INTAKE',
        title: tenderData.title || 'Untitled Notice',
        buyer_company_id: tenderData.buyer_company_id || 'comp-misc',
        buyer_name: tenderData.buyer_name || 'Procuring Entity',
        industry_id: tenderData.industry_id || 'oil_and_gas',
        procurement_category: tenderData.procurement_category || 'General Procurement',
        published_at: new Date().toISOString(),
        deadline_at: tenderData.deadline_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: tenderData.status || 'open',
        scope_summary: tenderData.scope_summary || '',
        eligibility_summary: tenderData.eligibility_summary || '',
        estimated_budget_usd: tenderData.estimated_budget_usd,
        source_portal: tenderData.source_portal || 'NipeX Portal',
        source_url: tenderData.source_url || 'https://nipex-ng.com/tenders',
        is_monitored: true,
      };
      setProcurementNotices((prev) => [fallback, ...prev]);
      addToast('success', 'Curated Notice Published', `Notice ${fallback.notice_reference} added to workspace.`);
      logAudit('TENDER_INTAKE_FALLBACK', 'ProcurementNotice', fallback.id, `Published curated tender notice: ${fallback.title}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTenant,
        tenants,
        currentUser,
        memberships,
        signOut: onSignOut || (() => undefined),
        isDemoMode: demoMode,
        switchWorkspace,
        inviteMember,

        activeIndustry,
        setActiveIndustry,
        businessProfile,
        updateBusinessProfile,
        updateScoringWeights,

        companies,
        contacts,
        projects,
        procurementNotices,
        savedSearches,
        leadLists,

        saveCompany,
        unsaveCompany,
        enrichCompany,

        researchJobs,
        runResearchJob,

        crmLeads,
        addCompanyToCrm,
        updateLeadStage,
        tasks,
        createTask,
        toggleTaskStatus,
        activities,
        logActivity,

        outreachDrafts,
        generateOutreachDraft,
        approveOutreachDraft,
        sendOutreachDraft,

        creditBalance,
        creditTransactions,
        topUpCredits,

        auditLogs,

        searchQuery,
        setSearchQuery,
        selectedCompanyForDetail,
        setSelectedCompanyForDetail,
        selectedContactForDetail,
        setSelectedContactForDetail,
        activeOutreachModalLead,
        setActiveOutreachModalLead,

        isIntakeModalOpen,
        setIsIntakeModalOpen,
        isPrivacyModalOpen,
        setIsPrivacyModalOpen,
        submitTenderIntake,

        toasts,
        addToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
