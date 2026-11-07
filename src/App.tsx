import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { SalesModule } from './components/sales/SalesModule';
import { PurchaseModule } from './components/purchase/PurchaseModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { ManufacturingModule } from './components/manufacturing/ManufacturingModule';
import { ShopFloorTerminal } from './components/shopfloor/ShopFloorTerminal';
import { QualityModule } from './components/quality/QualityModule';
import { FinanceModule } from './components/finance/FinanceModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { MRPModal } from './components/mrp/MRPModal';
import { SupabaseModal } from './components/settings/SupabaseModal';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMRPOpen, setIsMRPOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { canAccess, currentRole } = useERP();

  // If worker role is selected, automatically lock view to shopfloor terminal
  React.useEffect(() => {
    if (currentRole === 'worker' && currentTab !== 'shopfloor') {
      setCurrentTab('shopfloor');
    }
  }, [currentRole, currentTab]);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenMRP={() => setIsMRPOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Container: Sidebar + Active Module */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <ExecutiveDashboard
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenMRP={() => setIsMRPOpen(true)}
              />
            )}
            {currentTab === 'sales' && <SalesModule />}
            {currentTab === 'purchase' && <PurchaseModule onOpenMRP={() => setIsMRPOpen(true)} />}
            {currentTab === 'inventory' && <InventoryModule />}
            {currentTab === 'manufacturing' && (
              <ManufacturingModule onNavigateToShopfloor={() => setCurrentTab('shopfloor')} />
            )}
            {currentTab === 'shopfloor' && <ShopFloorTerminal />}
            {currentTab === 'quality' && <QualityModule />}
            {currentTab === 'finance' && <FinanceModule />}
            {currentTab === 'reports' && <ReportsModule />}
            {currentTab === 'settings' && (
              <SettingsModule onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <MRPModal isOpen={isMRPOpen} onClose={() => setIsMRPOpen(false)} />
      <SupabaseModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
};

export default App;

