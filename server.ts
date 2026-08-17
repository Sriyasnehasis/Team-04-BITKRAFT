import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_OPTIMIZATION_WEIGHTS, OptimizationEngine } from './src/lib/optimization-engine';
import { RoutingService } from './src/lib/routing-engine';
import {
  SEED_COMPANIES,
  SEED_CONFLICTS,
  SEED_DRIVERS,
  SEED_ORDERS,
  SEED_SYSTEM_EVENTS,
  SEED_VEHICLES,
} from './src/lib/seed-data';
import { Order, OptimizationWeights } from './src/types/logistics';

// In-memory backend database state
let dbOrders = [...SEED_ORDERS];
let dbVehicles = [...SEED_VEHICLES];
let dbDrivers = [...SEED_DRIVERS];
let dbCompanies = [...SEED_COMPANIES];
let dbConflicts = [...SEED_CONFLICTS];
let dbEvents = [...SEED_SYSTEM_EVENTS];
let dbWeights: OptimizationWeights = { ...DEFAULT_OPTIMIZATION_WEIGHTS };

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LogiRoute OS Intelligent Route Optimization & Simulation Engine',
      timestamp: new Date().toISOString(),
      stats: {
        orders: dbOrders.length,
        vehicles: dbVehicles.length,
        drivers: dbDrivers.length,
        companies: dbCompanies.length,
      },
    });
  });

  // Orders API
  app.get('/api/orders', (req, res) => {
    const status = req.query.status as string;
    if (status) {
      return res.json(dbOrders.filter((o) => o.status === status));
    }
    res.json(dbOrders);
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = dbOrders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    try {
      const body = req.body;
      const newOrder: Order = {
        ...body,
        id: `ord-${Date.now()}`,
        orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      dbOrders.unshift(newOrder);

      // Add system event
      dbEvents.unshift({
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'ORDER_CREATED',
        title: `Order ${newOrder.orderNumber} Created`,
        description: `Order for ${newOrder.package?.weightKg} kg (${newOrder.package?.type}) logged in system.`,
        severity: 'info',
        orderId: newOrder.id,
      });

      res.status(201).json(newOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Optimization Engine API
  app.post('/api/optimize', (req, res) => {
    try {
      const { orderId, customWeights } = req.body;
      const order = dbOrders.find((o) => o.id === orderId);
      if (!order) return res.status(404).json({ error: 'Order not found for optimization' });

      const activeWeights = customWeights || dbWeights;
      const activeRoutes = dbVehicles
        .filter((v) => v.status === 'en_route' || v.status === 'delivering')
        .map((v) => ({
          vehicleId: v.id,
          polyline: [[v.currentLocation.lat, v.currentLocation.lng] as [number, number]],
        }));

      const run = OptimizationEngine.evaluateOrder(
        order,
        dbVehicles,
        dbDrivers,
        dbCompanies,
        activeWeights,
        activeRoutes
      );

      res.json(run);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Assignment API
  app.post('/api/assign', async (req, res) => {
    try {
      const { orderId, vehicleId, driverId } = req.body;
      const order = dbOrders.find((o) => o.id === orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const vehicle = dbVehicles.find((v) => v.id === vehicleId);
      const driver = dbDrivers.find((d) => d.id === driverId);

      if (!vehicle || !driver) {
        return res.status(400).json({ error: 'Vehicle or Driver not found for assignment' });
      }

      const routes = await RoutingService.calculateRoutes(
        order.sender.location,
        order.recipient.location,
        1.0,
        undefined,
        process.env.TOMTOM_API_KEY
      );
      const bestRoute = routes.find((r) => r.isRecommended) || routes[0];

      order.status = 'assigned';
      order.assignedCompanyId = vehicle.companyId;
      order.assignedCompanyName = vehicle.companyName;
      order.assignedVehicleId = vehicle.id;
      order.assignedVehiclePlate = vehicle.plateNumber;
      order.assignedVehicleType = vehicle.vehicleType;
      order.assignedDriverId = driver.id;
      order.assignedDriverName = driver.name;
      order.assignedDriverPhone = driver.phone;
      order.routeId = bestRoute.id;
      order.estimatedDistanceKm = bestRoute.distanceKm;
      order.estimatedTravelTimeMin = bestRoute.durationMin;
      order.estimatedCostInr = bestRoute.estimatedCostInr;

      vehicle.status = 'assigned';
      vehicle.currentLoadKg += order.package.weightKg;
      vehicle.availableCapacityKg = Math.max(0, vehicle.capacityKg - vehicle.currentLoadKg);

      driver.status = 'delivering';
      driver.currentWorkload = Math.min(100, driver.currentWorkload + 20);

      res.json({ success: true, order, vehicle, driver });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fleet & Resources
  app.get('/api/vehicles', (req, res) => res.json(dbVehicles));
  app.get('/api/drivers', (req, res) => res.json(dbDrivers));
  app.get('/api/companies', (req, res) => res.json(dbCompanies));
  app.get('/api/conflicts', (req, res) => res.json(dbConflicts));
  app.get('/api/events', (req, res) => res.json(dbEvents.slice(0, 50)));

  // Routing API calculation endpoint
  app.post('/api/routes/calculate', async (req, res) => {
    try {
      const { origin, destination, trafficMultiplier } = req.body;
      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and Destination required' });
      }
      const routes = await RoutingService.calculateRoutes(
        origin,
        destination,
        trafficMultiplier || 1.0,
        undefined,
        process.env.TOMTOM_API_KEY
      );
      res.json(routes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Optimization Weights Settings API
  app.get('/api/settings/weights', (req, res) => res.json(dbWeights));
  app.post('/api/settings/weights', (req, res) => {
    dbWeights = { ...dbWeights, ...req.body };
    res.json({ success: true, weights: dbWeights });
  });

  // Reset Demo Scenario API
  app.post('/api/demo/reset', (req, res) => {
    dbOrders = [...SEED_ORDERS];
    dbVehicles = [...SEED_VEHICLES];
    dbDrivers = [...SEED_DRIVERS];
    dbCompanies = [...SEED_COMPANIES];
    dbConflicts = [...SEED_CONFLICTS];
    dbEvents = [...SEED_SYSTEM_EVENTS];
    dbWeights = { ...DEFAULT_OPTIMIZATION_WEIGHTS };
    res.json({ success: true, message: 'Logistics Demo Scenario Restored' });
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LogiRoute OS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
