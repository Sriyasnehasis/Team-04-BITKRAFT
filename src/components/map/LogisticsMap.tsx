import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Driver,
  LatLng,
  LiveSimulationState,
  Order,
  RouteConflict,
  RouteOption,
  Vehicle,
} from '../../types/logistics';

interface LogisticsMapProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  selectedOrder?: Order;
  activeSimulation?: LiveSimulationState;
  routeOptions?: RouteOption[];
  selectedRouteOption?: RouteOption;
  conflicts?: RouteConflict[];
  onVehicleClick?: (vehicle: Vehicle) => void;
  onDriverClick?: (driver: Driver) => void;
  onConflictClick?: (conflict: RouteConflict) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export const LogisticsMap: React.FC<LogisticsMapProps> = ({
  vehicles,
  drivers,
  selectedOrder,
  activeSimulation,
  routeOptions,
  selectedRouteOption,
  conflicts = [],
  onVehicleClick,
  onDriverClick,
  onConflictClick,
  center = [19.085, 72.865], // Mumbai center
  zoom = 12,
  className = 'h-full w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center[0], center[1]] as L.LatLngTuple,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean, modern CartoDB Positron style tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Alternative and Selected Routes
    if (routeOptions && routeOptions.length > 0) {
      routeOptions.forEach((route) => {
        const isSelected =
          (selectedRouteOption && selectedRouteOption.id === route.id) ||
          (activeSimulation && activeSimulation.currentRoute.id === route.id) ||
          route.isRecommended;

        const color = isSelected
          ? route.trafficCongestionLevel === 'severe'
            ? '#ef4444'
            : '#2563eb'
          : '#94a3b8';

        const weight = isSelected ? 5 : 3;
        const opacity = isSelected ? 0.9 : 0.45;
        const dashArray = isSelected ? undefined : '6, 6';

        const polyline = L.polyline(route.polyline, {
          color,
          weight,
          opacity,
          dashArray,
          lineJoin: 'round',
        });

        polyline.bindTooltip(
          `<div class="text-xs font-semibold px-1 py-0.5">${route.title} (${route.distanceKm} km, ${route.durationMin}m)</div>`,
          { sticky: true }
        );

        polyline.addTo(layerGroup);
      });
    }

    // 2. Draw Active Simulation Polyline
    if (activeSimulation && activeSimulation.currentRoute) {
      const activePolyline = L.polyline(activeSimulation.currentRoute.polyline, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
      });
      activePolyline.addTo(layerGroup);
    }

    // 3. Draw Selected Order Pickup & Destination Pins
    if (selectedOrder) {
      const pickup = selectedOrder.sender.location;
      const dropoff = selectedOrder.recipient.location;

      // Pickup Marker (Green)
      const pickupHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white ring-2 ring-emerald-300">
            📦
          </div>
          <span class="absolute -bottom-5 bg-emerald-950/85 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            Pickup: ${selectedOrder.sender.name.slice(0, 14)}
          </span>
        </div>
      `;
      const pickupIcon = L.divIcon({
        className: 'custom-map-pin',
        html: pickupHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .bindPopup(
          `<div class="p-2 min-w-[200px]">
            <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Pickup Warehouse</span>
            <h4 class="font-bold text-sm text-slate-800">${selectedOrder.sender.name}</h4>
            <p class="text-xs text-slate-600 mt-1">${pickup.address || 'Location'}</p>
            <div class="mt-2 text-xs font-semibold text-slate-700 bg-slate-100 p-1.5 rounded">
              Package: ${selectedOrder.package.weightKg} kg (${selectedOrder.package.type})
            </div>
          </div>`
        )
        .addTo(layerGroup);

      // Dropoff Marker (Blue/Red)
      const dropoffHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white ring-2 ring-blue-300">
            🎯
          </div>
          <span class="absolute -bottom-5 bg-slate-900/85 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            Dropoff: ${selectedOrder.recipient.name.slice(0, 14)}
          </span>
        </div>
      `;
      const dropoffIcon = L.divIcon({
        className: 'custom-map-pin',
        html: dropoffHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon })
        .bindPopup(
          `<div class="p-2 min-w-[200px]">
            <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">Delivery Destination</span>
            <h4 class="font-bold text-sm text-slate-800">${selectedOrder.recipient.name}</h4>
            <p class="text-xs text-slate-600 mt-1">${dropoff.address || 'Location'}</p>
            <div class="mt-2 text-xs font-semibold text-slate-700 bg-blue-50 text-blue-900 p-1.5 rounded border border-blue-200">
              Priority: ${selectedOrder.deliveryWindow.type.toUpperCase()} (Target: ${selectedOrder.deliveryWindow.endTime})
            </div>
          </div>`
        )
        .addTo(layerGroup);
    }

    // 4. Draw Active Route Conflicts (Flashing Warning Zones)
    conflicts.forEach((conflict) => {
      if (conflict.status !== 'active') return;

      const circle = L.circle(conflict.location, {
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.25,
        radius: 650,
        weight: 2,
        dashArray: '4, 4',
      });

      const conflictHtml = `
        <div class="flex items-center justify-center">
          <div class="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-lg border border-white animate-pulse">
            ⚠️
          </div>
        </div>
      `;
      const conflictIcon = L.divIcon({
        className: 'conflict-marker',
        html: conflictHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(conflict.location, { icon: conflictIcon });
      marker.bindPopup(
        `<div class="p-2 max-w-xs">
          <div class="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase">
            <span>⚠️</span> Active Route Conflict
          </div>
          <p class="text-xs font-medium text-slate-800 mt-1">Shared Corridor: <strong>${conflict.sharedSegment}</strong></p>
          <div class="mt-1.5 text-[11px] text-slate-600 bg-amber-50 p-1.5 rounded border border-amber-200">
            Vehicles: <strong>${conflict.vehicleAPlate}</strong> & <strong>${conflict.vehicleBPlate}</strong>
          </div>
          <p class="text-xs text-slate-700 mt-2"><strong>Recommended:</strong> ${conflict.recommendedAction}</p>
          <button id="resolve-${conflict.id}" class="mt-2.5 w-full py-1 px-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow transition">
            Auto-Reroute & Resolve (+${conflict.estimatedTimeSavedMin}m saved)
          </button>
        </div>`
      );

      marker.on('popupopen', () => {
        const btn = document.getElementById(`resolve-${conflict.id}`);
        if (btn && onConflictClick) {
          btn.onclick = () => onConflictClick(conflict);
        }
      });

      circle.addTo(layerGroup);
      marker.addTo(layerGroup);
    });

    // 5. Draw Live Simulation Vehicle Position (Highlighted moving marker)
    if (activeSimulation && activeSimulation.isRunning) {
      const simVehicle = vehicles.find((v) => v.id === activeSimulation.vehicleId);
      const isBreakdown = activeSimulation.status === 'breakdown_alert';
      const isRerouting = activeSimulation.status === 'rerouting';

      const simVehicleHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-11 h-11 rounded-full ${isBreakdown ? 'bg-red-600 animate-bounce ring-4 ring-red-300' : isRerouting ? 'bg-amber-600 ring-4 ring-amber-300' : 'bg-blue-600 ring-4 ring-blue-300'} text-white flex items-center justify-center font-bold text-base shadow-2xl border-2 border-white transition-all transform duration-300">
            ${isBreakdown ? '🚨' : simVehicle?.vehicleType === 'bike' ? '🏍️' : simVehicle?.vehicleType === 'ev_van' ? '⚡' : '🚛'}
          </div>
          <div class="absolute -top-7 bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${isBreakdown ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}"></span>
            ${simVehicle?.plateNumber || 'Fleet Vehicle'} · ${activeSimulation.currentSpeedKmh} km/h
          </div>
        </div>
      `;

      const simIcon = L.divIcon({
        className: 'sim-vehicle-marker',
        html: simVehicleHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const simMarker = L.marker(activeSimulation.currentPosition, { icon: simIcon, zIndexOffset: 1000 });
      simMarker.addTo(layerGroup);

      // Add dynamic incident markers
      activeSimulation.activeIncidents.forEach((inc) => {
        const incHtml = `
          <div class="w-8 h-8 rounded-full ${inc.type === 'traffic' ? 'bg-amber-600' : 'bg-red-600'} text-white flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white animate-pulse">
            ${inc.type === 'traffic' ? '🚦' : '⚠️'}
          </div>
        `;
        const incIcon = L.divIcon({
          className: 'incident-marker',
          html: incHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker(inc.location, { icon: incIcon })
          .bindTooltip(`<div class="text-xs font-bold text-red-600">${inc.description}</div>`, { permanent: true, direction: 'top' })
          .addTo(layerGroup);
      });
    }

    // 6. Draw All Fleet Vehicles Markers
    vehicles.forEach((vehicle) => {
      // Don't duplicate if already rendered as active simulation
      if (activeSimulation && activeSimulation.isRunning && activeSimulation.vehicleId === vehicle.id) {
        return;
      }

      const isMaintenance = vehicle.status === 'maintenance';
      const isEnRoute = vehicle.status === 'en_route' || vehicle.status === 'delivering';
      const isAvailable = vehicle.status === 'available';

      const typeIcon =
        vehicle.vehicleType === 'bike' || vehicle.vehicleType === 'scooter'
          ? '🛵'
          : vehicle.vehicleType === 'ev_van'
          ? '⚡'
          : vehicle.vehicleType === 'truck'
          ? '🚛'
          : '🚐';

      const bgColor = isMaintenance
        ? 'bg-rose-500'
        : isEnRoute
        ? 'bg-indigo-600'
        : isAvailable
        ? 'bg-emerald-600'
        : 'bg-slate-500';

      const vehicleHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-8 h-8 rounded-full ${bgColor} text-white flex items-center justify-center text-xs font-semibold shadow-md border-2 border-white transition transform hover:scale-110">
            ${typeIcon}
          </div>
          <span class="hidden group-hover:block absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">
            ${vehicle.plateNumber}
          </span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'fleet-vehicle-pin',
        html: vehicleHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([vehicle.currentLocation.lat, vehicle.currentLocation.lng], { icon });

      marker.bindPopup(
        `<div class="p-2 min-w-[220px]">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isAvailable ? 'bg-emerald-100 text-emerald-800' : isEnRoute ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'}">
              ${vehicle.status.toUpperCase()}
            </span>
            <span class="text-xs font-semibold text-slate-500">${vehicle.companyName}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-800 mt-1">${vehicle.plateNumber}</h4>
          <div class="mt-2 text-xs space-y-1 text-slate-600">
            <div>Type: <strong>${vehicle.vehicleType.toUpperCase()}</strong> (${vehicle.fuelType})</div>
            <div>Driver: <strong>${vehicle.driverName || 'Unassigned'}</strong></div>
            <div>Payload Load: <strong>${vehicle.currentLoadKg} / ${vehicle.capacityKg} kg</strong></div>
            <div>Battery / Fuel: <strong>${vehicle.batteryOrFuelPct}%</strong></div>
            <div>Op. Cost: <strong>₹${vehicle.operatingCostPerKm}/km</strong></div>
          </div>
        </div>`
      );

      if (onVehicleClick) {
        marker.on('click', () => onVehicleClick(vehicle));
      }

      marker.addTo(layerGroup);
    });
  }, [vehicles, drivers, selectedOrder, activeSimulation, routeOptions, selectedRouteOption, conflicts]);

  // Center map on selected order or simulation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeSimulation && activeSimulation.isRunning) {
      map.panTo(activeSimulation.currentPosition, { animate: true, duration: 0.5 });
    } else if (selectedOrder) {
      const bounds = L.latLngBounds(
        [selectedOrder.sender.location.lat, selectedOrder.sender.location.lng],
        [selectedOrder.recipient.location.lat, selectedOrder.recipient.location.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [selectedOrder, activeSimulation?.isRunning]);

  return (
    <div className={`relative z-0 overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};
