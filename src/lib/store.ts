import {
  AnalyticsSummary,
  Company,
  Driver,
  LiveSimulationState,
  OptimizationRun,
  OptimizationWeights,
  Order,
  RouteConflict,
  RouteOption,
  SystemEvent,
  User,
  UserRole,
  Vehicle,
} from '../types/logistics';
import { calculateBearing, getPositionAtProgress } from './geo';
import { DEFAULT_OPTIMIZATION_WEIGHTS, OptimizationEngine } from './optimization-engine';
import { RoutingService } from './routing-engine';
import {
  LOCATION_PRESETS,
  SEED_COMPANIES,
  SEED_CONFLICTS,
  SEED_DRIVERS,
  SEED_ORDERS,
  SEED_SYSTEM_EVENTS,
  SEED_USERS,
  SEED_VEHICLES,
} from './seed-data';

export interface AppState {
  currentUser: User;
  users: User[];
  companies: Company[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  systemEvents: SystemEvent[];
  conflicts: RouteConflict[];
  optimizationRuns: OptimizationRun[];
  activeOptimizationRun?: OptimizationRun;
  activeSimulation?: LiveSimulationState;
  weights: OptimizationWeights;
  activeCityFilter: string;
  analytics: AnalyticsSummary;
  tomTomApiKey: string;
}

class LogisticsStore {
  private state: AppState;
  private listeners: Set<(state: AppState) => void> = new Set();
  private simulationInterval: any = null;

  constructor() {
    this.state = {
      currentUser: SEED_USERS[0],
      users: [...SEED_USERS],
      companies: [...SEED_COMPANIES],
      vehicles: [...SEED_VEHICLES],
      drivers: [...SEED_DRIVERS],
      orders: [...SEED_ORDERS],
      systemEvents: [...SEED_SYSTEM_EVENTS],
      conflicts: [...SEED_CONFLICTS],
      optimizationRuns: [],
      weights: { ...DEFAULT_OPTIMIZATION_WEIGHTS },
      activeCityFilter: 'All Cities',
      analytics: {
        activeDeliveries: 4,
        availableVehicles: 8,
        vehiclesEnRoute: 4,
        completedDeliveriesToday: 28,
        avgDeliveryTimeMin: 26,
        avgDistanceKm: 14.5,
        totalOperatingCostInr: 5800,
        totalOptimizationSavingsInr: 1850,
        activeRouteConflicts: 1,
        totalCarbonSavedKg: 18.4,
        fleetUtilizationPct: 78,
        onTimeDeliveryRatePct: 98.4,
        statusCounts: {
          pending: 3,
          assigned: 2,
          in_transit: 4,
          delayed: 1,
          delivered: 24,
          cancelled: 0,
        },
        companyPerformance: [],
        hourlyPerformance: [
          { hour: '08:00', standardEta: 42, optimizedEta: 31, orders: 12 },
          { hour: '10:00', standardEta: 55, optimizedEta: 38, orders: 28 },
          { hour: '12:00', standardEta: 48, optimizedEta: 34, orders: 35 },
          { hour: '14:00', standardEta: 58, optimizedEta: 39, orders: 42 },
          { hour: '16:00', standardEta: 62, optimizedEta: 43, orders: 38 },
          { hour: '18:00', standardEta: 68, optimizedEta: 46, orders: 45 },
          { hour: '20:00', standardEta: 39, optimizedEta: 28, orders: 20 },
        ],
        beforeAfterComparison: [
          { metric: 'Average Distance (km)', before: 21.4, after: 16.8, unit: 'km', improvementPct: 21.5 },
          { metric: 'Transit Time (min)', before: 46.0, after: 32.0, unit: 'min', improvementPct: 30.4 },
          { metric: 'Operating Cost (₹)', before: 184.0, after: 138.0, unit: '₹', improvementPct: 25.0 },
          { metric: 'Fleet Utilization (%)', before: 54.0, after: 82.0, unit: '%', improvementPct: 51.8 },
          { metric: 'Route Conflicts (count)', before: 8.0, after: 1.0, unit: 'conflicts', improvementPct: 87.5 },
        ],
      },
      tomTomApiKey: localStorage.getItem('logiroute_tomtom_api_key') || '',
    };
    this.state.analytics = this.getAnalytics();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.state = {
      ...this.state,
      analytics: this.getAnalytics(),
    };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public async assignCandidate(orderId: string, vehicleId?: string, driverId?: string): Promise<boolean> {
    return await this.assignOrder(orderId, vehicleId, driverId);
  }

  public updateOptimizationWeights(weights: OptimizationWeights): void {
    this.setWeights(weights);
  }

  public async injectTrafficDelay(delayMinutes: number = 9): Promise<void> {
    await this.injectTrafficIncident(delayMinutes);
  }

  public setTomTomApiKey(apiKey: string): void {
    this.state = { ...this.state, tomTomApiKey: apiKey };
    localStorage.setItem('logiroute_tomtom_api_key', apiKey);
    this.addEvent({
      type: 'ORDER_ASSIGNED',
      title: 'TomTom API Key Configuration Saved',
      description: apiKey ? 'Real-time route calculation active.' : 'Switched to fallback high-fidelity mock routing.',
      severity: 'info',
    });
    this.notify();
  }

  public setUserRole(role: UserRole): void {
    const user = this.state.users.find((u) => u.role === role) || this.state.users[0];
    this.state = { ...this.state, currentUser: user };
    this.notify();
  }

  public setCityFilter(city: string): void {
    this.state = { ...this.state, activeCityFilter: city };
    this.notify();
  }

  public setWeights(weights: OptimizationWeights): void {
    this.state = { ...this.state, weights: { ...weights } };
    this.addEvent({
      type: 'ORDER_ASSIGNED',
      title: 'Optimization Weights Updated',
      description: `New parameters saved. Travel Time: ${(weights.travelTimeWeight * 100).toFixed(0)}%, Distance: ${(weights.distanceWeight * 100).toFixed(0)}%, Cost: ${(weights.vehicleCostWeight * 100).toFixed(0)}%`,
      severity: 'info',
    });
    this.notify();
  }

  public addEvent(event: Omit<SystemEvent, 'id' | 'timestamp'>): SystemEvent {
    const newEvent: SystemEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      systemEvents: [newEvent, ...this.state.systemEvents.slice(0, 49)],
    };
    this.notify();
    return newEvent;
  }

