import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  DollarSign,
  Fuel,
  Info,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  CandidateEvaluation,
  OptimizationRun,
  Order,
  RouteOption,
} from '../../types/logistics';

interface OptimizationViewProps {
  activeOrder?: Order;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  optimizationRun?: OptimizationRun;
  onRunOptimization: (orderId: string) => void;
  onAssignAndSimulate: (orderId: string, vehicleId?: string, driverId?: string) => void;
  onSelectRouteOption?: (route: RouteOption) => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  activeOrder,
  orders,
  onSelectOrder,
  optimizationRun,
  onRunOptimization,
  onAssignAndSimulate,
  onSelectRouteOption,
}) => {
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(0);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();

  const currentOrder = activeOrder || orders[0];
  const selectedCandidate = optimizationRun?.allCandidates[selectedCandidateIndex] || optimizationRun?.selectedCandidate;

  return (
    <div className="space-y-6">
      {/* Top Banner & Order Selector */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
              Multi-Criteria Route & Fleet Optimization Engine
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Autonomous Assignment & Decision Explainability
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Evaluating physical constraints, road traffic, EV range, driver fatigue, and operational costs across the metropolitan fleet graph.
            </p>
          </div>

          {/* Quick Select Order & Run Optimizer */}
          <div className="flex items-center gap-2">
            <select
              value={currentOrder?.id || ''}
              onChange={(e) => {
                const found = orders.find((o) => o.id === e.target.value);
                if (found) onSelectOrder(found);
              }}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-semibold text-white shadow-inner focus:outline-hidden"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} · {o.package.weightKg}kg ({o.package.type}) [{o.status.toUpperCase()}]
                </option>
              ))}
            </select>

            <button
              onClick={() => currentOrder && onRunOptimization(currentOrder.id)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>Run Engine</span>
            </button>
          </div>
        </div>

        {/* Active Order Summary Pills */}
        {currentOrder && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Pickup Point</span>
              <span className="font-bold text-white truncate block">{currentOrder.sender.name}</span>
              <span className="text-[10px] text-slate-400 truncate block">{currentOrder.sender.location.landmark || currentOrder.sender.location.address}</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Dropoff Destination</span>
              <span className="font-bold text-white truncate block">{currentOrder.recipient.name}</span>
              <span className="text-[10px] text-slate-400 truncate block">{currentOrder.recipient.location.landmark || currentOrder.recipient.location.address}</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Package Payload</span>
              <span className="font-bold text-white block">
                {currentOrder.package.weightKg} kg · {currentOrder.package.type}
              </span>
              <span className="text-[10px] text-amber-300 font-semibold block">
                {currentOrder.package.fragile ? '⚠️ Fragile' : 'Standard Handling'}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">SLA Priority</span>
              <span className="font-bold text-blue-400 block capitalize">
                {currentOrder.deliveryWindow.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-slate-400 block">Target: {currentOrder.deliveryWindow.endTime}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Optimization Content */}
      {optimizationRun ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Ranked Candidates List & Hard Constraint Rejections */}
          <div className="space-y-6 lg:col-span-1">
            {/* Candidates Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Fleet Evaluation Ranking</h3>
                  <p className="text-xs text-slate-500">
                    {optimizationRun.eligibleCount} Eligible · {optimizationRun.rejectedCount} Hard Rejected
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {optimizationRun.allCandidates.length} Total
                </span>
              </div>

              <div className="mt-4 space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {optimizationRun.allCandidates.map((cand, idx) => {
                  const isSelected = selectedCandidateIndex === idx;
                  const isTopMatch = idx === 0 && cand.isEligible;

                  return (
                    <div
                      key={cand.vehicle.id}
                      onClick={() => {
                        setSelectedCandidateIndex(idx);
                        if (cand.bestRouteOption && onSelectRouteOption) {
                          onSelectRouteOption(cand.bestRouteOption);
                        }
                      }}
                      className={`cursor-pointer rounded-xl p-3 border transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                          : cand.isEligible
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-rose-200 bg-rose-50/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs ${
                              cand.isEligible
                                ? isTopMatch
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-900 text-white'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {cand.isEligible ? `#${idx + 1}` : '✕'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 truncate max-w-[130px]">
                                {cand.vehicle.plateNumber}
                              </span>
                              {cand.vehicle.fuelType === 'electric' && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">EV</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {cand.driver.name} ({cand.company.name.slice(0, 12)})
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {cand.isEligible ? (
                            <div>
                              <span className="text-sm font-black text-blue-700">
                                {cand.scores.overallScore}
                              </span>
                              <span className="text-[10px] text-slate-500 block">/100</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              REJECTED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Micro stats or rejection summary */}
                      {cand.isEligible ? (
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/50 pt-1.5">
                          <span>📍 {cand.metrics.driverDistanceToPickupKm} km away</span>
                          <span>⏱️ {cand.metrics.estimatedTravelTimeMin}m ETA</span>
                          <span>₹{cand.metrics.estimatedCostInr}</span>
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] text-rose-700 bg-rose-100/70 p-1.5 rounded font-medium">
                          {cand.rejectionReasons[0] || 'Physical constraint violation'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hard Constraint Explanations Panel */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Hard Constraint Safety Filters
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                Vehicles are rejected prior to scoring if cargo weight exceeds rated capacity, if cargo is fragile on two-wheelers, if hazardous permits are missing, or if driver driving hours are exceeded.
              </p>
            </div>
          </div>

          {/* Right Column: Selected Candidate Deep Dive & Reasoning Breakdown */}
          {selectedCandidate && (
            <div className="space-y-6 lg:col-span-2">
              {/* Selected Candidate Card Header */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-xl shadow-md">
                      {selectedCandidate.vehicle.vehicleType === 'bike' ? '🏍️' : selectedCandidate.vehicle.fuelType === 'electric' ? '⚡' : '🚛'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900">
                          {selectedCandidate.vehicle.plateNumber}
                        </h2>
                        {selectedCandidate.isEligible && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                            Rank #{selectedCandidateIndex + 1} Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {selectedCandidate.company.name} · Assigned Driver: <strong>{selectedCandidate.driver.name}</strong> ({selectedCandidate.driver.phone})
                      </p>
                    </div>
                  </div>

                  {/* Dispatch Button */}
                  {selectedCandidate.isEligible && (
                    <button
                      onClick={() =>
                        currentOrder &&
                        onAssignAndSimulate(
                          currentOrder.id,
                          selectedCandidate.vehicle.id,
                          selectedCandidate.driver.id
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>Confirm & Start Live Simulation</span>
                    </button>
                  )}
                </div>

                {/* Score Breakdown Radar/Pills */}
                {selectedCandidate.isEligible ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Parametric Optimization Scores (0 - 100)
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-black text-blue-700">
                          {selectedCandidate.scores.overallScore}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold"> / 100 Composite</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-semibold block">Travel Time Score</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-slate-800">{selectedCandidate.scores.travelTimeScore}</span>
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${selectedCandidate.scores.travelTimeScore}%` }} />
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-semibold block">Proximity / Distance</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-slate-800">{selectedCandidate.scores.distanceScore}</span>
                          <Compass className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${selectedCandidate.scores.distanceScore}%` }} />
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-semibold block">Capacity Match</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-slate-800">{selectedCandidate.scores.capacityScore}</span>
                          <Truck className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${selectedCandidate.scores.capacityScore}%` }} />
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-semibold block">Operating Cost Score</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-slate-800">{selectedCandidate.scores.vehicleCostScore}</span>
                          <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-amber-600 h-full rounded-full" style={{ width: `${selectedCandidate.scores.vehicleCostScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-900">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-800">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      Detailed Rejection Diagnostics
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {selectedCandidate.rejectionReasons.map((reason, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <span className="text-rose-600">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Explainability / Reasoning Card */}
              {selectedCandidate.isEligible && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm uppercase tracking-wider mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Why was this Fleet Assignment Selected?
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    {optimizationRun.reasoning.bulletPoints.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-blue-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before vs After Optimization Delta Cards */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Optimization Impact Metrics (Before vs After Algorithm)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-[10px] text-slate-500 font-semibold block">Total Travel Time</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-slate-400 line-through">{optimizationRun.beforeVsAfter.before.travelTimeMin}m</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-base font-black text-emerald-700">{optimizationRun.beforeVsAfter.after.travelTimeMin}m</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                      ↓ {optimizationRun.beforeVsAfter.savings.timeSavedMin}m Saved ({((optimizationRun.beforeVsAfter.savings.timeSavedMin / optimizationRun.beforeVsAfter.before.travelTimeMin) * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-[10px] text-slate-500 font-semibold block">Operating Cost</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-slate-400 line-through">₹{optimizationRun.beforeVsAfter.before.costInr}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-base font-black text-emerald-700">₹{optimizationRun.beforeVsAfter.after.costInr}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                      ↓ ₹{optimizationRun.beforeVsAfter.savings.costSavedInr} Saved
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-[10px] text-slate-500 font-semibold block">Route Distance</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-slate-400 line-through">{optimizationRun.beforeVsAfter.before.distanceKm} km</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-base font-black text-slate-900">{optimizationRun.beforeVsAfter.after.distanceKm} km</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                      ↓ {optimizationRun.beforeVsAfter.savings.distanceSavedKm} km Saved
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-[10px] text-slate-500 font-semibold block">Corridor Conflicts</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-rose-500 font-bold">{optimizationRun.beforeVsAfter.before.conflictsCount} active</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-base font-black text-emerald-700">0 Resolved</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                      100% Conflict Free
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Route Strategy Alternatives */}
              {selectedCandidate.allRouteOptions && selectedCandidate.allRouteOptions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    <Compass className="h-4 w-4 text-blue-600" />
                    Alternative Route Geometry Evaluated
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedCandidate.allRouteOptions.slice(0, 3).map((route) => (
                      <div
                        key={route.id}
                        onClick={() => onSelectRouteOption && onSelectRouteOption(route)}
                        className={`cursor-pointer rounded-xl p-3.5 border transition ${
                          route.isRecommended
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{route.title}</span>
                          {route.isRecommended && (
                            <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-xs space-y-1 text-slate-600">
                          <div>Distance: <strong>{route.distanceKm} km</strong></div>
                          <div>Duration: <strong>{route.durationMin} min</strong></div>
                          <div>Tolls: <strong>₹{route.tollCostInr}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <Zap className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Optimization Engine Ready</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Select an active order above and click &quot;Run Engine&quot; to execute real-time multi-criteria vehicle scoring, route generation, and constraint validation.
          </p>
          <button
            onClick={() => currentOrder && onRunOptimization(currentOrder.id)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Run Multi-Criteria Optimization</span>
          </button>
        </div>
      )}
    </div>
  );
};
