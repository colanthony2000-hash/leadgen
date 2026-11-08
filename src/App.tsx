import React, { lazy, Suspense, useState } from 'react';
import { useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar, NavItemKey } from './components/layout/AppSidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { Company, Contact, CrmLead, OutreachDraft } from './types';

const AuthGate = lazy(() => import('./components/auth/AuthGate').then((module) => ({ default: module.AuthGate })));
const OverviewDashboard = lazy(() => import('./components/overview/OverviewDashboard').then((module) => ({ default: module.OverviewDashboard })));
const CompanyDiscovery = lazy(() => import('./components/discover/CompanyDiscovery').then((module) => ({ default: module.CompanyDiscovery })));
const CompanyDetailDrawer = lazy(() => import('./components/discover/CompanyDetailDrawer').then((module) => ({ default: module.CompanyDetailDrawer })));
const ContactDiscovery = lazy(() => import('./components/discover/ContactDiscovery').then((module) => ({ default: module.ContactDiscovery })));
const ProjectsAndTenders = lazy(() => import('./components/discover/ProjectsAndTenders').then((module) => ({ default: module.ProjectsAndTenders })));
const AiResearchWorkspace = lazy(() => import('./components/research/AiResearchWorkspace').then((module) => ({ default: module.AiResearchWorkspace })));
const ResearchHistory = lazy(() => import('./components/research/ResearchHistory').then((module) => ({ default: module.ResearchHistory })));
const CrmPipelineView = lazy(() => import('./components/crm/CrmPipelineView').then((module) => ({ default: module.CrmPipelineView })));
const LeadListsView = lazy(() => import('./components/crm/LeadListsView').then((module) => ({ default: module.LeadListsView })));
const OutreachApprovalModal = lazy(() => import('./components/crm/OutreachApprovalModal').then((module) => ({ default: module.OutreachApprovalModal })));
const SavedSearchesView = lazy(() => import('./components/monitoring/SavedSearchesView').then((module) => ({ default: module.SavedSearchesView })));
const BusinessProfileView = lazy(() => import('./components/profile/BusinessProfileView').then((module) => ({ default: module.BusinessProfileView })));
const WorkspaceMembersView = lazy(() => import('./components/workspace/WorkspaceMembersView').then((module) => ({ default: module.WorkspaceMembersView })));
const IntegrationsView = lazy(() => import('./components/workspace/IntegrationsView').then((module) => ({ default: module.IntegrationsView })));
const UsageCreditsView = lazy(() => import('./components/workspace/UsageCreditsView').then((module) => ({ default: module.UsageCreditsView })));
const PlatformAdminConsole = lazy(() => import('./components/admin/PlatformAdminConsole').then((module) => ({ default: module.PlatformAdminConsole })));
const TenderIntakeModal = lazy(() => import('./components/curation/TenderIntakeModal').then((module) => ({ default: module.TenderIntakeModal })));
const DataPrivacyModal = lazy(() => import('./components/privacy/DataPrivacyModal').then((module) => ({ default: module.DataPrivacyModal })));