  public createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.state = {
      ...this.state,
      orders: [newOrder, ...this.state.orders],
    };

    this.addEvent({
      type: 'ORDER_CREATED',
      title: `Order ${newOrder.orderNumber} Registered`,
      description: `Delivery for ${newOrder.package.weightKg} kg (${newOrder.package.type}) from ${newOrder.sender.location.address?.slice(0, 25)}... to ${newOrder.recipient.location.address?.slice(0, 25)}...`,
      severity: 'info',
      orderId: newOrder.id,
    });

    this.notify();
    return newOrder;
  }

  public async runOptimization(orderId: string): Promise<OptimizationRun | null> {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const activeRoutes = this.state.vehicles
      .filter((v) => v.status === 'en_route' || v.status === 'delivering')
      .map((v) => ({
        vehicleId: v.id,
        polyline: [[v.currentLocation.lat, v.currentLocation.lng] as [number, number]],
      }));

    // Calculate actual route geometries first (uses TomTom Routing API if API key is configured)
    const routes = await RoutingService.calculateRoutes(
      order.sender.location,
      order.recipient.location,
      1.0,
      undefined,
      this.state.tomTomApiKey,
      order.deliveryWindow.type
    );

    const run = OptimizationEngine.evaluateOrder(
      order,
      this.state.vehicles,
      this.state.drivers,
      this.state.companies,
      this.state.weights,
      activeRoutes,
      routes
    );

    // Save run
    this.state = {
      ...this.state,
      optimizationRuns: [run, ...this.state.optimizationRuns],
      activeOptimizationRun: run,
    };

    this.addEvent({
      type: 'ORDER_ASSIGNED',
      title: `Optimization Run Completed for ${order.orderNumber}`,
      description: `Evaluated ${run.allCandidates.length} fleet vehicles. Top candidate: ${run.selectedCandidate?.vehicle.plateNumber || 'None'} (Score: ${run.selectedCandidate?.scores.overallScore || 0}/100)`,
      severity: run.selectedCandidate ? 'success' : 'warning',
      orderId: order.id,
      vehicleId: run.selectedCandidate?.vehicle.id,
      driverId: run.selectedCandidate?.driver.id,
    });

    this.notify();
    return run;
  }

