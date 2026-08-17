export type UserRole = 'admin' | 'customer' | 'driver';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export type VehicleType = 'bike' | 'scooter' | 'van' | 'mini_truck' | 'truck' | 'ev_van';
export type FuelType = 'electric' | 'petrol' | 'diesel' | 'cng';
export type VehicleStatus = 'available' | 'assigned' | 'en_route' | 'loading' | 'delivering' | 'offline' | 'maintenance';

export interface LatLng {
  lat: number;
  lng: number;
  address?: string;
  landmark?: string;
  city?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  logo: string;
  primaryColor: string;
  rating: number;
  activeVehicles: number;
  totalDeliveries: number;
  onTimeRate: number;
  carbonScore: number;
}

export interface Vehicle {
  id: string;
  companyId: string;
  companyName: string;
  plateNumber: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  capacityKg: number;
  currentLoadKg: number;
  availableCapacityKg: number;
  operatingCostPerKm: number; // in INR ₹
  currentLocation: LatLng;
  status: VehicleStatus;
  driverId?: string;
  driverName?: string;
  maxRangeKm: number;
  batteryOrFuelPct: number;
  speedKmh: number;
  assignedOrderId?: string;
}

export type DriverStatus = 'available' | 'delivering' | 'break' | 'offline';

export interface Driver {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  vehicleId?: string;
  vehiclePlate?: string;
  phone: string;
  currentLocation: LatLng;
  status: DriverStatus;
  rating: number;
  completedDeliveriesToday: number;
  totalCompletedDeliveries: number;
  currentWorkload: number; // 0 - 100
  maxDailyDeliveries: number;
  drivingHoursToday: number;
  avatar: string;
  activeOrderId?: string;
}

export type PackageType = 'document' | 'electronics' | 'apparel' | 'perishable_food' | 'medical' | 'machinery' | 'fragile_luxury' | 'general_cargo';
export type DeliveryPriority = 'standard' | 'express' | 'same_day';
export type OrderStatus = 'pending' | 'optimized' | 'assigned' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled';

export interface PackageDetails {
  id: string;
  type: PackageType;
  weightKg: number;
  dimensionsCm: {
    length: number;
    width: number;
    height: number;
  };
  quantity: number;
  fragile: boolean;
  temperatureSensitive: boolean;
  hazardous: boolean;
  specialInstructions?: string;
  declaredValueInr: number;
}

export interface DeliveryWindow {
  type: DeliveryPriority;
  startTime: string; // e.g. "14:00"
  endTime: string;   // e.g. "16:00"
  maxAcceptableMinutes: number;
  priorityScore: number; // 1 to 10
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  sender: {
    name: string;
    phone: string;
    location: LatLng;
  };
  recipient: {
    name: string;
    phone: string;
    location: LatLng;
  };
  package: PackageDetails;
  deliveryWindow: DeliveryWindow;
  status: OrderStatus;
  createdAt: string;
  deliveredAt?: string;
  
  // Assignment and Optimization details
  assignedCompanyId?: string;
  assignedCompanyName?: string;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  assignedVehicleType?: VehicleType;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  
  routeId?: string;
  estimatedDistanceKm?: number;
  estimatedTravelTimeMin?: number;
  estimatedCostInr?: number;
  optimizationScore?: number;
  optimizationRunId?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
  streetName?: string;
  speedLimitKmh?: number;
  trafficFactor?: number; // 1.0 = normal, 1.5 = heavy, 2.0 = jam
  incident?: string;
}

export type RouteStrategy = 'fastest' | 'shortest' | 'traffic_avoidance' | 'eco_friendly';

export interface RouteOption {
  id: string;
  strategy: RouteStrategy;
  title: string;
  description: string;
  distanceKm: number;
  durationMin: number;
  estimatedCostInr: number;
  trafficCongestionLevel: 'low' | 'moderate' | 'heavy' | 'severe';
  waypoints: RoutePoint[];
  polyline: [number, number][];
  tollCostInr: number;
  carbonEmissionKg: number;
  isRecommended: boolean;
  score: number;
  pros: string[];
  cons: string[];
}

export interface OptimizationWeights {
  travelTimeWeight: number;      // e.g. 0.25
  distanceWeight: number;        // e.g. 0.20
  deliveryPriorityWeight: number;// e.g. 0.15
  vehicleSuitabilityWeight: number; // e.g. 0.15
  driverAvailabilityWeight: number; // e.g. 0.10
  vehicleCostWeight: number;     // e.g. 0.05
  trafficWeight: number;         // e.g. 0.05
  routeConflictWeight: number;   // e.g. 0.05
}