function MainApp() {
  const [currentView, setCurrentView] = useState<NavItemKey>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [researchSubject, setResearchSubject] = useState<{
    type: 'company' | 'contact' | 'opportunity' | 'market_topic';
    id: string;
    name: string;
  } | undefined>(undefined);

  const [activeOutreachDraft, setActiveOutreachDraft] = useState<OutreachDraft | null>(null);

  const {
    selectedCompanyForDetail,
    setSelectedCompanyForDetail,
    companies,
    generateOutreachDraft,
    crmLeads,
    addCompanyToCrm,
    contacts,
    isIntakeModalOpen,
    setIsIntakeModalOpen,
    isPrivacyModalOpen,
    setIsPrivacyModalOpen,
    submitTenderIntake,
    toasts,
    dismissToast,
    signOut,
  } = useApp();

  const handleOpenResearchForCompany = (comp: Company) => {
    setResearchSubject({
      type: 'company',
      id: comp.id,
      name: comp.canonical_name,
    });
    setCurrentView('research');
  };

  const handleOpenResearchForSubject = (
    type: 'opportunity' | 'company',
    id: string,
    name: string
  ) => {
    setResearchSubject({ type, id, name });
    setCurrentView('research');
  };

  const handleDraftOutreachForContact = (contact: Contact) => {
    // Ensure company is in CRM
    const lead = addCompanyToCrm(contact.company_id, 'contacted', contact.id);
    const draft = generateOutreachDraft(lead.id, contact.id);
    setActiveOutreachDraft(draft);
  };

  const handleDraftOutreachForLead = (lead: CrmLead) => {
    const contact = contacts.find((c) => c.id === lead.contact_id) || contacts.find((c) => c.company_id === lead.company_id);
    if (contact) {
      const draft = generateOutreachDraft(lead.id, contact.id);
      setActiveOutreachDraft(draft);
    } else {
      alert(`No verified contact attached to ${lead.company_name} yet. Enrich company first.`);
    }
  };

  const handleOpenCompanyFromAnywhere = (companyId: string) => {
    const found = companies.find((c) => c.id === companyId);
    if (found) {
      setSelectedCompanyForDetail(found);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Global Application Header */}
      <AppHeader
        currentView={currentView}
        onOpenScoring={() => setCurrentView('scoring')}
        onOpenResearch={() => {
          setResearchSubject(undefined);
          setCurrentView('research');
        }}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onSignOut={signOut}
      />

      <div className="flex-1 min-w-0 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <AppSidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setIsMobileSidebarOpen(false);
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Main Viewport with mobile padding */}
        <main className="flex-1 min-w-0 w-full overflow-y-auto bg-slate-950/80 pb-20 md:pb-0">
          <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading workspace section…</div>}>
          {currentView === 'overview' && (
            <OverviewDashboard onNavigate={(view) => setCurrentView(view)} />
          )}

          {currentView === 'companies' && (
            <CompanyDiscovery
              onOpenResearchForCompany={handleOpenResearchForCompany}
            />
          )}

          {currentView === 'contacts' && (
            <ContactDiscovery
              onDraftOutreach={handleDraftOutreachForContact}
              onOpenCompany={handleOpenCompanyFromAnywhere}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsAndTenders
              initialTab="projects"
              onOpenResearchForSubject={handleOpenResearchForSubject}
              onOpenCompany={handleOpenCompanyFromAnywhere}
            />
          )}

          {currentView === 'tenders' && (
            <ProjectsAndTenders
              initialTab="tenders"
              onOpenResearchForSubject={handleOpenResearchForSubject}
              onOpenCompany={handleOpenCompanyFromAnywhere}
            />
          )}

          {currentView === 'research' && (
            <AiResearchWorkspace
              initialSubject={researchSubject}
              onDraftOutreachFromResearch={(companyName) => {
                const comp = companies.find((c) => c.canonical_name.toLowerCase().includes(companyName.toLowerCase()));
                if (comp) {
                  const cont = contacts.find((ct) => ct.company_id === comp.id);
                  if (cont) handleDraftOutreachForContact(cont);
                }
              }}
            />
          )}

          {currentView === 'research_history' && <ResearchHistory />}

          {currentView === 'pipeline' && (
            <CrmPipelineView
              onDraftOutreachForLead={handleDraftOutreachForLead}
              onOpenCompany={handleOpenCompanyFromAnywhere}
            />
          )}

          {currentView === 'lead_lists' && (
            <LeadListsView onOpenCompany={handleOpenCompanyFromAnywhere} />
          )}

          {currentView === 'tasks' && (
            <OverviewDashboard onNavigate={(view) => setCurrentView(view)} />
          )}

          {currentView === 'outreach' && (
            <CrmPipelineView
              onDraftOutreachForLead={handleDraftOutreachForLead}
              onOpenCompany={handleOpenCompanyFromAnywhere}
            />
          )}

          {currentView === 'monitoring' && <SavedSearchesView />}

          {(currentView === 'profile' || currentView === 'scoring') && (
            <BusinessProfileView />
          )}

          {currentView === 'members' && <WorkspaceMembersView />}

          {currentView === 'integrations' && <IntegrationsView />}

          {currentView === 'credits' && <UsageCreditsView />}

          {currentView === 'admin' && <PlatformAdminConsole />}
          </Suspense>
        </main>
      </div>

      {/* Global Drawers & Modals */}
      {selectedCompanyForDetail && <Suspense fallback={null}><CompanyDetailDrawer
        company={selectedCompanyForDetail}
        onClose={() => setSelectedCompanyForDetail(null)}
        onOpenResearch={(comp) => {
          setSelectedCompanyForDetail(null);
          handleOpenResearchForCompany(comp);
        }}
        onDraftOutreach={(contact) => {
          setSelectedCompanyForDetail(null);
          handleDraftOutreachForContact(contact);
        }}
      /></Suspense>}

      {activeOutreachDraft && <Suspense fallback={null}><OutreachApprovalModal
        draft={activeOutreachDraft}
        onClose={() => setActiveOutreachDraft(null)}
      /></Suspense>}

      {/* Analyst Tender Ingestion Modal */}
      {isIntakeModalOpen && <Suspense fallback={null}><TenderIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onSubmit={submitTenderIntake}
      /></Suspense>}

      {/* NDPA 2023 Cryptographic Suppression & Privacy Modal */}
      {isPrivacyModalOpen && <Suspense fallback={null}><DataPrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      /></Suspense>}

      {/* Mobile Bottom Navigation Bar (Smartphones & Touch Devices) */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMobileSidebarOpen(false);
        }}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* Interactive Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">Loading secure workspace…</main>}>
      <AuthGate>
        <MainApp />
      </AuthGate>
    </Suspense>
  );
}
