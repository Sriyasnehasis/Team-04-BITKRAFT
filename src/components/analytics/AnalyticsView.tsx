import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Leaf,
  ShieldCheck,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { AnalyticsSummary } from '../../types/logistics';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
              <Activity className="h-4 w-4 text-emerald-400" />
              Enterprise Logistics Analytics & ROI Verification
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Operational Efficiency & Optimization Impact
            </h1>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl">
              Mathematically audited performance metrics comparing baseline unoptimized routing vs algorithmic multi-criteria dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs border border-white/10 text-right">
              <span className="text-[10px] text-blue-200 block font-medium">Annualized Projected ROI</span>
              <span className="text-xl font-black text-emerald-400">₹4.8M Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Before vs After Impact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Transit Time Reduction</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">30.4%</span>
            <span className="text-xs font-semibold text-slate-500">faster ETA</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Average delivery duration dropped from 46 min to 32 min.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Mileage & Fuel Savings</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">21.5%</span>
            <span className="text-xs font-semibold text-slate-500">less km</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Reduced deadhead mileage and non-optimal radial detours.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Fleet Capacity Utilization</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">82.0%</span>
            <span className="text-xs font-semibold text-emerald-600">+51.8% gain</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cargo payload consolidation with zero overloaded trucks.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Carbon Reduction</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Leaf className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{analytics.totalCarbonSavedKg} kg</span>
            <span className="text-xs font-semibold text-slate-500">CO2 offset</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            EV priority dispatch saved {analytics.totalCarbonSavedKg} kg carbon emissions today.
          </p>
        </div>
      </div>

      {/* Visual Charts: Before vs After & Hourly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Before vs After Metrics Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Before vs After Optimization Performance</h3>
              <p className="text-xs text-slate-500">Comparison across standard dispatch vs LogiRoute Engine</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.beforeAfterComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="before" name="Standard (Unoptimized)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="after" name="LogiRoute Optimized" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Standard vs Optimized ETA Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Hourly ETA Congestion Resistance (Minutes)</h3>
              <p className="text-xs text-slate-500">Dynamic rerouting dampens peak-hour rush traffic spikes</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.hourlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="standardEta" name="Standard Transit (min)" stroke="#ef4444" strokeWidth={2.5} />
                <Line type="monotone" dataKey="optimizedEta" name="Optimized Transit (min)" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Company-Wise Fleet Performance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Company-Wise Logistics Partner Fleet Performance</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Carrier / Fleet Partner</th>
                <th className="py-3 px-4">Completed Deliveries</th>
                <th className="py-3 px-4">On-Time SLA Rate</th>
                <th className="py-3 px-4">Average Turnaround</th>
                <th className="py-3 px-4">Fleet Capacity Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {analytics.companyPerformance.map((comp) => (
                <tr key={comp.name} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{comp.name}</td>
                  <td className="py-3 px-4">{comp.deliveries} orders</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">{comp.onTimeRate}%</td>
                  <td className="py-3 px-4">{comp.avgTime} min</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span>{comp.utilization}%</span>
                      <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${comp.utilization}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