export interface CandidateEvaluation {
  vehicle: Vehicle;
  driver: Driver;
  company: Company;
  isEligible: boolean;
  rejectionReasons: string[];
  scores: {
    travelTimeScore: number;
    distanceScore: number;
    capacityScore: number;
    driverAvailabilityScore: number;
    driverWorkloadScore: number;
    priorityScore: number;
    vehicleCostScore: number;
    trafficScore: number;
    routeConflictScore: number;
    deliveryWindowScore: number;
    vehicleSuitabilityScore: number;
    overallScore: number;
  };
  metrics: {
    driverDistanceToPickupKm: number;
    deliveryDistanceKm: number;
    totalDistanceKm: number;
    estimatedTravelTimeMin: number;
    estimatedCostInr: number;
    trafficDelayMin: number;
  };
  bestRouteOption: RouteOption;
  allRouteOptions: RouteOption[];
}

export interface OptimizationRun {
  id: string;
  orderId: string;
  timestamp: string;
  weights: OptimizationWeights;
  selectedCandidate?: CandidateEvaluation;
  allCandidates: CandidateEvaluation[];
  eligibleCount: number;
  rejectedCount: number;
  reasoning: {
    bulletPoints: string[];
    summary: string;
    keyDecidingFactor: string;
  };
  beforeVsAfter: {
    before: {
      distanceKm: number;
      travelTimeMin: number;
      costInr: number;
      conflictsCount: number;
      utilizationPct: number;
      carbonKg: number;
    };
    after: {
      distanceKm: number;
      travelTimeMin: number;
      costInr: number;
      conflictsCount: number;
      utilizationPct: number;
      carbonKg: number;
    };
    savings: {
      distanceSavedKm: number;
      timeSavedMin: number;
      costSavedInr: number;
      conflictsResolved: number;
      fuelSavedLiters: number;
    };
  };
}

export interface LiveSimulationState {
  orderId: string;
  vehicleId: string;
  driverId: string;
  isRunning: boolean;
  isPaused: boolean;
  speedMultiplier: 1 | 2 | 5 | 10;
  progressPct: number; // 0 to 100
  currentPosition: [number, number];
  bearing: number;
  currentSpeedKmh: number;
  distanceTraveledKm: number;
  distanceRemainingKm: number;
  etaMinutes: number;
  status: 'idle' | 'en_route_pickup' | 'at_pickup' | 'in_transit' | 'traffic_slowdown' | 'rerouting' | 'breakdown_alert' | 'delivered';
  currentRoute: RouteOption;
  activeIncidents: {
    id: string;
    type: 'traffic' | 'breakdown' | 'conflict' | 'urgent_order' | 'roadblock';
    description: string;
    delayMinutes: number;
    location: [number, number];
    createdAt: string;
    resolved: boolean;
  }[];
  rerouteCount: number;
}

export type EventType =
  | 'ORDER_CREATED'
  | 'ORDER_ASSIGNED'
  | 'VEHICLE_STARTED'
  | 'TRAFFIC_DETECTED'
  | 'ROUTE_RECALCULATED'
  | 'DRIVER_DELAY'
  | 'VEHICLE_BREAKDOWN'
  | 'DELIVERY_PRIORITY_CHANGED'
  | 'ROUTE_CONFLICT_DETECTED'
  | 'VEHICLE_REASSIGNED'
  | 'DELIVERY_COMPLETED';

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: EventType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  orderId?: string;
  vehicleId?: string;
  driverId?: string;
  metadata?: Record<string, any>;
}

export interface RouteConflict {
  id: string;
  vehicleAId: string;
  vehicleAPlate: string;
  vehicleBId: string;
  vehicleBPlate: string;
  sharedSegment: string;
  location: [number, number];
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
  status: 'active' | 'resolved';
  recommendedAction: string;
  estimatedTimeSavedMin: number;
}

export interface AnalyticsSummary {
  activeDeliveries: number;
  availableVehicles: number;
  vehiclesEnRoute: number;
  completedDeliveriesToday: number;
  avgDeliveryTimeMin: number;
  avgDistanceKm: number;
  totalOperatingCostInr: number;
  totalOptimizationSavingsInr: number;
  activeRouteConflicts: number;
  totalCarbonSavedKg: number;
  fleetUtilizationPct: number;
  onTimeDeliveryRatePct: number;
  
  statusCounts: {
    pending: number;
    assigned: number;
    in_transit: number;
    delayed: number;
    delivered: number;
    cancelled: number;
  };
  
  companyPerformance: {
    name: string;
    deliveries: number;
    onTimeRate: number;
    avgTime: number;
    utilization: number;
  }[];
  
  hourlyPerformance: {
    hour: string;
    standardEta: number;
    optimizedEta: number;
    orders: number;
  }[];
  
  beforeAfterComparison: {
    metric: string;
    before: number;
    after: number;
    unit: string;
    improvementPct: number;
  }[];
}