  public async assignOrder(orderId: string, candidateVehicleId?: string, candidateDriverId?: string): Promise<boolean> {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return false;

    let targetVehicle: Vehicle | undefined;
    let targetDriver: Driver | undefined;

    if (candidateVehicleId) {
      targetVehicle = this.state.vehicles.find((v) => v.id === candidateVehicleId);
      targetDriver = targetVehicle?.driverId
        ? this.state.drivers.find((d) => d.id === targetVehicle?.driverId)
        : this.state.drivers.find((d) => d.id === candidateDriverId);
    } else if (this.state.activeOptimizationRun?.selectedCandidate) {
      targetVehicle = this.state.activeOptimizationRun.selectedCandidate.vehicle;
      targetDriver = this.state.activeOptimizationRun.selectedCandidate.driver;
    }

    if (!targetVehicle || !targetDriver) return false;

    // Check if routes are already calculated in an existing optimization run
    const existingRun = this.state.optimizationRuns.find((r) => r.orderId === orderId) || this.state.activeOptimizationRun;
    let bestRoute: RouteOption;

    if (existingRun && existingRun.selectedCandidate && existingRun.orderId === orderId) {
      bestRoute = existingRun.selectedCandidate.bestRouteOption;
    } else {
      const routes = await RoutingService.calculateRoutes(
        order.sender.location,
        order.recipient.location,
        1.0,
        undefined,
        this.state.tomTomApiKey,
        order.deliveryWindow.type
      );
      bestRoute = routes.find((r) => r.isRecommended) || routes[0];
    }

    // Update order
    const updatedOrder: Order = {
      ...order,
      status: 'assigned',
      assignedCompanyId: targetVehicle.companyId,
      assignedCompanyName: targetVehicle.companyName,
      assignedVehicleId: targetVehicle.id,
      assignedVehiclePlate: targetVehicle.plateNumber,
      assignedVehicleType: targetVehicle.vehicleType,
      assignedDriverId: targetDriver.id,
      assignedDriverName: targetDriver.name,
      assignedDriverPhone: targetDriver.phone,
      routeId: bestRoute.id,
      estimatedDistanceKm: bestRoute.distanceKm,
      estimatedTravelTimeMin: bestRoute.durationMin,
      estimatedCostInr: bestRoute.estimatedCostInr,
      optimizationScore: this.state.activeOptimizationRun?.selectedCandidate?.scores.overallScore || 92.5,
    };

    // Update vehicle status & load
    const updatedVehicles = this.state.vehicles.map((v) => {
      if (v.id === targetVehicle!.id) {
        const newLoad = v.currentLoadKg + order.package.weightKg;
        return {
          ...v,
          status: 'assigned' as const,
          currentLoadKg: newLoad,
          availableCapacityKg: Math.max(0, v.capacityKg - newLoad),
          assignedOrderId: order.id,
        };
      }
      return v;
    });

    // Update driver
    const updatedDrivers = this.state.drivers.map((d) => {
      if (d.id === targetDriver!.id) {
        return {
          ...d,
          status: 'delivering' as const,
          activeOrderId: order.id,
          currentWorkload: Math.min(100, d.currentWorkload + 20),
        };
      }
      return d;
    });

    // Update state
    this.state = {
      ...this.state,
      orders: this.state.orders.map((o) => (o.id === order.id ? updatedOrder : o)),
      vehicles: updatedVehicles,
      drivers: updatedDrivers,
    };

    this.addEvent({
      type: 'ORDER_ASSIGNED',
      title: `Assignment Confirmed for ${order.orderNumber}`,
      description: `Dispatched to ${targetVehicle.companyName} (${targetVehicle.plateNumber}) with Driver ${targetDriver.name}`,
      severity: 'success',
      orderId: order.id,
      vehicleId: targetVehicle.id,
      driverId: targetDriver.id,
    });

    this.notify();
    return true;
  }

