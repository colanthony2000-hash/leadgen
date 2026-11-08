import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar, NavItemKey } from './components/layout/AppSidebar';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { CompanyDiscovery } from './components/discover/CompanyDiscovery';
import { CompanyDetailDrawer } from './components/discover/CompanyDetailDrawer';
import { ContactDiscovery } from './components/discover/ContactDiscovery';
import { ProjectsAndTenders } from './components/discover/ProjectsAndTenders';
import { AiResearchWorkspace } from './components/research/AiResearchWorkspace';
import { ResearchHistory } from './components/research/ResearchHistory';
import { CrmPipelineView } from './components/crm/CrmPipelineView';
import { LeadListsView } from './components/crm/LeadListsView';
import { OutreachApprovalModal } from './components/crm/OutreachApprovalModal';
import { SavedSearchesView } from './components/monitoring/SavedSearchesView';
import { BusinessProfileView } from './components/profile/BusinessProfileView';
import { WorkspaceMembersView } from './components/workspace/WorkspaceMembersView';
import { IntegrationsView } from './components/workspace/IntegrationsView';
import { UsageCreditsView } from './components/workspace/UsageCreditsView';
import { PlatformAdminConsole } from './components/admin/PlatformAdminConsole';
import { TenderIntakeModal } from './components/curation/TenderIntakeModal';
import { DataPrivacyModal } from './components/privacy/DataPrivacyModal';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { Company, Contact, CrmLead, OutreachDraft } from './types';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Global Application Header */}
      <AppHeader
        currentView={currentView}
        onOpenScoring={() => setCurrentView('scoring')}
        onOpenResearch={() => {
          setResearchSubject(undefined);
          setCurrentView('research');
        }}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden relative">
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
        <main className="flex-1 overflow-y-auto bg-slate-950/80 pb-20 md:pb-0">
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
        </main>
      </div>

      {/* Global Drawers & Modals */}
      <CompanyDetailDrawer
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
      />

      <OutreachApprovalModal
        draft={activeOutreachDraft}
        onClose={() => setActiveOutreachDraft(null)}
      />

      {/* Analyst Tender Ingestion Modal */}
      <TenderIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onSubmit={submitTenderIntake}
      />

      {/* NDPA 2023 Cryptographic Suppression & Privacy Modal */}
      <DataPrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

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
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
