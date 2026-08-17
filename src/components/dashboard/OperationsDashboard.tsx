import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Compass,
  DollarSign,
  FastForward,
  Flame,
  Gauge,
  Layers,
  MapPin,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  AnalyticsSummary,
  Driver,
  LiveSimulationState,
  Order,
  RouteConflict,
  RouteOption,
  SystemEvent,
  Vehicle,
  OptimizationRun,
} from '../../types/logistics';
import { LogisticsMap } from '../map/LogisticsMap';

interface OperationsDashboardProps {
  analytics: AnalyticsSummary;
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  systemEvents: SystemEvent[];
  conflicts: RouteConflict[];
  activeSimulation?: LiveSimulationState;
  onStartSimulation: (orderId: string, speedMultiplier?: 1 | 2 | 5 | 10) => void;
  onPauseSimulation: () => void;
  onResumeSimulation: () => void;
  onResetSimulation: () => void;
  onSetSimulationSpeed: (multiplier: 1 | 2 | 5 | 10) => void;
  onInjectTraffic: (delayMinutes?: number) => void;
  onInjectBreakdown: () => void;
  onResolveConflict: (conflictId: string) => void;
  onSelectOrder: (order: Order) => void;
  selectedOrder?: Order;
  onRunOptimization: (orderId: string) => void;
  optimizationRuns?: OptimizationRun[];
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  analytics,
  vehicles,
  drivers,
  orders,
  systemEvents,
  conflicts,
  activeSimulation,
  onStartSimulation,
  onPauseSimulation,
  onResumeSimulation,
  onResetSimulation,
  onSetSimulationSpeed,
  onInjectTraffic,
  onInjectBreakdown,
  onResolveConflict,
  onSelectOrder,
  selectedOrder,
  onRunOptimization,
  optimizationRuns = [],
}) => {
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState<Vehicle | null>(null);

  // Active simulated order
  const simulatedOrder = activeSimulation ? orders.find((o) => o.id === activeSimulation.orderId) : selectedOrder || orders[0];
  const simVehicle = activeSimulation ? vehicles.find((v) => v.id === activeSimulation.vehicleId) : undefined;
  const simDriver = activeSimulation ? drivers.find((d) => d.id === activeSimulation.driverId) : undefined;

  return (
    <div className="space-y-5">
      {/* 1. TOP LOGISTICS KPI BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Active Deliveries */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Missions</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
              <Truck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{analytics.activeDeliveries}</span>
            <span className="text-[10px] font-bold text-emerald-600">En Route</span>
          </div>
        </div>

        {/* Available Fleet */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fleet Ready</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{analytics.availableVehicles}</span>
            <span className="text-[10px] text-slate-500">/ {vehicles.length} units</span>
          </div>
        </div>

        {/* Completed Today */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
              <CheckCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{analytics.completedDeliveriesToday}</span>
            <span className="text-[10px] font-bold text-emerald-600">98.4% SLA</span>
          </div>
        </div>

        {/* Avg Delivery Time */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Transit</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 text-purple-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{analytics.avgDeliveryTimeMin}m</span>
            <span className="text-[10px] font-bold text-emerald-600">↓ 14m opt</span>
          </div>
        </div>

        {/* Avg Distance */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Distance</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-700">
              <Compass className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{analytics.avgDistanceKm}</span>
            <span className="text-[10px] text-slate-500">km/mission</span>
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Utilization</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <Gauge className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{analytics.fleetUtilizationPct}%</span>
            <span className="text-[10px] font-bold text-emerald-600">+28%</span>
          </div>
        </div>

        {/* Optimization Savings */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost Saved</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-700">₹{analytics.totalOptimizationSavingsInr}</span>
            <span className="text-[10px] font-bold text-emerald-600">22% cut</span>
          </div>
        </div>

        {/* Active Conflicts */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conflicts</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 text-rose-700">
              <AlertOctagon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-rose-600">{analytics.activeRouteConflicts}</span>
            <span className="text-[10px] font-bold text-amber-600">Flagged</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN OPERATIONS AREA: INTERACTIVE MAP + SIMULATION CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Map & Simulation Command Center */}
        <div className="lg:col-span-8 space-y-4">
          {/* Simulation Control Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                      activeSimulation?.isRunning
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Radio className="h-5 w-5" />
                  </div>
                  {activeSimulation?.isRunning && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-white">
                      Live Vehicle Telemetry & Movement Simulation
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeSimulation?.isRunning
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {activeSimulation?.isRunning
                        ? activeSimulation.isPaused
                          ? 'PAUSED'
                          : 'LIVE ACTIVE'
                        : 'IDLE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeSimulation?.isRunning
                      ? `Tracking ${simVehicle?.plateNumber || 'Vehicle'} (Driver: ${simDriver?.name || 'Assigned'}) · ${activeSimulation.distanceTraveledKm} km done / ${activeSimulation.distanceRemainingKm} km left`
                      : 'Select any assigned order to launch vehicle waypoint interpolation on map.'}
                  </p>
                </div>
              </div>

              {/* Simulation Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {activeSimulation?.isRunning ? (
                  <>
                    {activeSimulation.isPaused ? (
                      <button
                        onClick={onResumeSimulation}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={onPauseSimulation}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </button>
                    )}

                    {/* Speed Multipliers */}
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                      {([1, 2, 5, 10] as const).map((spd) => (
                        <button
                          key={spd}
                          onClick={() => onSetSimulationSpeed(spd)}
                          className={`px-2 py-1 rounded font-bold transition ${
                            activeSimulation.speedMultiplier === spd
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd}×
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={onResetSimulation}
                      title="Reset Simulation"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => simulatedOrder && onStartSimulation(simulatedOrder.id, 2)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Start Delivery Simulation</span>
                  </button>
                )}
              </div>
            </div>

            {/* In-Flight Simulation Telemetry Ribbon */}
            {activeSimulation?.isRunning && (
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">Simulation Progress</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-black text-sm text-blue-400">{activeSimulation.progressPct}%</span>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${activeSimulation.progressPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">Telemetry Speed</span>
                  <span className="font-bold text-sm text-white mt-1 block">
                    {activeSimulation.currentSpeedKmh} km/h
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">Estimated Arrival (ETA)</span>
                  <span className="font-bold text-sm text-emerald-400 mt-1 block">
                    ~{activeSimulation.etaMinutes} min left
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">Distance Traveled</span>
                  <span className="font-bold text-sm text-white mt-1 block">
                    {activeSimulation.distanceTraveledKm} / {activeSimulation.currentRoute.distanceKm} km
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">Dynamic Reroutes</span>
                  <span className="font-bold text-sm text-amber-400 mt-1 block">
                    {activeSimulation.rerouteCount} executed
                  </span>
                </div>
              </div>
            )}

            {/* Dynamic Event Injection Tools */}
            {activeSimulation?.isRunning && (
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-800/60 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                  <Flame className="h-3 w-3 text-amber-400" />
                  Inject Realistic Scenario Events:
                </span>

                <button
                  onClick={() => onInjectTraffic(9)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-lg transition"
                >
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  Inject Traffic Jam (+9m)
                </button>

                <button
                  onClick={onInjectBreakdown}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold rounded-lg transition"
                >
                  <Wrench className="h-3 w-3 text-red-400" />
                  Simulate Vehicle Breakdown (Auto-Reassign)
                </button>
              </div>
            )}
          </div>

          {/* Interactive Logistics Map Container */}
          <div className="h-[480px] w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
            <LogisticsMap
              vehicles={vehicles}
              drivers={drivers}
              selectedOrder={simulatedOrder}
              activeSimulation={activeSimulation}
              routeOptions={
                activeSimulation 
                  ? [activeSimulation.currentRoute] 
                  : (optimizationRuns.find(r => r.orderId === simulatedOrder?.id)?.selectedCandidate?.allRouteOptions)
              }
              selectedRouteOption={
                activeSimulation 
                  ? activeSimulation.currentRoute 
                  : (optimizationRuns.find(r => r.orderId === simulatedOrder?.id)?.selectedCandidate?.bestRouteOption)
              }
              conflicts={conflicts}
              onConflictClick={onResolveConflict}
              onVehicleClick={(v) => setSelectedVehicleForModal(v)}
            />
          </div>
        </div>

        {/* Right 4 Cols: Active Orders, Conflicts & Real-Time Event Audit Feed */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Route Conflicts Warning Card */}
          {conflicts.filter((c) => c.status === 'active').length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-amber-600 animate-pulse" />
                  Active Corridor Conflicts ({conflicts.filter((c) => c.status === 'active').length})
                </div>
              </div>

              <div className="mt-3 space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {conflicts
                  .filter((c) => c.status === 'active')
                  .map((conflict) => (
                    <div key={conflict.id} className="rounded-xl bg-white p-3 border border-amber-200 shadow-2xs text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{conflict.sharedSegment}</span>
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {conflict.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{conflict.recommendedAction}</p>
                      <button
                        onClick={() => onResolveConflict(conflict.id)}
                        className="mt-2 w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow transition"
                      >
                        Auto-Reroute & Resolve (+{conflict.estimatedTimeSavedMin}m saved)
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Active Orders Dispatch Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                Active Dispatch Orders
              </h3>
              <span className="text-xs font-semibold text-slate-500">{orders.length} in system</span>
            </div>

            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {orders.slice(0, 6).map((ord) => {
                const isSelected = simulatedOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => onSelectOrder(ord)}
                    className={`cursor-pointer rounded-xl p-2.5 border transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{ord.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'assigned'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 truncate">
                      {ord.sender.location.landmark || ord.sender.name} → {ord.recipient.location.landmark || ord.recipient.name}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span>{ord.package.weightKg} kg · {ord.package.type}</span>
                      <span className="font-bold text-blue-600">{ord.assignedVehiclePlate || 'Unassigned'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time System Event Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-600" />
                Live Operational Event Feed
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {systemEvents.slice(0, 10).map((evt) => (
                <div key={evt.id} className="flex items-start gap-2.5 text-xs">
                  <div
                    className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                      evt.severity === 'error'
                        ? 'bg-red-500'
                        : evt.severity === 'warning'
                        ? 'bg-amber-500'
                        : evt.severity === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-slate-800 leading-tight">{evt.title}</div>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{evt.description}</p>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