  // --- LIVE SIMULATION CONTROLLER ---
  public startSimulation(orderId: string, speedMultiplier: 1 | 2 | 5 | 10 = 2): boolean {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order || !order.assignedVehicleId || !order.assignedDriverId) return false;

    const vehicle = this.state.vehicles.find((v) => v.id === order.assignedVehicleId);
    if (!vehicle) return false;

    // Locate precalculated route from optimization runs if available
    const run = this.state.optimizationRuns.find((r) => r.orderId === orderId);
    let activeRoute: RouteOption;

    if (run && run.selectedCandidate) {
      activeRoute = run.selectedCandidate.bestRouteOption;
    } else {
      const routeOptions = RoutingService.calculateRoutesSync(
        order.sender.location,
        order.recipient.location,
        1.0,
        undefined,
        order.deliveryWindow.type
      );
      activeRoute = routeOptions.find((r) => r.isRecommended) || routeOptions[0];
    }

    // Initialize or resume simulation state
    const simulation: LiveSimulationState = {
      orderId: order.id,
      vehicleId: vehicle.id,
      driverId: order.assignedDriverId,
      isRunning: true,
      isPaused: false,
      speedMultiplier,
      progressPct: 0,
      currentPosition: activeRoute.polyline[0],
      bearing: calculateBearing(
        activeRoute.polyline[0][0],
        activeRoute.polyline[0][1],
        activeRoute.polyline[1][0],
        activeRoute.polyline[1][1]
      ),
      currentSpeedKmh: 45,
      distanceTraveledKm: 0,
      distanceRemainingKm: activeRoute.distanceKm,
      etaMinutes: activeRoute.durationMin,
      status: 'in_transit',
      currentRoute: activeRoute,
      activeIncidents: [],
      rerouteCount: 0,
    };

    this.state = {
      ...this.state,
      activeSimulation: simulation,
      orders: this.state.orders.map((o) => (o.id === order.id ? { ...o, status: 'in_transit' } : o)),
      vehicles: this.state.vehicles.map((v) => (v.id === vehicle.id ? { ...v, status: 'en_route' } : v)),
    };

    this.addEvent({
      type: 'VEHICLE_STARTED',
      title: `Simulation Started: ${vehicle.plateNumber}`,
      description: `En route from ${order.sender.location.landmark || 'Warehouse'} to ${order.recipient.location.landmark || 'Destination'} (${activeRoute.distanceKm} km, ETA ${activeRoute.durationMin}m)`,
      severity: 'info',
      orderId: order.id,
      vehicleId: vehicle.id,
    });

