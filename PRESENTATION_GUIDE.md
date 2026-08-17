# LogiRoute OS - Technical Architecture & Presentation Guide

Welcome to the **LogiRoute OS** project presentation guide. This document provides a deep-dive into the concepts, architecture, pipelines, and workflows of the application, followed by a step-by-step script to deliver a stellar project demonstration to the evaluation panel.

---

## 📖 Table of Contents
1. **System Overview** (What is LogiRoute OS?)
2. **Project Directory Structure**
3. **Core Concepts & Mathematical Optimization Engine**
4. **TomTom API Integration & Routing Strategies**
5. **Live Telemetry & Conflict Detection**
6. **Backend Endpoints & API Schema**
7. **Step-by-Step Panel Demonstration Script**

---

## 1. System Overview

**LogiRoute OS** is an intelligent, real-time logistics dispatch and route optimization platform. It bridges the gap between static order management and dynamic fleet execution. 

Unlike traditional static routing systems, LogiRoute OS combines:
* **Deterministic Multi-Criteria Optimization:** To score and match orders to the most suitable vehicle/driver combination in real-time.
* **Actual Real-World Street Routing (TomTom API):** To draw live traffic-aware corridors.
* **Autonomous Event-Driven Rerouting:** To automatically recalculate routes during transit in response to traffic congestion or vehicle breakdowns.
* **Proactive Conflict Detection:** To locate spatial and temporal overlaps in vehicle routes to prevent bottleneck delays.

---

## 2. Project Directory Structure

```text
Team-04-BITKRAFT/
│
├── server.ts                 # Express Backend Server (dev API & index.html Vite middleware)
├── index.html                # Main SPA page frame (contains optimized SEO tags & styling CDN)
├── SUMMARY.md                # High-level recap of changes made
├── PRESENTATION_GUIDE.md     # This document (panel presentation guide)
├── tsconfig.json             # TypeScript compiler settings
├── vite.config.ts            # Vite bundler configuration
│
└── src/
    ├── main.tsx              # React application mounting point
    ├── index.css             # Core CSS (Tailwind CSS directives & custom Leaflet z-index patches)
    │
    ├── types/
    │   └── logistics.ts      # TypeScript interfaces (Order, Vehicle, Driver, RouteOption, etc.)
    │
    ├── lib/
    │   ├── store.ts          # Client-side LogisticsStore (state manager, timers, actions, events)
    │   ├── seed-data.ts      # Mock database seeds (pre-defined companies, vehicles, orders)
    │   ├── geo.ts            # Harvesine distance calculations & Leaflet mapping helpers
    │   ├── conflict-detector.ts # Route corridor spatial bottleneck overlap calculations
    │   ├── routing-engine.ts # TomTom Routing API caller, polyline sub-sampler, & fallback mock generator
    │   └── optimization-engine.ts # Multi-criteria ranking and EV battery range logic
    │
    └── components/
        ├── layout/
        │   └── Navbar.tsx    # Header navbar (controls current tab, role-switching, settings trigger)
        ├── map/
        │   └── LogisticsMap.tsx # Leaflet Map Wrapper (renders pins, active vehicles, routes, conflicts)
        ├── dashboard/
        │   └── OperationsDashboard.tsx # Live Operations panel (order dispatch lists, simulation controls)
        ├── optimization/
        │   └── OptimizationView.tsx # Side-by-side comparative dashboard for vehicle scoring rankings
        ├── orders/
        │   ├── OrdersTable.tsx # Grid listing pending and completed shipments
        │   └── OrderCreationModal.tsx # Dialog to create new shipments (addresses, priority, package details)
        ├── settings/
        │   └── OptimizationSettingsModal.tsx # Dialog to adjust scoring weights & input TomTom API Key
        └── analytics/
            └── AnalyticsView.tsx # Charts summarizing avg distance, operating cost comparisons, carbon offsets
```

---

## 3. Core Concepts & Mathematical Optimization Engine

At the heart of the platform is the **Multi-Criteria Optimization Engine** ([`optimization-engine.ts`](src/lib/optimization-engine.ts)). When an order is optimized, it goes through a two-stage filter and scoring pipeline:

### Stage A: Hard-Constraint Safety Filters
Before scoring a vehicle, the engine checks if the vehicle is legally and physically capable of delivering the package:
1. **Weight Capacity check:** The package weight must not exceed the vehicle's available carrying capacity (`currentLoadKg + package.weightKg <= capacityKg`).
2. **Hazardous materials check:** If the package contains hazardous cargo, the vehicle type must not be a two-wheeler (scooters/motorcycles).
3. **Fragile cargo check:** If the package is fragile, it cannot be assigned to a two-wheeler.
4. **EV Range validation:** If the vehicle is Electric (EV), the total estimated transit distance (distance from vehicle to pickup + route distance from pickup to recipient) must be within the vehicle's current remaining battery range:
   $$\text{Remaining Range} = \text{maxRangeKm} \times \left( \frac{\text{batteryPct}}{100} \right)$$
   If any check fails, the candidate is **Hard Rejected** with an explanatory log.

