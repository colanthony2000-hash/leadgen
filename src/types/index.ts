/**
 * Jeneconk BII (Business & Industrial Intelligence)
 * Domain Entity Definitions & Types
 * Conforms to Database Design Document v1.0 & SAD v1.0
 */

export type WorkspaceType = 'company' | 'personal';

export type RoleCode = 'owner' | 'admin' | 'manager' | 'member' | 'read_only';

export type IndustryCode = 'oil_and_gas' | 'education' | 'digital_products' | 'faith_based' | 'private_sector';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tenant_type: WorkspaceType;
  owner_user_id: string;
  status: 'active' | 'suspended';
  created_at: string;
  industry_focus: IndustryCode;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: RoleCode;
  status: 'active' | 'invited';
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: RoleCode;
  status: 'active' | 'invited';
  joined_at: string;
}

export interface BusinessOffering {
  id: string;
  offering_type: 'product' | 'service' | 'capability';
  name: string;
  description: string;
  category_code: string;
  target_industry: IndustryCode;
  source_url?: string;
}

export interface BusinessCertification {
  id: string;
  name: string;
  issuer: string;
  valid_from: string;
  valid_to: string;
  evidence_url?: string;
}

export interface ResearchSource {
  title: string;
  url: string;
}

export interface BusinessProspectMatch {
  id: string;
  company_name: string;
  website: string;
  industry_id: IndustryCode;
  company_type: string;
  location: string;
  description: string;
  match_reason: string;
  matched_offerings: string[];
  employee_band?: string;
  employee_size_confidence?: 'sourced' | 'estimated' | 'unknown';
  sources: ResearchSource[];
  discovered_at: string;
  approved_at?: string;
}

export interface BusinessProfileResearchDraft {
  company_name: string;
  website: string;
  service_websites: string[];
  country_code: string;
  business_summary: string;
  target_regions: string[];
  target_industries: IndustryCode[];
  target_customer_types: string[];
  offerings: BusinessOffering[];
  certifications: BusinessCertification[];
  sources: ResearchSource[];
}

export interface CompanyProfile {
  id: string;
  company_name: string;
  website: string;
  service_websites?: string[];
  country_code: string;
  business_summary: string;
  target_regions: string[];
  target_industries: IndustryCode[];
  target_customer_types?: string[];
  offerings: BusinessOffering[];
  certifications: BusinessCertification[];
  profile_sources: ResearchSource[];
  profile_approved_at: string;
  approved_prospects: BusinessProspectMatch[];
  updated_at: string;
}

export interface CompanySearchInput {
  company_name?: string;
  category?: string;
  location?: string;
  employee_band?: string;
}

export interface CompanyResearchRecord extends BusinessProfileResearchDraft {
  id: string;
  researched_name: string;
  researched_at: string;
}

export interface ScoringWeights {
  service_compatibility: number;     // e.g. 25
  project_relevance: number;         // e.g. 25
  procurement_timing: number;        // e.g. 15
  geographic_suitability: number;    // e.g. 10
  decision_maker_availability: number;// e.g. 10
  commercial_activity: number;       // e.g. 15
}

export interface BusinessProfile {
  id: string;
  tenant_id: string;
  company_name: string;
  website: string;
  service_websites?: string[];
  country_code: string;
  business_summary: string;
  target_regions: string[];
  target_industries: IndustryCode[];
  target_customer_types?: string[];
  offerings: BusinessOffering[];
  certifications: BusinessCertification[];
  profile_sources?: ResearchSource[];
  profile_approved_at?: string;
  approved_prospects?: BusinessProspectMatch[];
  company_profiles?: CompanyProfile[];
  company_research_records?: CompanyResearchRecord[];
  scoring_weights: ScoringWeights;
  version: number;
  updated_at: string;
}

export type RecordStatus = 'active' | 'pending_verification' | 'archived';
export type ConfidenceLevel = 'verified' | 'high' | 'medium' | 'unverified_inference';
export type VerificationStatus = 'verified' | 'unverified' | 'stale' | 'bounced';
export type ChannelType = 'work_email' | 'work_phone' | 'linkedin' | 'direct_portal';

export interface EvidenceItem {
  id: string;
  claim_type: 'project_involvement' | 'procurement_role' | 'revenue_signal' | 'technology_stack' | 'accreditation' | 'leadership_appointment';
  claim_text: string;
  source_name: string;
  source_url: string;
  source_type: 'official_registry' | 'procurement_portal' | 'company_site' | 'licensed_feed' | 'verified_news';
  retrieved_at: string;
  confidence: ConfidenceLevel;
  confidence_score: number; // 0 - 100
  supporting_excerpt: string;
  licence_class: 'SHARED_PERMITTED' | 'TENANT_RESTRICTED' | 'PROVIDER_RESTRICTED';
}

export interface CompanyLocation {
  city: string;
  region: string;
  country: string;
  country_code: string;
  address_text?: string;
}

export interface ContactChannel {
  id: string;
  channel_type: ChannelType;
  value: string;
  verification_status: VerificationStatus;
  verified_at?: string;
  permitted_use: 'direct_b2b_outreach' | 'regulatory_notices' | 'public_inquiry';
  retention_until?: string;
}

export interface Contact {
  id: string;
  company_id: string;
  company_name: string;
  full_name: string;
  job_title: string;
  role_category: 'c_suite' | 'procurement_supply_chain' | 'engineering_operations' | 'academic_director' | 'ict_administration';
  seniority: 'executive' | 'director' | 'manager' | 'specialist';
  department: string;
  channels: ContactChannel[];
  is_suppressed: boolean;
  suppression_reason?: string;
  record_status: RecordStatus;
  confidence: ConfidenceLevel;
  evidence_count: number;
}

