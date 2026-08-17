import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Clock,
  MapPin,
  ShieldAlert,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { calculateHaversineDistanceKm } from '../../lib/geo';
import { LOCATION_PRESETS } from '../../lib/seed-data';
import { DeliveryPriority, LatLng, Order, PackageType } from '../../types/logistics';

interface OrderCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt'>) => void;
}

export const OrderCreationModal: React.FC<OrderCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  // Form State
  const [senderName, setSenderName] = useState('Mumbai Central Distribution Hub');
  const [senderPhone, setSenderPhone] = useState('+91 98201 11440');
  const [senderLocation, setSenderLocation] = useState<LatLng>({
    lat: LOCATION_PRESETS[0].lat,
    lng: LOCATION_PRESETS[0].lng,
    address: LOCATION_PRESETS[0].address,
    landmark: LOCATION_PRESETS[0].landmark,
    city: LOCATION_PRESETS[0].city,
  });

  const [recipientName, setRecipientName] = useState('BKC FinTech Hub');
  const [recipientPhone, setRecipientPhone] = useState('+91 98330 99882');
  const [recipientLocation, setRecipientLocation] = useState<LatLng>({
    lat: LOCATION_PRESETS[1].lat,
    lng: LOCATION_PRESETS[1].lng,
    address: LOCATION_PRESETS[1].address,
    landmark: LOCATION_PRESETS[1].landmark,
    city: LOCATION_PRESETS[1].city,
  });

  // Package State
  const [packageType, setPackageType] = useState<PackageType>('electronics');
  const [weightKg, setWeightKg] = useState<number>(12.0);
  const [lengthCm, setLengthCm] = useState<number>(45);
  const [widthCm, setWidthCm] = useState<number>(35);
  const [heightCm, setHeightCm] = useState<number>(25);
  const [quantity, setQuantity] = useState<number>(1);
  const [fragile, setFragile] = useState<boolean>(true);
  const [tempSensitive, setTempSensitive] = useState<boolean>(false);
  const [hazardous, setHazardous] = useState<boolean>(false);
  const [specialInstructions, setSpecialInstructions] = useState('Fragile server equipment. Keep upright.');
  const [declaredValue, setDeclaredValue] = useState<number>(75000);

  // Delivery Window State
  const [priority, setPriority] = useState<DeliveryPriority>('express');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [maxMinutes, setMaxMinutes] = useState<number>(60);

  if (!isOpen) return null;

  const estimatedDist = calculateHaversineDistanceKm(
    senderLocation.lat,
    senderLocation.lng,
    recipientLocation.lat,
    recipientLocation.lng
  );
  const estimatedTime = Math.max(15, Math.round((estimatedDist / 30) * 60));
  const estimatedCost = Math.round(estimatedDist * 8.5 + 40 + (priority === 'express' ? 35 : priority === 'same_day' ? 60 : 0));

  const handleSenderPreset = (preset: typeof LOCATION_PRESETS[0]) => {
    setSenderLocation({
      lat: preset.lat,
      lng: preset.lng,
      address: preset.address,
      landmark: preset.landmark,
      city: preset.city,
    });
  };

  const handleRecipientPreset = (preset: typeof LOCATION_PRESETS[0]) => {
    setRecipientLocation({
      lat: preset.lat,
      lng: preset.lng,
      address: preset.address,
      landmark: preset.landmark,
      city: preset.city,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      customerId: 'user-customer',
      customerName: senderName,
      customerPhone: senderPhone,
      sender: {
        name: senderName,
        phone: senderPhone,
        location: senderLocation,
      },
      recipient: {
        name: recipientName,
        phone: recipientPhone,
        location: recipientLocation,
      },
      package: {
        id: `pkg-${Date.now()}`,
        type: packageType,
        weightKg: Number(weightKg),
        dimensionsCm: {
          length: Number(lengthCm),
          width: Number(widthCm),
          height: Number(heightCm),
        },
        quantity: Number(quantity),
        fragile,
        temperatureSensitive: tempSensitive,
        hazardous,
        specialInstructions,
        declaredValueInr: Number(declaredValue),
      },
      deliveryWindow: {
        type: priority,
        startTime,
        endTime,
        maxAcceptableMinutes: Number(maxMinutes),
        priorityScore: priority === 'same_day' ? 10 : priority === 'express' ? 8 : 5,
      },
      estimatedDistanceKm: Number((estimatedDist * 1.2).toFixed(1)),
      estimatedTravelTimeMin: estimatedTime,
      estimatedCostInr: estimatedCost,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create New Delivery Order</h2>
              <p className="text-xs text-slate-500">
                Configure pickup, destination, payload constraints & SLA delivery window
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Section 1: Pickup & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender / Pickup Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Pickup Point (Origin)
                </div>
                <span className="text-[11px] font-medium text-emerald-700">
                  {senderLocation.lat.toFixed(4)}, {senderLocation.lng.toFixed(4)}
                </span>
              </div>

              {/* Presets dropdown */}
              <div className="mt-2.5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quick Select Hub / Preset
                </label>
                <select
                  onChange={(e) => {
                    const found = LOCATION_PRESETS.find((p) => p.label === e.target.value);
                    if (found) handleSenderPreset(found);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
                  value={senderLocation.landmark || ''}
                >
                  {LOCATION_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.label}>
                      {preset.city}: {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  placeholder="Sender / Warehouse Name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                  required
                />
                <input
                  type="text"
                  placeholder="Detailed Pickup Address"
                  value={senderLocation.address || ''}
                  onChange={(e) =>
                    setSenderLocation({ ...senderLocation, address: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                  required
                />
              </div>
            </div>

            {/* Recipient / Dropoff Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Delivery Destination (Dropoff)
                </div>
                <span className="text-[11px] font-medium text-blue-700">
                  {recipientLocation.lat.toFixed(4)}, {recipientLocation.lng.toFixed(4)}
                </span>
              </div>

              {/* Presets dropdown */}
              <div className="mt-2.5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quick Select Destination Hub
                </label>
                <select
                  onChange={(e) => {
                    const found = LOCATION_PRESETS.find((p) => p.label === e.target.value);
                    if (found) handleRecipientPreset(found);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
                  value={recipientLocation.landmark || ''}
                >
                  {LOCATION_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.label}>
                      {preset.city}: {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  placeholder="Recipient Name / Company"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                  required
                />
                <input
                  type="text"
                  placeholder="Detailed Destination Address"
                  value={recipientLocation.address || ''}
                  onChange={(e) =>
                    setRecipientLocation({ ...recipientLocation, address: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Package Specifications */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Box className="h-4 w-4 text-slate-600" />
              Package Specifications & Handling
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cargo Category
                </label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value as PackageType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                >
                  <option value="electronics">Electronics</option>
                  <option value="medical">Medical / Pharma</option>
                  <option value="perishable_food">Perishable Food</option>
                  <option value="apparel">Apparel / Fashion</option>
                  <option value="machinery">Heavy Machinery</option>
                  <option value="document">Legal Document</option>
                  <option value="general_cargo">General Cargo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="4500"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Dimensions (L x W x H cm)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(parseInt(e.target.value) || 10)}
                    className="w-full rounded border border-slate-300 px-1.5 py-1.5 text-xs text-center"
                    placeholder="L"
                  />
                  <span className="text-slate-400">×</span>
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(parseInt(e.target.value) || 10)}
                    className="w-full rounded border border-slate-300 px-1.5 py-1.5 text-xs text-center"
                    placeholder="W"
                  />
                  <span className="text-slate-400">×</span>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value) || 10)}
                    className="w-full rounded border border-slate-300 px-1.5 py-1.5 text-xs text-center"
                    placeholder="H"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Declared Value (₹)
                </label>
                <input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(parseInt(e.target.value) || 1000)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Checkbox tags */}
            <div className="mt-3 flex flex-wrap gap-4 pt-2 border-t border-slate-200/60">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fragile}
                  onChange={(e) => setFragile(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>⚠️ Fragile Item (Exclude 2-wheelers)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempSensitive}
                  onChange={(e) => setTempSensitive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>❄️ Temperature Sensitive (Cold Chain)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hazardous}
                  onChange={(e) => setHazardous(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-red-700 font-semibold">☣️ Hazardous Cargo (Dedicated Truck Only)</span>
              </label>
            </div>
          </div>

          {/* Section 3: SLA Priority & Time Window */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Clock className="h-4 w-4 text-slate-600" />
              SLA Priority & Delivery Window
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Urgency Tier
                </label>
                <div className="flex gap-1.5">
                  {(['standard', 'express', 'same_day'] as DeliveryPriority[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize border transition ${
                        priority === p
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {p.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Time Window
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Max Delivery Window (Minutes)
                </label>
                <input
                  type="number"
                  value={maxMinutes}
                  onChange={(e) => setMaxMinutes(parseInt(e.target.value) || 60)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Quick Real-Time Estimation Summary */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4 text-white">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Estimated Transit</span>
                <span className="font-bold text-sm text-white">~{(estimatedDist * 1.2).toFixed(1)} km</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px]">Estimated ETA</span>
                <span className="font-bold text-sm text-white">~{estimatedTime} min</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px]">Target Cost</span>
                <span className="font-bold text-sm text-emerald-400">₹{estimatedCost}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Submit & Run Optimization Engine</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
