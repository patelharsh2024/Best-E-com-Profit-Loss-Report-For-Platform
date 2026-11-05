import React from 'react';
import { Package, RotateCcw, CreditCard, Layers, FileBarChart2, LayoutDashboard, Plus, Upload } from 'lucide-react';

export type ActiveTab = 'overview' | 'deliveries' | 'returns' | 'payments' | 'inventory' | 'reports';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewOrderModal: () => void;
  onOpenUploadModal: () => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: Array<{ key: string; label: string }>;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewOrderModal,
  onOpenUploadModal,
  selectedMonth,
  onSelectMonth,
  availableMonths
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => onSelectTab('overview')}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap text-left hover:text-indigo-600 transition-colors focus:outline-none"
            >
              Best E-com Profit & Loss Report For Platform
            </button>
            <div className="hidden sm:flex items-center">
              <label htmlFor="global-month-select" className="sr-only">Select Month</label>
              <select
                id="global-month-select"
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="text-xs font-semibold bg-slate-100 text-slate-700 py-1.5 px-2.5 rounded-md border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-2xs font-bold border border-emerald-200/80">
              <span>₹ INR</span>
            </div>
          </div>

          {/* Zone 2: 5 single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('overview')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'overview'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => onSelectTab('deliveries')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'deliveries'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Deliveries</span>
            </button>
            <button
              onClick={() => onSelectTab('returns')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'returns'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Returns</span>
            </button>
            <button
              onClick={() => onSelectTab('payments')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'payments'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payments</span>
            </button>
            <button
              onClick={() => onSelectTab('inventory')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'inventory'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Inventory</span>
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'reports'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <FileBarChart2 className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </nav>

          {/* Zone 3: Primary action & upload trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Upload CSV / JSON data file"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Upload Data</span>
            </button>
            <button
              onClick={onOpenNewOrderModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs focus:ring-2 focus:ring-offset-1 focus:ring-slate-900"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Order</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-100 py-2 overflow-x-auto gap-2">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('deliveries')}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'deliveries' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Deliveries
          </button>
          <button
            onClick={() => onSelectTab('returns')}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'returns' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Returns
          </button>
          <button
            onClick={() => onSelectTab('payments')}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'payments' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Reports
          </button>
        </div>
      </div>
    </header>
  );
};