### Stage B: Multi-Criteria Scoring (Parametric Heuristics)
Eligible candidates are scored on a scale of $0 \text{ to } 100$ overall, calculated as a weighted average of five parameters:

$$\text{Composite Score} = \frac{(S_{\text{time}} \times W_{\text{time}}) + (S_{\text{dist}} \times W_{\text{dist}}) + (S_{\text{cap}} \times W_{\text{cap}}) + (S_{\text{cost}} \times W_{\text{cost}}) + (S_{\text{green}} \times W_{\text{green}})}{\sum \text{Weights}}$$

* **Travel Time Score ($S_{\text{time}}$):** Matches the calculated TomTom duration against the delivery SLA window. If the route arrives well within the window, the score is $100$. If it misses the deadline, the score drops to $0$.
* **Proximity Score ($S_{\text{dist}}$):** Evaluates how close the vehicle is to the pickup point. Closer vehicles score higher.
* **Capacity Match Score ($S_{\text{cap}}$):** Rewards high cargo utilization. E.g., filling a van to 80% is scored higher than dispatching a large empty truck to deliver a 1kg envelope.
* **Operating Cost Score ($S_{\text{cost}}$):** Based on the vehicle type's fuel/maintenance rate per km, driver hourly rate, and toll road costs.
* **Green Fleet Priority ($S_{\text{green}}$):** Awards bonus points for zero-emission EV vehicles.

---

## 4. TomTom API Integration & Routing Strategies

When a TomTom API key is configured, the application makes real-world HTTP requests directly from the client to the **TomTom Routing API** (utilizing CORS support). The routing flow is defined in [`routing-engine.ts`](src/lib/routing-engine.ts):

### A. TomTom API Endpoints Used
The engine triggers three parallel fetch calls to TomTom's Routing service:
1. **Fastest Route:**
   `https://api.tomtom.com/routing/1/calculateRoute/{origin}/{destination}/json?key={apiKey}&routeType=fastest&maxAlternatives=1&traffic=true`
   * Fetches the fastest route considering real-time traffic speeds, and queries for 1 alternative (used as a bypass reroute).
2. **Shortest Route:**
   `https://api.tomtom.com/routing/1/calculateRoute/{origin}/{destination}/json?key={apiKey}&routeType=shortest&traffic=false`
   * Fetches the physically shortest geographic path.
3. **Eco-Friendly Route:**
   `https://api.tomtom.com/routing/1/calculateRoute/{origin}/{destination}/json?key={apiKey}&routeType=eco`
   * Fetches the route optimized for fuel and energy conservation.

### B. Dynamic Recommendations based on Delivery Priorities
The recommendation selection matches route styles to the shipment's urgency:
* **Express & Same Day:** The engine selects the **Fastest Route** as the recommended choice, giving travel time an 80% weight.
* **Standard:** The engine recommends the **Shortest Route** or **Eco-Friendly Route**, shifting the weight to minimize operating costs and fuel consumption.

### C. Coordinate Sub-Sampling
To prevent rendering delays in Leaflet, the coordinates returned from TomTom are sub-sampled. Instead of mapping all thousands of coordinate steps, the engine picks every $N$-th coordinate (based on the distance) while always keeping the exact start and endpoints.

---

## 5. Live Telemetry & Conflict Detection

Once an optimized route is confirmed, the **Simulation Loop** ([`store.ts`](src/lib/store.ts)) starts a live ticker interval (every 1 second):
* **Movement:** Calculates the vehicle's position along the TomTom route polyline coordinate steps.
* **ETA Updates:** Computes remaining travel time based on current vehicle speed and coordinate indices.
* **Battery Consumption:** Decreases EV battery percentage proportionally to distance traveled.
* **Route Conflicts:** The conflict detector ([`conflict-detector.ts`](src/lib/conflict-detector.ts)) constantly runs a spatial check comparing active en-route polylines. If two vehicles are scheduled to be in the same geographic grid block at the same time, a **Bottleneck Conflict Alert** is raised on the dashboard.

---

## 6. Backend Endpoints & API Schema

The mock API runs on an Express backend ([`server.ts`](server.ts)), managing simulated database states for demo reloads:

| HTTP Method | Endpoint | Description | Query/Body Schema |
|-------------|----------|-------------|-------------------|
| **GET** | `/api/orders` | Retrieves all active and historical orders. | None |
| **POST** | `/api/orders` | Creates a new order. | `{ sender, recipient, package, deliveryWindow }` |
| **GET** | `/api/vehicles` | Retrieves the status of all active fleet vehicles. | None |
| **GET** | `/api/drivers` | Retrieves driver shifts, phone numbers, and workloads. | None |
| **POST** | `/api/assign` | Assigns an order to a vehicle/driver and calculates its route. | `{ orderId, vehicleId, driverId }` |
| **POST** | `/api/routes/calculate` | Calculates routes between coordinates using TomTom (falls back to mock coordinates). | `{ origin, destination, trafficMultiplier }` |
| **POST** | `/api/optimize` | Runs the optimization engine for a specific order and returns scores. | `{ orderId, customWeights }` |

---

## 7. Step-by-Step Panel Demonstration Script

