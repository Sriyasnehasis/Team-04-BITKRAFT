import React, { useState } from 'react';
import { RefreshCw, Save, Settings, Sliders, X, Zap } from 'lucide-react';
import { OptimizationWeights } from '../../types/logistics';
import { DEFAULT_OPTIMIZATION_WEIGHTS } from '../../lib/optimization-engine';

interface OptimizationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: OptimizationWeights;
  onSaveWeights: (weights: OptimizationWeights) => void;
  tomTomApiKey: string;
  onSaveApiKey: (apiKey: string) => void;
}

export const OptimizationSettingsModal: React.FC<OptimizationSettingsModalProps> = ({
  isOpen,
  onClose,
  weights,
  onSaveWeights,
  tomTomApiKey,
  onSaveApiKey,
}) => {
  const [localWeights, setLocalWeights] = useState<OptimizationWeights>({ ...weights });
  const [localApiKey, setLocalApiKey] = useState<string>(tomTomApiKey);

  React.useEffect(() => {
    if (isOpen) {
      setLocalApiKey(tomTomApiKey);
    }
  }, [isOpen, tomTomApiKey]);

  if (!isOpen) return null;

  const totalSum = Number(
    (
      localWeights.travelTimeWeight +
      localWeights.distanceWeight +
      localWeights.deliveryPriorityWeight +
      localWeights.vehicleSuitabilityWeight +
      localWeights.driverAvailabilityWeight +
      localWeights.vehicleCostWeight +
      localWeights.trafficWeight +
      localWeights.routeConflictWeight
    ).toFixed(2)
  );

  const applyPreset = (preset: 'speed' | 'eco' | 'cost' | 'balanced') => {
    if (preset === 'speed') {
      setLocalWeights({
        travelTimeWeight: 0.45,
        distanceWeight: 0.15,
        deliveryPriorityWeight: 0.20,
        vehicleSuitabilityWeight: 0.10,
        driverAvailabilityWeight: 0.05,
        vehicleCostWeight: 0.02,
        trafficWeight: 0.02,
        routeConflictWeight: 0.01,
      });
    } else if (preset === 'eco') {
      setLocalWeights({
        travelTimeWeight: 0.15,
        distanceWeight: 0.25,
        deliveryPriorityWeight: 0.10,
        vehicleSuitabilityWeight: 0.35, // rewards EV vans & high capacity fit
        driverAvailabilityWeight: 0.05,
        vehicleCostWeight: 0.05,
        trafficWeight: 0.03,
        routeConflictWeight: 0.02,
      });
    } else if (preset === 'cost') {
      setLocalWeights({
        travelTimeWeight: 0.15,
        distanceWeight: 0.25,
        deliveryPriorityWeight: 0.05,
        vehicleSuitabilityWeight: 0.10,
        driverAvailabilityWeight: 0.05,
        vehicleCostWeight: 0.30, // maximum cost frugality
        trafficWeight: 0.05,
        routeConflictWeight: 0.05,
      });
    } else {
      setLocalWeights({ ...DEFAULT_OPTIMIZATION_WEIGHTS });
    }
  };

  const handleSave = () => {
    onSaveWeights(localWeights);
    onSaveApiKey(localApiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Optimization Engine Weights</h2>
              <p className="text-xs text-slate-500">
                Tune parametric weights governing automated carrier scoring and vehicle ranking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Strategies */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 mb-2">Optimization Strategy Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('balanced')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition"
            >
              Balanced Standard
            </button>
            <button
              type="button"
              onClick={() => applyPreset('speed')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 transition"
            >
              Speed & ETA First
            </button>
            <button
              type="button"
              onClick={() => applyPreset('eco')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
            >
              Green EV & Eco
            </button>
            <button
              type="button"
              onClick={() => applyPreset('cost')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
            >
              Lowest Cost First
            </button>
          </div>
        </div>

        {/* TomTom API Configuration */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-750 mb-1.5 uppercase tracking-wide">
            TomTom API Key Configuration
          </label>
          <input
            type="text"
            placeholder="Paste your TomTom API Key here..."
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-hidden"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            If provided, LogiRoute OS will calculate real, actual route corridors on the map via TomTom Routing. If blank, high-fidelity mock radial corridors will be used.
          </p>
        </div>

        {/* Sliders Form */}
        <div className="mt-6 space-y-4">
          {/* Travel Time */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Travel Time Weight</span>
              <span className="text-blue-700">{(localWeights.travelTimeWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.01"
              value={localWeights.travelTimeWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, travelTimeWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Distance */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Distance / Proximity Weight</span>
              <span className="text-blue-700">{(localWeights.distanceWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.01"
              value={localWeights.distanceWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, distanceWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Priority */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Delivery Priority & SLA Window</span>
              <span className="text-blue-700">{(localWeights.deliveryPriorityWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={localWeights.deliveryPriorityWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, deliveryPriorityWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Vehicle Suitability */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Vehicle Suitability & Payload Fit</span>
              <span className="text-blue-700">{(localWeights.vehicleSuitabilityWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={localWeights.vehicleSuitabilityWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, vehicleSuitabilityWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Vehicle Cost */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Vehicle Operating Cost (₹/km)</span>
              <span className="text-blue-700">{(localWeights.vehicleCostWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.35"
              step="0.01"
              value={localWeights.vehicleCostWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, vehicleCostWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setLocalWeights({ ...DEFAULT_OPTIMIZATION_WEIGHTS })}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Apply & Save Weights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
