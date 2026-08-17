import React from 'react';
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  User,
} from 'lucide-react';
import { Driver, LiveSimulationState, Order, Vehicle, OptimizationRun } from '../../types/logistics';
import { LogisticsMap } from '../map/LogisticsMap';

interface CustomerPortalProps {
  orders: Order[];
  vehicles: Vehicle[];
  drivers: Driver[];
  activeSimulation?: LiveSimulationState;
  onSelectOrder: (order: Order) => void;
  selectedOrder?: Order;
  onCreateOrder: () => void;
  onStartSimulation: (orderId: string) => void;
  optimizationRuns?: OptimizationRun[];
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  orders,
  vehicles,
  drivers,
  activeSimulation,
  onSelectOrder,
  selectedOrder,
  onCreateOrder,
  onStartSimulation,
  optimizationRuns = [],
}) => {
  const currentOrder = selectedOrder || orders[0];
  const assignedVehicle = vehicles.find((v) => v.id === currentOrder?.assignedVehicleId);
  const assignedDriver = drivers.find((d) => d.id === currentOrder?.assignedDriverId);

  // Workflow step completion
  const isPending = currentOrder?.status === 'pending';
  const isAssigned = currentOrder?.status === 'assigned' || currentOrder?.status === 'in_transit' || currentOrder?.status === 'delivered';
  const isInTransit = currentOrder?.status === 'in_transit' || currentOrder?.status === 'delivered';
  const isDelivered = currentOrder?.status === 'delivered';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Customer Live Delivery Tracker & Dispatch Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Real-Time Automated Delivery Tracking
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-xl">
              Track your parcel from pickup to doorstep with autonomous route optimization and live telemetry.
            </p>
          </div>

          <button
            onClick={onCreateOrder}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-blue-700 shadow-lg hover:bg-blue-50 transition"
          >
            <span>+</span>
            <span>Book New Delivery</span>
          </button>
        </div>
      </div>

      {/* Main Content: Tracking Card + Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Step-by-Step Delivery Progress */}
        <div className="lg:col-span-5 space-y-5">
          {/* Order Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracking Order</span>
                <h3 className="text-base font-black text-slate-900">{currentOrder?.orderNumber}</h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isDelivered
                    ? 'bg-emerald-100 text-emerald-800'
                    : isInTransit
                    ? 'bg-blue-100 text-blue-800'
                    : isAssigned
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentOrder?.status.toUpperCase()}
              </span>
            </div>

            {/* Live Progress Timeline */}
            <div className="mt-5 space-y-4 text-xs">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Order Registered & Geocoded</h4>
                  <p className="text-[11px] text-slate-500">
                    Pickup at {currentOrder?.sender.location.landmark || 'Warehouse'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Delivery Requirements Analyzed</h4>
                  <p className="text-[11px] text-slate-500">
                    {currentOrder?.package.weightKg} kg payload · {currentOrder?.deliveryWindow.type.toUpperCase()} priority
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                    isAssigned ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isAssigned ? '✓' : '3'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Optimal Fleet Vehicle Assigned</h4>
                  <p className="text-[11px] text-slate-500">
                    {assignedVehicle ? (
                      <span className="text-blue-700 font-semibold">
                        {assignedVehicle.plateNumber} ({assignedVehicle.companyName})
                      </span>
                    ) : (
                      'Matching closest low-emission vehicle...'
                    )}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                    isInTransit ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isInTransit ? '🚗' : '4'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">In Transit on Live Route</h4>
                  <p className="text-[11px] text-slate-500">
                    {activeSimulation?.isRunning
                      ? `Vehicle moving at ${activeSimulation.currentSpeedKmh} km/h · ETA ~${activeSimulation.etaMinutes} min`
                      : `Estimated travel duration ~${currentOrder?.estimatedTravelTimeMin || 24} min`}
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                    isDelivered ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDelivered ? '✓' : '5'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Delivered to Recipient</h4>
                  <p className="text-[11px] text-slate-500">
                    {isDelivered ? 'Parcel safely handed over.' : `Destination: ${currentOrder?.recipient.location.address?.slice(0, 30)}...`}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Simulator launch for Customer */}
            {!activeSimulation?.isRunning && currentOrder && (
              <button
                onClick={() => onStartSimulation(currentOrder.id)}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Simulate Live Journey on Map</span>
              </button>
            )}
          </div>

          {/* Assigned Driver Card */}
          {assignedDriver && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Assigned Delivery Specialist
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={assignedDriver.avatar}
                  alt={assignedDriver.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900">{assignedDriver.name}</h4>
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {assignedDriver.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{assignedDriver.companyName}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{assignedDriver.phone}</span>
                </div>
                <div className="text-slate-500">
                  <strong>{assignedDriver.totalCompletedDeliveries}+</strong> deliveries
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Live Interactive Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Live Satellite Telemetry Map</h3>
                  <p className="text-[11px] text-slate-500">
                    Real-time vehicle coordinates & route corridor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Distance:</span>
                <strong className="text-slate-900">~{currentOrder?.estimatedDistanceKm || 14} km</strong>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="h-[460px] w-full rounded-xl overflow-hidden mt-3 border border-slate-200">
              <LogisticsMap
                vehicles={vehicles}
                drivers={drivers}
                selectedOrder={currentOrder}
                activeSimulation={activeSimulation}
                routeOptions={
                  activeSimulation 
                    ? [activeSimulation.currentRoute] 
                    : (optimizationRuns.find(r => r.orderId === currentOrder?.id)?.selectedCandidate?.allRouteOptions)
                }
                selectedRouteOption={
                  activeSimulation 
                    ? activeSimulation.currentRoute 
                    : (optimizationRuns.find(r => r.orderId === currentOrder?.id)?.selectedCandidate?.bestRouteOption)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
