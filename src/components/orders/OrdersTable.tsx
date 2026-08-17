import React, { useState } from 'react';
import {
  AlertCircle,
  Box,
  CheckCircle,
  Clock,
  Compass,
  DollarSign,
  Filter,
  Layers,
  MapPin,
  Play,
  Search,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';
import { Driver, Order, OrderStatus, Vehicle } from '../../types/logistics';

interface OrdersTableProps {
  orders: Order[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onSelectOrder: (order: Order) => void;
  onRunOptimization: (orderId: string) => void;
  onStartSimulation: (orderId: string) => void;
  onCreateOrder: () => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  vehicles,
  drivers,
  onSelectOrder,
  onRunOptimization,
  onStartSimulation,
  onCreateOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'vehicles' | 'drivers'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.recipient.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders & Fleet Asset Inventory</h1>
          <p className="text-xs text-slate-500">
            Monitor real-time dispatch orders, payload requirements, assigned carrier vehicles, and on-duty drivers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'vehicles'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'drivers'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Drivers ({drivers.length})
            </button>
          </div>

          <button
            onClick={onCreateOrder}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <span>+</span>
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* View 1: ORDERS TABLE */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order, customer, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden w-64"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                {(['all', 'pending', 'assigned', 'in_transit', 'delivered'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order ID & SLA</th>
                  <th className="py-3 px-4">Pickup / Dropoff</th>
                  <th className="py-3 px-4">Cargo Payload</th>
                  <th className="py-3 px-4">Assigned Fleet</th>
                  <th className="py-3 px-4">Transit & Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOrders.map((ord) => {
                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => onSelectOrder(ord)}
                    >
                      {/* Order & SLA */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{ord.orderNumber}</div>
                        <div className="text-[11px] text-slate-500">{ord.customerName}</div>
                        <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-blue-200">
                          {ord.deliveryWindow.type.replace('_', ' ')} (Target: {ord.deliveryWindow.endTime})
                        </span>
                      </td>

                      {/* Pickup / Dropoff */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-1 text-[11px] text-slate-800">
                          <span className="text-emerald-600 font-bold shrink-0">From:</span>
                          <span className="truncate">{ord.sender.location.landmark || ord.sender.location.address}</span>
                        </div>
                        <div className="flex items-start gap-1 text-[11px] text-slate-800 mt-1">
                          <span className="text-blue-600 font-bold shrink-0">To:</span>
                          <span className="truncate">{ord.recipient.location.landmark || ord.recipient.location.address}</span>
                        </div>
                      </td>

                      {/* Cargo Payload */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {ord.package.weightKg} kg · {ord.package.type}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {ord.package.fragile && <span className="text-amber-600 font-semibold">⚠️ Fragile</span>}
                          {ord.package.hazardous && <span className="text-red-600 font-semibold">☣️ Hazardous</span>}
                        </div>
                      </td>

                      {/* Assigned Fleet */}
                      <td className="py-3.5 px-4">
                        {ord.assignedVehiclePlate ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{ord.assignedVehiclePlate}</span>
                              {ord.assignedVehicleType === 'ev_van' && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">EV</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Driver: {ord.assignedDriverName || 'Assigned'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                            Awaiting Match
                          </span>
                        )}
                      </td>

                      {/* Transit & Cost */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">~{ord.estimatedDistanceKm || 14} km</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>⏱️ {ord.estimatedTravelTimeMin || 28} min</span>
                          <span className="font-semibold text-emerald-700">₹{ord.estimatedCostInr || 120}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'assigned'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onRunOptimization(ord.id)}
                            title="Run Multi-Criteria Optimization"
                            className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                          >
                            <Sparkles className="h-3 w-3 text-blue-600" />
                            Optimize
                          </button>

                          {ord.status === 'assigned' || ord.status === 'in_transit' ? (
                            <button
                              onClick={() => onStartSimulation(ord.id)}
                              title="Start Live Simulation"
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                            >
                              <Play className="h-3 w-3 fill-white" />
                              Simulate
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: VEHICLES TABLE */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const isAvailable = v.status === 'available';
            const isEnRoute = v.status === 'en_route' || v.status === 'delivering';
            return (
              <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-base">
                      {v.vehicleType === 'bike' ? '🏍️' : v.fuelType === 'electric' ? '⚡' : '🚛'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{v.plateNumber}</h4>
                      <span className="text-[10px] text-slate-500">{v.companyName}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800'
                        : isEnRoute
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {v.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>Type: <strong>{v.vehicleType.toUpperCase()}</strong></div>
                  <div>Fuel: <strong>{v.fuelType.toUpperCase()}</strong></div>
                  <div>Payload: <strong>{v.currentLoadKg} / {v.capacityKg} kg</strong></div>
                  <div>Energy/Fuel: <strong>{v.batteryOrFuelPct}%</strong></div>
                  <div>Op. Cost: <strong>₹{v.operatingCostPerKm}/km</strong></div>
                  <div>Driver: <strong>{v.driverName || 'None'}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 3: DRIVERS TABLE */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {drivers.map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <img
                  src={d.avatar}
                  alt={d.name}
                  className="h-11 w-11 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{d.name}</h4>
                  <span className="text-[10px] text-slate-500 block">{d.companyName}</span>
                  <span className="text-[10px] font-bold text-amber-600">★ {d.rating}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <strong className="text-slate-800">{d.phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Deliveries Today:</span>
                  <strong className="text-slate-800">{d.completedDeliveriesToday} done</strong>
                </div>
                <div className="flex justify-between">
                  <span>Workload Index:</span>
                  <strong className="text-blue-700">{d.currentWorkload}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Driving Hours:</span>
                  <strong className="text-slate-800">{d.drivingHoursToday} hrs</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
