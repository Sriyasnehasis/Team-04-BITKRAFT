import React, { useEffect, useState } from 'react';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { OperationsDashboard } from './components/dashboard/OperationsDashboard';
import { Navbar } from './components/layout/Navbar';
import { OptimizationView } from './components/optimization/OptimizationView';
import { OrderCreationModal } from './components/orders/OrderCreationModal';
import { OrdersTable } from './components/orders/OrdersTable';
import { OptimizationSettingsModal } from './components/settings/OptimizationSettingsModal';
import { logisticsStore } from './lib/store';
import {
  OptimizationWeights,
  Order,
  RouteOption,
  UserRole,
} from './types/logistics';

export default function App() {
  // Store state sync
  const [storeState, setStoreState] = useState(logisticsStore.getState());

  // Navigation & UI State
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'optimization' | 'analytics'>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(storeState.orders[0]?.id);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = logisticsStore.subscribe((newState) => {
      setStoreState(newState);
      if (!selectedOrderId && newState.orders.length > 0) {
        setSelectedOrderId(newState.orders[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedOrderId]);

  const selectedOrder = storeState.orders.find((o) => o.id === selectedOrderId) || storeState.orders[0];

  // Actions
  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
  };

  const handleRunOptimization = async (orderId: string) => {
    const run = await logisticsStore.runOptimization(orderId);
    if (run) {
      setActiveTab('optimization');
    }
  };

  const handleAssignAndSimulate = async (orderId: string, vehicleId?: string, driverId?: string) => {
    await logisticsStore.assignCandidate(orderId, vehicleId, driverId);
    logisticsStore.startSimulation(orderId, 2);
    setActiveTab('dashboard');
  };

  const handleCreateOrder = (orderData: any) => {
    const newOrder = logisticsStore.createOrder(orderData);
    setSelectedOrderId(newOrder.id);
    // Auto trigger optimization for convenience
    handleRunOptimization(newOrder.id);
  };

  const handleSaveWeights = (weights: OptimizationWeights) => {
    logisticsStore.updateOptimizationWeights(weights);
  };

  const handleSaveApiKey = (apiKey: string) => {
    logisticsStore.setTomTomApiKey(apiKey);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLoadDemo={() => logisticsStore.loadDemoScenario()}
        onCreateOrder={() => setIsOrderModalOpen(true)}
        activeSimulationRunning={storeState.activeSimulation?.isRunning}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'customer' ? (
          /* Customer Tracking Portal View */
          <CustomerPortal
            orders={storeState.orders}
            vehicles={storeState.vehicles}
            drivers={storeState.drivers}
            activeSimulation={storeState.activeSimulation}
            onSelectOrder={handleSelectOrder}
            selectedOrder={selectedOrder}
            onCreateOrder={() => setIsOrderModalOpen(true)}
            onStartSimulation={(orderId) => logisticsStore.startSimulation(orderId, 2)}
            optimizationRuns={storeState.optimizationRuns}
          />
        ) : (
          /* Admin / Operations Views */
          <>
            {activeTab === 'dashboard' && (
              <OperationsDashboard
                analytics={storeState.analytics}
                vehicles={storeState.vehicles}
                drivers={storeState.drivers}
                orders={storeState.orders}
                systemEvents={storeState.systemEvents}
                conflicts={storeState.conflicts}
                activeSimulation={storeState.activeSimulation}
                onStartSimulation={(orderId, spd) => logisticsStore.startSimulation(orderId, spd)}
                onPauseSimulation={() => logisticsStore.pauseSimulation()}
                onResumeSimulation={() => logisticsStore.resumeSimulation()}
                onResetSimulation={() => logisticsStore.resetSimulation()}
                onSetSimulationSpeed={(spd) => logisticsStore.setSimulationSpeed(spd)}
                onInjectTraffic={(delay) => logisticsStore.injectTrafficDelay(delay)}
                onInjectBreakdown={() => logisticsStore.injectVehicleBreakdown()}
                onResolveConflict={(conflictId) => logisticsStore.resolveConflict(conflictId)}
                onSelectOrder={handleSelectOrder}
                selectedOrder={selectedOrder}
                onRunOptimization={handleRunOptimization}
                optimizationRuns={storeState.optimizationRuns}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTable
                orders={storeState.orders}
                vehicles={storeState.vehicles}
                drivers={storeState.drivers}
                onSelectOrder={handleSelectOrder}
                onRunOptimization={handleRunOptimization}
                onStartSimulation={(orderId) => {
                  logisticsStore.startSimulation(orderId, 2);
                  setActiveTab('dashboard');
                }}
                onCreateOrder={() => setIsOrderModalOpen(true)}
              />
            )}

            {activeTab === 'optimization' && (
              <OptimizationView
                activeOrder={selectedOrder}
                orders={storeState.orders}
                onSelectOrder={handleSelectOrder}
                optimizationRun={storeState.activeOptimizationRun}
                onRunOptimization={handleRunOptimization}
                onAssignAndSimulate={handleAssignAndSimulate}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView analytics={storeState.analytics} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <OrderCreationModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <OptimizationSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        weights={storeState.weights}
        onSaveWeights={handleSaveWeights}
        tomTomApiKey={storeState.tomTomApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
