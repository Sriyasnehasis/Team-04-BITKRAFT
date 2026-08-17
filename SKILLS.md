# LogiRoute OS - Technical Skills Inventory

This document maps the core engineering, algorithmic, and software development skills applied to implement and deploy the **LogiRoute OS** application.

---

## 🛠️ 1. Frontend & UI Engineering
* **Component-Based SPA Architecture:** Developed using React and TypeScript, managing view transitions, responsive layouts, and modal overlay states.
* **High-Fidelity Tailwind CSS Styling:** Applied custom design systems including:
  * Glassmorphism effects.
  * Custom layering variables (`z-[9999]`) to fix Leaflet vector overlays bleeding through backdrops.
  * Vibrant indicator tags (for priorities, fuel percentages, and candidate rankings).
* **Modular Code Separation:** Segmented concerns between UI presentation layers (dashboard, settings modal, analytics graphs) and backend/data manipulation engines.

---

## 🧠 2. Algorithmic & Heuristics Engineering
* **Multi-Criteria Optimization Scoring:** Designed a parametric formula to grade candidate vehicles ($0 \text{ to } 100$) based on soft metrics (travel time SLA compatibility, depot proximity, capacity utilization, operating costs, and carbon offsets).
* **Constraint-Based Filtering:** Implemented a two-stage filter pipeline that excludes candidates matching hard rejections (weight over-capacity, hazardous cargo bans on two-wheelers, and EV battery charge deficits).
* **EV Range Safety Calculations:** Coded mathematical battery consumption checks against remaining charge percentages:
  $$\text{Trip Distance} \le \text{maxRange} \times \frac{\text{batteryPct}}{100}$$

---

## 🗺️ 3. GIS & Spatial Mapping (Leaflet)
* **Leaflet Map Vector Overlay Rendering:** Plotted active vehicle telemetry pins, warehouse locations, and path polylines.
* **Spatial Intersection Mathematics:** Built checking loops to analyze active vehicle paths and trigger alerts if route vectors physically overlap within a coordinate boundary at the same time (Spatial Overlap/Bottleneck Conflicts).
* **Dynamic Marker Telemetry:** Programmed state timers to update GPS pin coordinates smoothly as simulated vehicles move.

---

## 📡 4. REST APIs & Integrations (TomTom)
* **Direct Client-Side Fetch (CORS):** Implemented asynchronous network fetch calls directly to TomTom calculateRoute endpoints.
* **Parallel Asynchronous Operations:** Utilized `Promise.all` pipelines to query multiple route strategies (fastest, shortest, eco) simultaneously.
* **Telemetry Data Compression (Sub-sampling):** Wrote sub-sampling algorithms to filter coordinate listings, reducing polyline overhead by selecting every $N$-th step.
* **Express REST Endpoints:** Set up local mock databases and API routes under Express to mock backend dispatch systems.

---

## 📦 5. DevOps & Version Control
* **TypeScript Compiler Integrity:** Addressed typed interfaces and return promises to guarantee clean compilation (`tsc --noEmit` exits with status `0`).
* **Git Version Management:** Initialized local repositories, configured `.gitignore` filters, staged files, committed features, and pushed branches to GitHub.