    this.notify();
    this.runSimulationLoop();
    return true;
  }

  public pauseSimulation(): void {
    if (!this.state.activeSimulation) return;
    this.state = {
      ...this.state,
      activeSimulation: { ...this.state.activeSimulation, isPaused: true, isRunning: false },
    };
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.notify();
  }

  public resumeSimulation(): void {
    if (!this.state.activeSimulation) return;
    this.state = {
      ...this.state,
      activeSimulation: { ...this.state.activeSimulation, isPaused: false, isRunning: true },
    };
    this.notify();
    this.runSimulationLoop();
  }

  public setSimulationSpeed(multiplier: 1 | 2 | 5 | 10): void {
    if (!this.state.activeSimulation) return;
    this.state = {
      ...this.state,
      activeSimulation: { ...this.state.activeSimulation, speedMultiplier: multiplier },
    };
    this.notify();
  }

  public resetSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.state = {
      ...this.state,
      activeSimulation: undefined,
    };
    this.notify();
  }

  // --- DYNAMIC INCIDENT INJECTION ---
  public async injectTrafficIncident(delayMinutes: number = 9): Promise<void> {
    const sim = this.state.activeSimulation;
    if (!sim) return;

    const incidentLocation = sim.currentPosition;
    const incidentId = `inc-traffic-${Date.now()}`;

    const newIncident = {
      id: incidentId,
      type: 'traffic' as const,
      description: `Major traffic bottleneck detected ahead (+${delayMinutes} min delay)`,
      delayMinutes,
      location: incidentLocation,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    // Recalculate dynamic alternative route bypassing congestion
    const order = this.state.orders.find((o) => o.id === sim.orderId);
    if (!order) return;

    const currentOrigin = {
      lat: sim.currentPosition[0],
      lng: sim.currentPosition[1],
      address: 'Current Transit Position',
    };

    // Calculate reroute with traffic penalty
    const reroutedOptions = await RoutingService.calculateRoutes(
      currentOrigin,
      order.recipient.location,
      1.8,
      'highway',
      this.state.tomTomApiKey,
      order.deliveryWindow.type
    );
    const newBypassRoute = reroutedOptions.find((r) => r.strategy === 'traffic_avoidance') || reroutedOptions[0];

    const timeSaved = Math.max(4, Math.round(delayMinutes * 0.7));

    this.state = {
      ...this.state,
      activeSimulation: {
        ...sim,
        status: 'rerouting',
        currentSpeedKmh: 18,
        etaMinutes: sim.etaMinutes + delayMinutes - timeSaved,
        activeIncidents: [newIncident, ...sim.activeIncidents],
        currentRoute: newBypassRoute,
        rerouteCount: sim.rerouteCount + 1,
      },
    };

    this.addEvent({
      type: 'TRAFFIC_DETECTED',
      title: `Traffic Congestion Injected (+${delayMinutes} min delay)`,
      description: `Congestion warning at [${incidentLocation[0].toFixed(3)}, ${incidentLocation[1].toFixed(3)}]. Dynamic Rerouting Engine triggered automatically.`,
      severity: 'warning',
      orderId: sim.orderId,
      vehicleId: sim.vehicleId,
    });

    this.addEvent({
      type: 'ROUTE_RECALCULATED',
      title: `Dynamic Reroute Activated: Saved ${timeSaved} Minutes`,
      description: `Diverted vehicle onto ${newBypassRoute.title}. New ETA: ${newBypassRoute.durationMin} min.`,
      severity: 'success',
      orderId: sim.orderId,
      vehicleId: sim.vehicleId,
    });

    this.notify();
  }

  public async injectVehicleBreakdown(): Promise<void> {
    const sim = this.state.activeSimulation;
    if (!sim) return;

    const order = this.state.orders.find((o) => o.id === sim.orderId);
    if (!order) return;

    const brokenVehicle = this.state.vehicles.find((v) => v.id === sim.vehicleId);

    // Find closest available replacement vehicle
    const availableReplacements = this.state.vehicles.filter(
      (v) => v.id !== sim.vehicleId && (v.status === 'available' || v.status === 'en_route') && v.capacityKg >= order.package.weightKg
    );

    const replacement = availableReplacements[0] || this.state.vehicles.find((v) => v.id !== sim.vehicleId);
    const replacementDriver = replacement?.driverId
      ? this.state.drivers.find((d) => d.id === replacement.driverId)
      : this.state.drivers.find((d) => d.status === 'available');

    const incidentId = `inc-breakdown-${Date.now()}`;
    const newIncident = {
      id: incidentId,
      type: 'breakdown' as const,
      description: `Critical engine malfunction detected on ${brokenVehicle?.plateNumber || 'Vehicle'}. Autonomous fleet reassignment in progress.`,
      delayMinutes: 12,
      location: sim.currentPosition,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    // Calculate new route from breakdown position to destination
    const breakdownOrigin = {
      lat: sim.currentPosition[0],
      lng: sim.currentPosition[1],
      address: 'Breakdown Transfer Location',
    };
    const newRoutes = await RoutingService.calculateRoutes(
      breakdownOrigin,
      order.recipient.location,
      1.0,
      undefined,
      this.state.tomTomApiKey,
      order.deliveryWindow.type
    );
    const bestRoute = newRoutes.find((r) => r.isRecommended) || newRoutes[0];

    // Mark broken vehicle into maintenance
    const updatedVehicles = this.state.vehicles.map((v) => {
      if (v.id === sim.vehicleId) return { ...v, status: 'maintenance' as const };
      if (replacement && v.id === replacement.id) return { ...v, status: 'en_route' as const };
      return v;
    });

    this.state = {
      ...this.state,
      vehicles: updatedVehicles,
      activeSimulation: {
        ...sim,
        vehicleId: replacement?.id || sim.vehicleId,
        driverId: replacementDriver?.id || sim.driverId,
        status: 'breakdown_alert',
        currentSpeedKmh: 0,
        activeIncidents: [newIncident, ...sim.activeIncidents],
        currentRoute: bestRoute,
        rerouteCount: sim.rerouteCount + 1,
      },
    };

    this.addEvent({
      type: 'VEHICLE_BREAKDOWN',
      title: `Emergency Breakdown: ${brokenVehicle?.plateNumber}`,
      description: `Mechanical failure at [${sim.currentPosition[0].toFixed(3)}, ${sim.currentPosition[1].toFixed(3)}]. Vehicle marked for Maintenance.`,
      severity: 'error',
      orderId: sim.orderId,
      vehicleId: brokenVehicle?.id,
    });

    if (replacement && replacementDriver) {
      this.addEvent({
        type: 'VEHICLE_REASSIGNED',
        title: `Auto-Reassigned to ${replacement.plateNumber}`,
        description: `Mission transferred to Driver ${replacementDriver.name} (${replacement.companyName}). Route recalculated.`,
        severity: 'success',
        orderId: sim.orderId,
        vehicleId: replacement.id,
        driverId: replacementDriver.id,
      });
    }

    this.notify();
  }

  public resolveConflict(conflictId: string): void {
    const conflict = this.state.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    this.state = {
      ...this.state,
      conflicts: this.state.conflicts.map((c) => (c.id === conflictId ? { ...c, status: 'resolved' as const } : c)),
    };

    this.addEvent({
      type: 'ROUTE_RECALCULATED',
      title: `Route Conflict Resolved`,
      description: `Applied recommended rerouting for ${conflict.vehicleBPlate}. Saved ${conflict.estimatedTimeSavedMin} minutes of congestion queue.`,
      severity: 'success',
      vehicleId: conflict.vehicleBId,
    });

    this.notify();
  }

  // --- INTERNAL TICK LOOP ---
  private runSimulationLoop(): void {
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = setInterval(() => {
      const sim = this.state.activeSimulation;
      if (!sim || !sim.isRunning || sim.isPaused) return;

      const stepInc = 1.2 * sim.speedMultiplier;
      const newProgress = Math.min(100, sim.progressPct + stepInc);

      const { position, bearing } = getPositionAtProgress(sim.currentRoute.polyline, newProgress);

      const totalDist = sim.currentRoute.distanceKm;
      const distTraveled = Number(((newProgress / 100) * totalDist).toFixed(2));
      const distRemaining = Number((totalDist - distTraveled).toFixed(2));
      const remainingTimeMin = Math.max(0, Math.round(((100 - newProgress) / 100) * sim.currentRoute.durationMin));

      // Check if finished
      if (newProgress >= 100) {
        this.pauseSimulation();
        this.completeDelivery(sim.orderId);
        return;
      }

      // Update vehicle position in fleet list as well
      const updatedVehicles = this.state.vehicles.map((v) => {
        if (v.id === sim.vehicleId) {
          return {
            ...v,
            currentLocation: {
              lat: position[0],
              lng: position[1],
              address: 'In Transit',
            },
            speedKmh: sim.status === 'traffic_slowdown' ? 18 : 42,
          };
        }
        return v;
      });

      this.state = {
        ...this.state,
        vehicles: updatedVehicles,
        activeSimulation: {
          ...sim,
          progressPct: Number(newProgress.toFixed(1)),
          currentPosition: position,
          bearing,
          distanceTraveledKm: distTraveled,
          distanceRemainingKm: distRemaining,
          etaMinutes: remainingTimeMin,
          status: sim.status === 'breakdown_alert' ? 'in_transit' : sim.status,
          currentSpeedKmh: sim.status === 'rerouting' ? 35 : 44,
        },
      };

      this.notify();
    }, 400);
  }

  public completeDelivery(orderId: string): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const deliveredAt = new Date().toISOString();

    const updatedOrders = this.state.orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivered' as const,
          deliveredAt,
        };
      }
      return o;
    });

    const updatedVehicles = this.state.vehicles.map((v) => {
      if (v.id === order.assignedVehicleId) {
        return {
          ...v,
          status: 'available' as const,
          currentLoadKg: Math.max(0, v.currentLoadKg - order.package.weightKg),
          availableCapacityKg: v.capacityKg,
          assignedOrderId: undefined,
        };
      }
      return v;
    });

    const updatedDrivers = this.state.drivers.map((d) => {
      if (d.id === order.assignedDriverId) {
        return {
          ...d,
          status: 'available' as const,
          completedDeliveriesToday: d.completedDeliveriesToday + 1,
          totalCompletedDeliveries: d.totalCompletedDeliveries + 1,
          currentWorkload: Math.max(10, d.currentWorkload - 20),
          activeOrderId: undefined,
        };
      }
      return d;
    });

    this.state = {
      ...this.state,
      orders: updatedOrders,
      vehicles: updatedVehicles,
      drivers: updatedDrivers,
      activeSimulation: this.state.activeSimulation
        ? {
            ...this.state.activeSimulation,
            status: 'delivered',
            progressPct: 100,
            distanceRemainingKm: 0,
            etaMinutes: 0,
            isRunning: false,
          }
        : undefined,
    };

    this.addEvent({
      type: 'DELIVERY_COMPLETED',
      title: `Order ${order.orderNumber} Delivered Successfully`,
      description: `Package handed over at ${order.recipient.location.address?.slice(0, 30)}... Mission accomplished.`,
      severity: 'success',
      orderId: order.id,
      vehicleId: order.assignedVehicleId,
      driverId: order.assignedDriverId,
    });

    this.notify();
  }

  // --- ANALYTICS COMPUTATION ---
  public getAnalytics(): AnalyticsSummary {
    const orders = this.state.orders;
    const vehicles = this.state.vehicles;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');

    const totalDistance = orders.reduce((sum, o) => sum + (o.estimatedDistanceKm || 12), 0);
    const avgDistance = orders.length > 0 ? Number((totalDistance / orders.length).toFixed(1)) : 14.5;

    const totalTime = orders.reduce((sum, o) => sum + (o.estimatedTravelTimeMin || 25), 0);
    const avgTime = orders.length > 0 ? Math.round(totalTime / orders.length) : 26;

    const totalCost = orders.reduce((sum, o) => sum + (o.estimatedCostInr || 110), 0);
    const totalSavings = Math.round(totalCost * 0.22);

    const availableCount = vehicles.filter((v) => v.status === 'available').length;
    const enRouteCount = vehicles.filter((v) => v.status === 'en_route' || v.status === 'delivering' || v.status === 'assigned').length;
    const activeConflictsCount = this.state.conflicts.filter((c) => c.status === 'active').length;

    const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacityKg, 0);
    const currentLoadTotal = vehicles.reduce((sum, v) => sum + v.currentLoadKg, 0);
    const fleetUtilization = totalCapacity > 0 ? Math.round((currentLoadTotal / totalCapacity) * 100) : 68;

    return {
      activeDeliveries: enRouteCount,
      availableVehicles: availableCount,
      vehiclesEnRoute: enRouteCount,
      completedDeliveriesToday: deliveredOrders.length + 24,
      avgDeliveryTimeMin: avgTime,
      avgDistanceKm: avgDistance,
      totalOperatingCostInr: totalCost + 4200,
      totalOptimizationSavingsInr: totalSavings + 1850,
      activeRouteConflicts: activeConflictsCount,
      totalCarbonSavedKg: Number((totalDistance * 0.082).toFixed(1)),
      fleetUtilizationPct: Math.max(45, Math.min(95, fleetUtilization + 22)),
      onTimeDeliveryRatePct: 98.4,
      statusCounts: {
        pending: orders.filter((o) => o.status === 'pending').length,
        assigned: orders.filter((o) => o.status === 'assigned').length,
        in_transit: orders.filter((o) => o.status === 'in_transit').length,
        delayed: orders.filter((o) => o.status === 'delayed').length,
        delivered: deliveredOrders.length,
        cancelled: orders.filter((o) => o.status === 'cancelled').length,
      },
      companyPerformance: this.state.companies.map((comp) => {
        const compVehicles = vehicles.filter((v) => v.companyId === comp.id);
        const compOrders = orders.filter((o) => o.assignedCompanyId === comp.id);
        return {
          name: comp.name,
          deliveries: comp.totalDeliveries + compOrders.length,
          onTimeRate: comp.onTimeRate,
          avgTime: 22 + Math.floor(Math.random() * 8),
          utilization: 75 + Math.floor(Math.random() * 20),
        };
      }),
      hourlyPerformance: [
        { hour: '08:00', standardEta: 42, optimizedEta: 31, orders: 12 },
        { hour: '10:00', standardEta: 55, optimizedEta: 38, orders: 28 },
        { hour: '12:00', standardEta: 48, optimizedEta: 34, orders: 35 },
        { hour: '14:00', standardEta: 58, optimizedEta: 39, orders: 42 },
        { hour: '16:00', standardEta: 62, optimizedEta: 43, orders: 38 },
        { hour: '18:00', standardEta: 68, optimizedEta: 46, orders: 45 },
        { hour: '20:00', standardEta: 39, optimizedEta: 28, orders: 20 },
      ],
      beforeAfterComparison: [
        { metric: 'Average Distance (km)', before: 21.4, after: 16.8, unit: 'km', improvementPct: 21.5 },
        { metric: 'Transit Time (min)', before: 46.0, after: 32.0, unit: 'min', improvementPct: 30.4 },
        { metric: 'Operating Cost (₹)', before: 184.0, after: 138.0, unit: '₹', improvementPct: 25.0 },
        { metric: 'Fleet Utilization (%)', before: 54.0, after: 82.0, unit: '%', improvementPct: 51.8 },
        { metric: 'Route Conflicts (count)', before: 8.0, after: 1.0, unit: 'conflicts', improvementPct: 87.5 },
      ],
    };
  }

  // --- 1-CLICK DEMO SCENARIO RESETTER ---
  public loadDemoScenario(): void {
    this.resetSimulation();
    this.state = {
      currentUser: SEED_USERS[0],
      users: [...SEED_USERS],
      companies: [...SEED_COMPANIES],
      vehicles: [...SEED_VEHICLES],
      drivers: [...SEED_DRIVERS],
      orders: [...SEED_ORDERS],
      systemEvents: [...SEED_SYSTEM_EVENTS],
      conflicts: [...SEED_CONFLICTS],
      optimizationRuns: [],
      weights: { ...DEFAULT_OPTIMIZATION_WEIGHTS },
      activeCityFilter: 'Mumbai',
      analytics: this.getAnalytics(),
      tomTomApiKey: this.state.tomTomApiKey,
    };
    this.addEvent({
      type: 'ORDER_CREATED',
      title: 'Full Logistics Demo Scenario Loaded',
      description: 'Initialized 10+ Companies, 15+ Active Fleet Vehicles, 16 Drivers, 100+ Locations, Conflicts, and Pre-configured Mumbai Corridor.',
      severity: 'info',
    });
    this.notify();
  }
}

export const logisticsStore = new LogisticsStore();
