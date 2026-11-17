import React, { useState } from 'react';
import { 
  Check, 
  Layers, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  PackageCheck, 
  Search,
  Filter,
  Power
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { getAllModuleManifests, validateModuleDependencies } from '../../lib/moduleRegistry';
import { ModuleCategory } from '../../types/modules';

export const ModuleManagement: React.FC = () => {
  const { installedModules, installModule, uninstallModule, activeCompany } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const manifests = getAllModuleManifests();

  const categories = ['All', 'Sales & CRM', 'Supply Chain', 'Manufacturing', 'Finance & Tax', 'Human Capital', 'Operations & Services'];

  const filteredManifests = manifests.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleModule = async (moduleId: string) => {
    setActionError(null);
    setActionSuccess(null);

    const isCurrentlyEnabled = installedModules.includes(moduleId);

    if (isCurrentlyEnabled) {
      if (['dashboard', 'settings', 'reports'].includes(moduleId)) {
        setActionError('Core governance modules cannot be disabled.');
        return;
      }
      await uninstallModule(moduleId);
      setActionSuccess(`Module '${moduleId}' has been deactivated. Historical records are preserved.`);
    } else {
      // Validate dependencies
      const depCheck = validateModuleDependencies(moduleId, installedModules);
      if (!depCheck.canEnable) {
        setActionError(`Cannot activate module. Missing required dependencies: ${depCheck.missingDependencies.join(', ')}`);
        return;
      }
      await installModule(moduleId);
      setActionSuccess(`Module '${moduleId}' successfully activated for ${activeCompany.name}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0c6cf2]" />
            <span>Plug-and-Play Module Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent, company-specific module activation for <span className="font-semibold text-slate-800">{activeCompany.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            {installedModules.length} Active Modules
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            {manifests.length} Available
          </span>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-[#0c6cf2] text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#0c6cf2]"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredManifests.map(manifest => {
          const isEnabled = installedModules.includes(manifest.id);
          const isCoreLocked = ['dashboard', 'settings', 'reports'].includes(manifest.id);

          return (
            <div 
              key={manifest.id}
              className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all ${
                isEnabled ? 'border-blue-200/90 shadow-2xs' : 'border-slate-200 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isEnabled ? 'bg-blue-50 text-[#0c6cf2]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{manifest.name}</h3>
                      <div className="text-[10px] text-slate-400 font-mono">v{manifest.version} · {manifest.category}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    isEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {manifest.description}
                </p>

                {/* Capabilities Badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {manifest.capabilities.slice(0, 3).map((cap, i) => (
                    <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {cap}
                    </span>
                  ))}
                  {manifest.capabilities.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-mono">+{manifest.capabilities.length - 3}</span>
                  )}
                </div>

                {/* Dependencies Note */}
                {manifest.dependencies.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500">Requires: </span>
                    {manifest.dependencies.map(d => d.moduleId).join(', ')}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {manifest.permissions.length} Permissions
                </span>

                <button
                  type="button"
                  disabled={isCoreLocked}
                  onClick={() => handleToggleModule(manifest.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isCoreLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isEnabled
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-[#0c6cf2] text-white hover:bg-blue-600'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isCoreLocked ? 'Core System' : isEnabled ? 'Deactivate' : 'Activate Module'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
