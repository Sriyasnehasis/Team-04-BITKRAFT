# LogiRoute OS - Cyber Security & IT Risk Audit Document

**Document Reference:** SEC-AUD-2026-LR01  
**Classification:** Internal Use Only  
**Audit Scope:** LogiRoute OS Frontend SPA, Local State Store, Express API Endpoints, and External Integrations (TomTom APIs).

---

## 🛡️ 1. Executive Summary

This document outlines the security architecture, risk modeling, and vulnerability mitigation strategies applied to **LogiRoute OS**. 

As a live logistics and route optimization platform dealing with real-time telemetry, asset mapping, and partner API integrations, the system is designed to maintain **Confidentiality, Integrity, and Availability (CIA Triad)** across all fleet activities. The platform has been audited against standard OWASP Web Application security risks and IT operational fail-safes.

---

## 🔏 2. Asset Classification & Data Protection

The system classifies and protects critical assets across three categories:

| Asset Name | Sensitivity | Storage Location | Protection Mechanisms |
|---|---|---|---|
| **TomTom Routing API Key** | **High** | Browser `localStorage` / OS Environment | Client-side origin isolation & LocalStorage domain sandboxing. |
| **Fleet Telemetry (GPS Coordinates)** | **Medium** | Transient Store State (`store.ts`) | Handled entirely in memory. Memory is cleared upon simulation reset to prevent location tracking logs. |
| **Order/Customer Information** | **Medium** | Server memory database (`server.ts`) | Access limited strictly based on authenticated client roles. |

### Data in Transit Security
* **Protocol Enforcement:** All communications between the client app, local backend Express server, and the external TomTom API endpoints are routed using **HTTPS (TLS 1.2 / 1.3)** to prevent man-in-the-middle (MITM) eavesdropping.
* **CORS Policy Validation:** The Express server implements Cross-Origin Resource Sharing (CORS) configurations, permitting only verified domains to connect and fetch resource APIs.

---

## ⚙️ 3. Threat Modeling & Vulnerability Analysis

Threat modeling was conducted using the **STRIDE methodology** to identify potential application vulnerabilities and specify corresponding controls:

### A. Spoofing & Tampering (Access Controls)
* **Risk:** Unauthorized clients attempting to dispatch orders or manipulate vehicle maintenance statuses.
* **Control:** Implementation of **Role-Based Access Control (RBAC)** defining strict scopes:
  * **Admin:** Full read/write access to weights, config, and state resets.
  * **Dispatcher:** Access limited to order creation and vehicle candidate optimization.
  * **Customer:** Read-only access to their specific assigned order coordinates and tracking path.

### B. Information Disclosure (API Key Leakage)
* **Risk:** Malicious browser extensions or Cross-Site Scripting (XSS) attempting to steal the saved TomTom developer API key from `localStorage`.
* **Control:** 
  1. **Content Security Policy (CSP):** Implemented to block unauthorized inline script injections and limit connections strictly to TomTom domains.
  2. **React Auto-Escaping:** The view layer uses React's default string escaping, preventing XSS HTML payload insertions.

---

## 🚨 4. IT Operational Risks & High-Availability Fail-safes

Logistics platforms are highly vulnerable to network failures, vendor API blocks, and service latency. The audit identified the following operational risks:

### A. TomTom API Rate Limiting or Outage
* **Risk Scenario:** The TomTom API developer key runs out of monthly quota, experiences temporary latency spikes, or goes down.
* **Impact:** Route calculations fail, preventing dispatch updates and map rendering.
* **Mitigation (High-Availability Fallback):** The routing system is built with a **Seamless Fallback Pipeline** ([`routing-engine.ts`](src/lib/routing-engine.ts)):
  ```typescript
  try {
    // Attempt TomTom route calculation
    return await this.calculateRoutesFromTomTom(...);
  } catch (err) {
    // Log exception and drop down to local mock generator
    return this.calculateRoutesSync(...);
  }
  ```
  If TomTom calls time out, the system automatically uses locally pre-computed curved route polylines. Dispatch operators and maps remain fully functional.

### B. Memory Leakage in Continuous Simulation Loops
* **Risk Scenario:** Long-running browser tabs running live simulation ticks (every 1 second) accumulate state, causing memory leaks and browser crashes.
* **Mitigation:** The Store simulation controller ([`store.ts`](src/lib/store.ts)) uses structured clearing intervals. Whenever a simulation is paused, reset, or completes, all interval timers are disposed of (`clearInterval`) and transient telemetry collections are garbage-collected.

---

## 📋 5. Compliance & Remediation Roadmap

The platform aligns with the following industry compliance standards:
* **GDPR compliance:** Telemetry locations are stored dynamically in memory. No persistent history tracks driver or customer geographical addresses after order delivery is finalized.
* **SLA Verification:** Built-in conflict-detector mechanisms alert coordinators of route overlaps, protecting operational availability and preventing physical logistics delays.