Use this walkthrough script to demonstrate LogiRoute OS to the evaluation panel.

### Step 1: Initialize the Demo
1. Open the app in your browser: `http://127.0.0.1:3000/`.
2. Click **Demo Scenario** in the header. This resets all states and loads a pre-configured scenario containing 10 companies, 15 vehicles, and 16 active drivers.
3. *Explain to the Panel:* "We are starting with a clean state simulating an active morning shift in Mumbai/Pune."

### Step 2: Configure the TomTom API Key
1. Click the gear icon (**⚙️**) next to the Admin role switcher.
2. In the configuration modal, point out the **TomTom API Key Configuration** field.
3. Paste the TomTom API Key: `dV3Tq3qAYr9qOCtHUISX27pZgRZvW5gw` and click **Apply & Save Weights**.
4. Show the notification event in the bottom-left pane: *"TomTom API Key Configuration Saved: Real-time route calculation active."*
5. *Explain to the Panel:* "We have successfully linked our client-side state machine directly with the TomTom Route Calculation API. All routing coordinates shown will now represent actual street-grid paths."

### Step 3: Create a New Order
1. Click the blue **+ New Order** button in the header.
2. Fill in the sender and recipient details (e.g., from Bandra to Colaba).
3. Set the **Delivery Priority** to **Express** (indicating an urgent SLA).
4. Click **Create & Optimize Order**.
5. *Explain to the Panel:* "Creating an Express order automatically triggers our multi-criteria engine. Since it is marked Express, the algorithm will prioritize the fastest transit corridors."

### Step 4: Run Multi-Criteria Optimization
1. In the **Optimization Engine** tab, you will see a list of eligible vehicles.
2. Show that **5 vehicles are Hard Rejected** (e.g., due to weight limitations, or an EV vehicle not having enough battery charge to cover the Bandra-Colaba distance).
3. Select the **Rank #1** vehicle (e.g., `EV-204`).
4. Point out the score details: *"Why was this fleet assignment selected?"* Show the panel the checklist explaining that this vehicle represents the best combination of speed SLA compliance and lowest operating cost.
5. Click the green **Confirm & Start Live Simulation** button.

### Step 5: Live Simulation & Telemetry Rerouting
1. You will be redirected to the **Live Operations** tab. The vehicle will start moving along the route on the Leaflet map.
2. Click the map: point out the realistic road bends, flyovers, and route overlay coordinates computed by TomTom.
3. While the vehicle is transit, click **Inject Traffic Jam** on the sidebar.
4. Watch the map and event log:
   * A traffic bottleneck alert is raised.
   * The vehicle status changes to **rerouting**.
   * *Dynamic Rerouting Trigger:* The store automatically makes a live call to the TomTom API, receives the bypass route, and redirects the vehicle on-screen, saving transit time!
5. Now, click **Simulate Vehicle Breakdown**:
   * The vehicle status changes to maintenance.
   * The engine automatically identifies the nearest available vehicle.
   * It calculates the TomTom route from the breakdown coordinate to the recipient and dispatches the replacement vehicle to complete the delivery.
6. *Explain to the Panel:* "This demonstrates the autonomous routing capability. In case of real-world exceptions, the engine makes local TomTom queries to keep shipments moving without manual operator intervention."

---

## 8. Team Presentation Role Assignment (4 Presenters)

To deliver a coordinated, professional defense of LogiRoute OS to the panel, divide the presentation roles and live demo tasks as follows:

| Role & Presenter | Responsibilities | Live Demo Task |
|---|---|---|
| **Presenter 1: Project Lead & UI Host** | • Project introduction & problem statement.<br>• General architecture and high-level structure.<br>• System telemetry events. | • Opens `http://127.0.0.1:3000/`. <br>• Clicks **Demo Scenario** to initialize clean state.<br>• Opens settings modal, pastes TomTom API Key, and saves. |
| **Presenter 2: Product & Safety Specialist** | • Order Dispatching lifecycle.<br>• **Hard Constraint Safety Filters** (battery charge checks, hazmat constraints, weight limits). | • Clicks **+ New Order** and creates an **Express** delivery order.<br>• Points out the Hard Rejected list (explaining why specific vehicles failed safety parameters). |
| **Presenter 3: Algorithm & TomTom Specialist** | • **Multi-Criteria Score Heuristics** formula.<br>• TomTom routing query strategies (Fastest vs. Shortest, Eco).<br>• Waypoint coordinates sub-sampling. | • Reviews the Rank #1 vehicle scoring metrics and reasons checklist.<br>• Clicks **Confirm & Start Live Simulation** and explains how TomTom route curves map to Leaflet dynamically. |
| **Presenter 4: Operations & Telemetry Specialist** | • Live movement simulation loop.<br>• Route conflict overlap detection.<br>• Dynamic incident handling (traffic congestion reroutes & breakdowns). | • Clicks **Inject Traffic Jam** (demonstrates live TomTom bypass rerouting).<br>• Clicks **Simulate Vehicle Breakdown** (demonstrates autonomous fleet swapping).<br>• Opens Analytics tab to summarize metrics improvements. |

