# LogiRoute OS 🚚💨
### Intelligent Route Optimization & Simulation Engine

LogiRoute OS is a real-time routing optimization dashboard and simulation sandbox designed for modern logistics operators and customers. It uses priority-based scoring heuristics, real-world mapping, and API fallback algorithms to maximize fleet utilization, minimize travel times, and resolve transit incidents dynamically.

---

## 🎯 1. Evaluation & Judging Criteria Alignment

### 📋 Problem Understanding & Agent Scope
* **The Problem**: Traditional logistics dispatching relies on manual vehicle assignments, static routes, and slow responses to transit incidents (e.g., breakdown, traffic delays).
* **Our Solution**: LogiRoute OS automates dispatching using multi-criteria optimization weights (Time, Distance, and Cost) to match incoming orders with the optimal vehicle and driver.
* **Agent Scope**: The agent assists in:
  1. Integrating third-party APIs (TomTom Routing & Traffic APIs).
  2. Modifying scoring weights depending on order delivery priority.
  3. Orchestrating UI adjustments (Leaflet modal layering, interactive dashboard states).
  4. Setting up fallbacks to ensure zero-downtime offline execution.

### 🤖 Agent Specification Files & Configurations
Custom agent configuration guidelines are embedded in the workspace:
* [**`.agents/GEMINI.md`**](file:///.agents/GEMINI.md): Defines repo context, styling, and coding constraints.
* [**`.agents/skills/logiroute-engine/SKILL.md`**](file:///.agents/skills/logiroute-engine/SKILL.md): Details the route evaluation algorithms and API integration standards.

### 🔄 Prompting & Iteration Process
Development followed a rigorous iterative feedback loop:
1. **API Integration**: Connected the TomTom Routing API with asynchronous fetching, adding a secure settings panel that persists credentials.
2. **Dynamic UI Improvements**: Resolved a critical z-index layering bug where Leaflet's maps bled through input dialogs. Fixed styling bugs using strict Tailwind classes.
3. **TypeScript Alignment**: Ensured clean compilation using strict types across frontend stores and Express endpoints (`tsc --noEmit` exits with status `0`).

### ⚡ Agent Behavior Limitations & Output Quality
* **In-Memory Limits**: The Express backend uses in-memory states; restarting the container restores seed configurations.
* **API Rate Limits**: The TomTom routing engine sub-samples coordinate points. If the API key is absent, the system instantly switches to a high-fidelity synthetic city grid generator to ensure continuous runtime.
* **Output Quality**: Validated with complete TypeScript compiling. Fully responsive viewport dashboard.

---

## 🚀 2. Deployment Instructions

LogiRoute OS is structured as a unified monorepo. The backend Express server runs Vite as a middleware in development, and serves static files directly in production.

### 🌐 Option A: Unified Deployment on Render (Recommended)
This hosts both the **Express Backend API** and the **Vite Frontend Client** on a single persistent service.

1. **Sign Up/Log In**: Go to [Render](https://render.com).
2. **Create Web Service**: Connect your GitHub repository.
3. **Configure Service settings**:
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
4. **Environment Variables**:
   * Add `NODE_ENV = production`
   * (Optional) `PORT = 10000` (Render binds this automatically)
5. Click **Deploy**. Render will host the application and provide a public URL.

### ⚡ Option B: Frontend Static Deployment on Vercel
Since the frontend uses a client-side store (`src/lib/store.ts`) that runs routing/optimization algorithms directly in the browser, you can host the frontend client alone as a zero-cost static site on Vercel.

1. **Install Vercel CLI** or connect your Git repo to [Vercel](https://vercel.com).
2. **Build Settings**:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build` (runs `vite build`)
   * **Output Directory**: `dist`
3. Click **Deploy**. Vercel will serve your app statically.

---

## 🛠️ 3. Local Development & Demo Setup

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/Sriyasnehasis/Team-04-BITKRAFT.git
   cd Team-04-BITKRAFT
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs Express + Vite):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

### ⚙️ Demo Walks
1. **Toggle Roles**: Switch between **Operator Dashboard** (Dispatch, Fleet, Incidents) and **Customer Portal** (Track Active Packages, view ETA).
2. **TomTom API Key Configuration**: Click ⚙️ in the top bar to open **Optimization Settings**, enter your TomTom API Key to query real-world coordinates, or leave blank to test the fallback grid engine.
3. **Dispatch Simulation**: Create an order, run candidate optimization scoring, assign a vehicle, and view the animated delivery simulation live on the Leaflet map!
