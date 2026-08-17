---
name: logiroute-engine
description: Guides agents on routing calculations, priority scoring weights, and simulation step handling in LogiRoute OS.
---

# LogiRoute Optimization & Simulation Engine Skill

This skill documents how to modify, test, and troubleshoot the route scoring and simulation capabilities of LogiRoute OS.

## 🧮 Core Multi-Criteria Scoring Heuristic
The scoring algorithm lives in `src/lib/optimization-engine.ts`. The formula evaluates suitability of a driver-vehicle pair for an order:

$$Score = (w_{time} \times S_{time}) + (w_{dist} \times S_{dist}) + (w_{cost} \times S_{cost})$$

### Rules for adjustments:
1. **Time Priority (Express/Same Day)**: Allocate up to 80% weight to duration.
2. **Standard Priority**: Allocate up to 80% weight to distance and cost.
3. **Eco Routing**: Prioritize carbon efficiency (`carbonSavedKg`).

---

## 🗺️ TomTom API Settings & Sub-Sampling
* **API Endpoints**: `https://api.tomtom.com/routing/1/calculateRoute/...`
* **Sub-sampling**: Leaflet struggles with rendering paths > 1,000 points. If a route contains too many points, sub-sample using a stride pattern:
  ```typescript
  const stride = Math.max(1, Math.ceil(points.length / 500));
  const subSampled = points.filter((_, idx) => idx % stride === 0);
  ```