export interface Company {
  id: string;
  canonical_name: string;
  normalised_name: string;
  industry_id: IndustryCode;
  company_type: string; // e.g. "Operator", "EPC Contractor", "School Network", "University", "Oilfield Services"
  website_domain: string;
  description: string;
  location: CompanyLocation;
  employee_band: '1-50' | '51-200' | '201-1000' | '1000-5000' | '5000+';
  annual_revenue_band?: string;
  fit_score: number; // 0 - 100 calculated
  fit_breakdown: {
    service_compatibility: number;
    project_relevance: number;
    procurement_timing: number;
    geographic_suitability: number;
    decision_maker_availability: number;
    commercial_activity: number;
    rationale: string;
  };
  evidence_items: EvidenceItem[];
  matched_offerings: string[];
  gap_analysis: string[];
  primary_contacts_count: number;
  open_opportunities_count: number;
  last_checked_at: string;
  source_licence: 'SHARED_PERMITTED' | 'PROVIDER_RESTRICTED';
  is_saved: boolean;
  tenant_crm_status?: 'discovered' | 'qualified' | 'contacted' | 'opportunity' | 'won' | 'lost';
}

export interface Project {
  id: string;
  canonical_title: string;
  description: string;
  industry_id: IndustryCode;
  project_type: string;
  location: string;
  country_code: string;
  status: 'announced' | 'tender_in_progress' | 'under_construction' | 'operational' | 'upgrading';
  announced_at: string;
  expected_completion_at?: string;
  estimated_value_usd?: number;
  value_confidence: 'contract_verified' | 'regulatory_filing' | 'estimated_range' | 'unknown';
  operator_company: {
    id: string;
    name: string;
  };
  linked_companies: Array<{
    id: string;
    name: string;
    relationship_type: 'operator' | 'epc_contractor' | 'subcontractor' | 'technology_partner' | 'consultant';
  }>;
  source_evidence: EvidenceItem[];
}

export interface ProcurementNotice {
  id: string;
  notice_reference: string;
  title: string;
  buyer_company_id: string;
  buyer_name: string;
  industry_id: IndustryCode;
  procurement_category: string;
  published_at: string;
  deadline_at: string;
  status: 'open' | 'extended' | 'closed' | 'awarded';
  scope_summary: string;
  eligibility_summary: string;
  estimated_budget_usd?: number;
  source_portal: 'NipeX Portal' | 'Federal Tenders Journal' | 'Public Procurement Bureau' | 'Corporate Supplier Portal';
  source_url: string;
  is_monitored: boolean;
}

export interface ResearchJob {
  id: string;
  tenant_id: string;
  subject_type: 'company' | 'contact' | 'opportunity' | 'market_topic';
  subject_id: string;
  subject_name: string;
  research_question: string;
  scope_sources: string[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  credit_cost: number;
  created_at: string;
  completed_at?: string;
  result?: {
    executive_summary: string;
    strategic_fit_analysis: string;
    procurement_signals: string[];
    key_decision_makers: Array<{
      name: string;
      title: string;
      relevance: string;
    }>;
    known_facts: Array<{
      claim: string;
      source_name: string;
      source_url: string;
      sources?: Array<{ source_name: string; source_url: string }>;
      confidence: ConfidenceLevel;
    }>;
    search_queries?: string[];
    critical_unknowns: string[]; // Essential anti-hallucination requirement
    recommended_outreach_angle: string;
  };
}

export type PipelineStage = 'discovered' | 'qualified' | 'contacted' | 'opportunity' | 'won' | 'lost';

export interface CrmLead {
  id: string;
  tenant_id: string;
  company_id: string;
  company_name: string;
  contact_id?: string;
  contact_name?: string;
  contact_title?: string;
  opportunity_id?: string;
  opportunity_title?: string;
  stage: PipelineStage;
  fit_score: number;
  estimated_deal_value_usd?: number;
  owner_user_name: string;
  created_at: string;
  updated_at: string;
  next_action_due?: string;
  next_action_description?: string;
  tags: string[];
  notes_count: number;
  activities_count: number;
}

export interface Activity {
  id: string;
  lead_id: string;
  activity_type: 'call' | 'meeting' | 'email' | 'research_note' | 'stage_change';
  subject: string;
  body: string;
  occurred_at: string;
  created_by_user_name: string;
}

export interface Task {
  id: string;
  lead_id: string;
  company_name: string;
  title: string;
  due_at: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  assigned_to_user_name: string;
}

export interface OutreachDraft {
  id: string;
  tenant_id: string;
  lead_id: string;
  company_name: string;
  contact_id: string;
  contact_name: string;
  contact_email: string;
  channel: 'email' | 'linkedin';
  subject: string;
  body: string;
  evidence_citations: Array<{
    claim: string;
    source: string;
  }>;
  unknown_warnings: string[];
  suppression_verified: boolean;
  status: 'draft' | 'approved' | 'sent' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
}

export interface CreditTransaction {
  id: string;
  tenant_id: string;
  transaction_type: 'grant' | 'reservation' | 'capture' | 'release' | 'top_up';
  amount: number; // positive for credits added, negative for deducted
  balance_after: number;
  description: string;
  reference_type: 'ai_research' | 'company_enrichment' | 'email_verification' | 'monthly_plan' | 'top_up_purchase';
  reference_id?: string;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query_summary: string;
  filters: Record<string, string | number | boolean>;
  frequency: 'daily' | 'weekly' | 'real_time';
  is_active: boolean;
  last_run_at: string;
  new_matches_count: number;
}

export interface LeadList {
  id: string;
  name: string;
  description: string;
  industry: IndustryCode;
  company_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
}

