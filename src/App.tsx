import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { CrmModule } from './components/crm/CrmModule';
import { QuotationsModule } from './components/quotations/QuotationsModule';
import { TradeModule } from './components/trade/TradeModule';
import { SalesModule } from './components/sales/SalesModule';
import { CounterModule } from './components/counter/CounterModule';
import { PurchaseModule } from './components/purchase/PurchaseModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { ManufacturingModule } from './components/manufacturing/ManufacturingModule';
import { ShopFloorTerminal } from './components/shopfloor/ShopFloorTerminal';
import { QualityModule } from './components/quality/QualityModule';
import { WorkModule } from './components/work/WorkModule';
import { KhatabookModule } from './components/khatabook/KhatabookModule';
import { FinanceModule } from './components/finance/FinanceModule';
import { GstReturnsModule } from './components/gst/GstReturnsModule';
import { CADeskModule } from './components/cadesk/CADeskModule';
import { HrmsModule } from './components/hrms/HrmsModule';
import { SupportModule } from './components/support/SupportModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { MarketplaceModule } from './components/marketplace/MarketplaceModule';
import { MRPModal } from './components/mrp/MRPModal';
import { AuthPage } from './components/auth/AuthPage';
import { AiAssistantDrawer } from './components/assistant/AiAssistantDrawer';
import { PlatformAdminApp } from './components/platform-admin/PlatformAdminApp';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [dashboardViewMode, setDashboardViewMode] = useState<'portal' | 'operations'>('portal');
  const [settingsSubTab, setSettingsSubTab] = useState<string>('company');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('Codozent One_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [isMRPOpen, setIsMRPOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenOrganizationsPortal = () => {
    setCurrentTab('dashboard');
    setDashboardViewMode('portal');
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('Codozent One_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const { currentRole, isAuthenticated } = useERP();

  // If worker role is selected, automatically lock view to shopfloor terminal
  React.useEffect(() => {
    if (currentRole === 'worker' && currentTab !== 'shopfloor') {
      setCurrentTab('shopfloor');
    }
  }, [currentRole, currentTab]);

  // Determine if application is currently at the Organizations Portal (Home Hub)
  const isPortalMode = currentTab === 'dashboard' && dashboardViewMode === 'portal';

  // Authentication gate: require login & company access before dashboard entrance
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen flex bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Left Sidebar (Collapsible Icon Rail on Desktop) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setMobileSidebarOpen(false);
        }}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenPortal={handleOpenOrganizationsPortal}
        isPortalMode={isPortalMode}
      />

      {/* Right Canvas: Top Header + Active Module */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          onOpenMRP={() => setIsMRPOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onToggleCollapse={toggleSidebarCollapse}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenPortal={handleOpenOrganizationsPortal}
          isPortalMode={isPortalMode}
          onNavigateTab={(tab, subTab) => {
            setCurrentTab(tab);
            if (subTab) {
              setSettingsSubTab(subTab);
            }
          }}
        />

        {/* Content View Area */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8fafc] p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <ExecutiveDashboard
                viewMode={dashboardViewMode}
                setViewMode={setDashboardViewMode}
                onNavigate={(tab) => setCurrentTab(tab as NavTab)}
                onOpenMRP={() => setIsMRPOpen(true)}
              />
            )}
            {currentTab === 'trade' && <TradeModule />}
            {currentTab === 'crm' && <CrmModule />}
            {currentTab === 'quotations' && <QuotationsModule />}
            {currentTab === 'sales' && <SalesModule onNavigateToManufacturing={() => setCurrentTab('manufacturing')} />}
            {currentTab === 'counter' && <CounterModule />}
            {currentTab === 'purchase' && <PurchaseModule onOpenMRP={() => setIsMRPOpen(true)} />}
            {currentTab === 'inventory' && <InventoryModule />}
            {currentTab === 'manufacturing' && (
              <ManufacturingModule onNavigateToShopfloor={() => setCurrentTab('shopfloor')} />
            )}
            {currentTab === 'shopfloor' && <ShopFloorTerminal />}
            {currentTab === 'quality' && <QualityModule />}
            {currentTab === 'work' && <WorkModule />}
            {currentTab === 'khatabook' && <KhatabookModule />}
            {currentTab === 'finance' && <FinanceModule />}
            {currentTab === 'gstReturns' && <GstReturnsModule />}
            {currentTab === 'caDesk' && <CADeskModule />}
            {currentTab === 'hrms' && <HrmsModule />}
            {currentTab === 'support' && <SupportModule />}
            {currentTab === 'reports' && <ReportsModule />}
            {currentTab === 'marketplace' && <MarketplaceModule onNavigateTab={(tab) => setCurrentTab(tab)} />}
            {currentTab === 'settings' && (
              <SettingsModule
                initialTab={settingsSubTab as any}
                onTabChange={setSettingsSubTab}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals & AI Copilot Drawer */}
      <MRPModal isOpen={isMRPOpen} onClose={() => setIsMRPOpen(false)} />
      <AiAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  // Same SPA deployment, but the platform console must not initialize or inherit
  // a tenant ERP session/context.
  if (typeof window !== 'undefined' && /^\/platform-admin\/?$/.test(window.location.pathname)) {
    return <PlatformAdminApp />;
  }

  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
};

export default App;
