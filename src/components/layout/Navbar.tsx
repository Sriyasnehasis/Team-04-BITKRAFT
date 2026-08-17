import React from 'react';
import {
  Activity,
  Layers,
  PlayCircle,
  RefreshCw,
  Settings,
  Shield,
  Truck,
  User,
  Zap,
} from 'lucide-react';
import { UserRole } from '../../types/logistics';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  onLoadDemo: () => void;
  onCreateOrder: () => void;
  activeSimulationRunning?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  onOpenSettings,
  onLoadDemo,
  onCreateOrder,
  activeSimulationRunning,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">
                LogiRoute<span className="text-blue-600">OS</span>
              </span>
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                v2.4 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Intelligent Route Optimization & Simulation Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Admin Mode) */}
        {currentRole === 'admin' && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Live Operations
            </button>
            <button
              onClick={() => onTabChange('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Orders & Fleet
            </button>
            <button
              onClick={() => onTabChange('optimization')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'optimization'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Optimization Engine
            </button>
            <button
              onClick={() => onTabChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Analytics & KPIs
            </button>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create Order */}
          <button
            onClick={onCreateOrder}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            <span>+</span>
            <span>New Order</span>
          </button>

          {/* 1-Click Demo Scenario */}
          {currentRole === 'admin' && (
            <button
              onClick={onLoadDemo}
              title="Reset & Load Full Simulation Demo Scenario"
              className="hidden lg:flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
            >
              <PlayCircle className="h-3.5 w-3.5 text-indigo-600" />
              <span>Demo Scenario</span>
            </button>
          )}

          {/* Optimization Weights Settings */}
          {currentRole === 'admin' && (
            <button
              onClick={onOpenSettings}
              title="Configure Optimization Scoring Weights"
              className="flex items-center gap-1 p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}

          {/* User Role Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                currentRole === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="h-3 w-3" />
              Admin
            </button>
            <button
              onClick={() => onRoleChange('customer')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                currentRole === 'customer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-3 w-3" />
              Customer
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
