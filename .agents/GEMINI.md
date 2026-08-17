# LogiRoute OS - Agent Guidelines & Repository Context

Welcome agent! This file outlines the architecture, rules, and operational guidelines for assisting in the development and maintenance of the LogiRoute OS repository.

---

## 🎯 Architecture Overview
LogiRoute OS is an Intelligent Route Optimization & Simulation Engine composed of:
1. **Frontend Client**: React 19 SPA using Tailwind CSS for UI and Leaflet for maps/routing display.
2. **In-Memory Store**: A client-side store (`src/lib/store.ts`) that manages state and performs calculations.
3. **Backend Server**: Express server (`server.ts`) that runs Vite in development mode and serves static client builds in production, exposing mock JSON REST endpoints mirroring the local routing services.
4. **Routing Engine**: Interacts with the TomTom API when configured, and falls back to high-fidelity grid geometries when no key is supplied.

---

## 🛠️ Code Conventions & Design System
* **No Placeholders**: Never leave mock placeholder coordinates or functions.
* **Leaflet Overlay Isolation**: Ensure Leaflet map elements use `z-0` layout and modals use `z-[9999]` to prevent overlap problems.
* **Type Safety**: Maintain strict TypeScript typing. Run `npm run lint` (`tsc --noEmit`) to verify.

---

## ⚡ Agent Limits & Boundaries
* **State Persistence**: The backend uses in-memory seed data. Reboots will reset data back to the default state.
* **API Constraints**: The TomTom routing engine sub-samples route path arrays to stay within CPU and memory budget limitations. Do not disable sub-sampling as it triggers Leaflet thread hangs.
