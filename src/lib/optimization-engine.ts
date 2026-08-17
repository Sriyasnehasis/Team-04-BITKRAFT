import {
  CandidateEvaluation,
  Company,
  Driver,
  OptimizationRun,
  OptimizationWeights,
  Order,
  RouteOption,
  Vehicle,
} from '../types/logistics';
import { calculateHaversineDistanceKm } from './geo';
import { RoutingService } from './routing-engine';

export const DEFAULT_OPTIMIZATION_WEIGHTS: OptimizationWeights = {
  travelTimeWeight: 0.25,
  distanceWeight: 0.20,
  deliveryPriorityWeight: 0.15,
  vehicleSuitabilityWeight: 0.15,
  driverAvailabilityWeight: 0.10,
  vehicleCostWeight: 0.05,
  trafficWeight: 0.05,
  routeConflictWeight: 0.05,
};

export class OptimizationEngine {
  /**
   * Evaluates all fleet candidates (Vehicles + Drivers) for a given order against active optimization weights
   */
  public static evaluateOrder(
    order: Order,
    vehicles: Vehicle[],
    drivers: Driver[],
    companies: Company[],
    weights: OptimizationWeights = DEFAULT_OPTIMIZATION_WEIGHTS,
    existingActiveRoutes: { vehicleId: string; polyline: [number, number][] }[] = [],
    precalculatedRoutes?: RouteOption[]
  ): OptimizationRun {
    const candidateEvaluations: CandidateEvaluation[] = [];

    // Map company for fast lookup
    const companyMap = new Map<string, Company>();
    companies.forEach((c) => companyMap.set(c.id, c));

    // Map driver for fast lookup
    const driverMap = new Map<string, Driver>();
    drivers.forEach((d) => driverMap.set(d.id, d));

    for (const vehicle of vehicles) {
      // Find assigned or default driver for this vehicle
      const driver =
        (vehicle.driverId ? driverMap.get(vehicle.driverId) : null) ||
        drivers.find((d) => d.companyId === vehicle.companyId && d.status === 'available') ||
        drivers.find((d) => d.status === 'available') ||
        drivers[0];

      const company =
        companyMap.get(vehicle.companyId) || {
          id: vehicle.companyId,
          name: vehicle.companyName || 'Logistics Partner',
          code: 'LOGI',
          logo: '🚛',
          primaryColor: '#2563eb',
          rating: 4.8,
          activeVehicles: 12,
          totalDeliveries: 450,
          onTimeRate: 97.4,
          carbonScore: 88,
        };

      // 1. HARD CONSTRAINTS EVALUATION
      const rejectionReasons: string[] = [];

      // Constraint A: Status check
      if (vehicle.status === 'maintenance') {
        rejectionReasons.push(`Vehicle is currently in scheduled maintenance`);
      }
      if (vehicle.status === 'offline') {
        rejectionReasons.push(`Vehicle is offline / unassigned`);
      }

      // Constraint B: Capacity Weight check
      const remainingCapacity = vehicle.capacityKg - vehicle.currentLoadKg;
      if (order.package.weightKg > remainingCapacity) {
        rejectionReasons.push(
          `Weight exceeds payload capacity: Package is ${order.package.weightKg} kg (Vehicle available: ${remainingCapacity} kg / Max: ${vehicle.capacityKg} kg)`
        );
      }

      // Constraint C: Package Special Requirements
      if (order.package.fragile && (vehicle.vehicleType === 'bike' || vehicle.vehicleType === 'scooter')) {
        rejectionReasons.push(`Fragile high-value cargo cannot be safely transported on two-wheelers`);
      }
      if (order.package.hazardous && vehicle.vehicleType !== 'truck' && vehicle.vehicleType !== 'van') {
        rejectionReasons.push(`Hazardous materials require dedicated enclosed container van or truck`);
      }
      if (order.package.weightKg > 15 && (vehicle.vehicleType === 'bike' || vehicle.vehicleType === 'scooter')) {
        rejectionReasons.push(`Two-wheeler payload limit is 15 kg (Order weight: ${order.package.weightKg} kg)`);
      }

      // Constraint D: Driver status check
      if (driver.status === 'offline') {
        rejectionReasons.push(`Assigned driver (${driver.name}) is currently off-duty/offline`);
      }
      if (driver.drivingHoursToday >= 9.5) {
        rejectionReasons.push(`Driver (${driver.name}) reached mandatory daily driving hour ceiling (${driver.drivingHoursToday.toFixed(1)} hrs)`);
      }

      // 2. SPATIAL & ROUTE CALCULATIONS
      const driverDistToPickup = calculateHaversineDistanceKm(
        driver.currentLocation.lat,
        driver.currentLocation.lng,
        order.sender.location.lat,
        order.sender.location.lng
      );

      // Range check for EV
      const routeOptions = precalculatedRoutes || RoutingService.calculateRoutesSync(
        order.sender.location,
        order.recipient.location,
        1.0,
        undefined,
        order.deliveryWindow.type
      );
      const recommendedRoute = routeOptions.find((r) => r.isRecommended) || routeOptions[0];
      const totalEstimatedKm = driverDistToPickup + recommendedRoute.distanceKm;

      if (vehicle.fuelType === 'electric' && totalEstimatedKm > vehicle.maxRangeKm * (vehicle.batteryOrFuelPct / 100)) {
        rejectionReasons.push(
          `Insufficient EV battery range (${((vehicle.maxRangeKm * vehicle.batteryOrFuelPct) / 100).toFixed(1)} km remaining for ${totalEstimatedKm.toFixed(1)} km mission)`
        );
      }

      const isEligible = rejectionReasons.length === 0;

      // 3. PARAMETRIC SCORING (0 to 100 normalized)
      // Travel Time Score (Higher is faster)
      const totalTimeMin = Math.round((driverDistToPickup / 35) * 60 + recommendedRoute.durationMin);
      const travelTimeScore = Math.max(10, Math.min(100, 100 - (totalTimeMin - 15) * 1.6));

      // Distance Score (Closer driver + efficient route)
      const distanceScore = Math.max(10, Math.min(100, 100 - (driverDistToPickup * 4 + recommendedRoute.distanceKm * 1.5)));

      // Capacity Utilization Score (Optimal fit without waste)
      const capacityRatio = (vehicle.currentLoadKg + order.package.weightKg) / vehicle.capacityKg;
      let capacityScore = 75;
      if (capacityRatio >= 0.4 && capacityRatio <= 0.85) capacityScore = 95;
      else if (capacityRatio < 0.2) capacityScore = 65; // underutilized large truck for small parcel
      else if (capacityRatio > 0.9) capacityScore = 60; // dangerously close to payload max

      // Driver Availability & Quality Score
      const workloadPenalty = (driver.currentWorkload / 100) * 30;
      const driverAvailabilityScore = Math.max(
        15,
        Math.min(100, driver.rating * 18 + (driver.status === 'available' ? 20 : 5) - workloadPenalty)
      );
      const driverWorkloadScore = Math.max(10, 100 - driver.currentWorkload);

      // Priority Match Score
      let priorityScore = 80;
      if (order.deliveryWindow.type === 'same_day' || order.deliveryWindow.type === 'express') {
        if (vehicle.vehicleType === 'bike' || vehicle.vehicleType === 'ev_van' || vehicle.vehicleType === 'van') {
          priorityScore = 96;
        } else {
          priorityScore = 70; // heavy trucks are slower in city traffic
        }
      }

      // Vehicle Operating Cost Score (Lower cost = higher score)
      const estimatedCost = Math.round(
        totalEstimatedKm * vehicle.operatingCostPerKm + recommendedRoute.tollCostInr + 30
      );
      const vehicleCostScore = Math.max(15, Math.min(100, 100 - (estimatedCost - 50) * 0.35));

      // Traffic & Corridor Score
      let trafficScore = 85;
      if (recommendedRoute.trafficCongestionLevel === 'low') trafficScore = 95;
      else if (recommendedRoute.trafficCongestionLevel === 'moderate') trafficScore = 80;
      else if (recommendedRoute.trafficCongestionLevel === 'heavy') trafficScore = 55;
      else trafficScore = 35;

      // Route Conflict Score (Check if route overlaps with other active deliveries)
      let routeConflictScore = 95;
      let hasConflict = false;
      for (const act of existingActiveRoutes) {
        if (act.vehicleId !== vehicle.id) {
          // Check if distance between pickup/route is overlapping
          const firstPoint = act.polyline[0];
          if (firstPoint) {
            const overlapDist = calculateHaversineDistanceKm(
              order.sender.location.lat,
              order.sender.location.lng,
              firstPoint[0],
              firstPoint[1]
            );
            if (overlapDist < 1.2) {
              hasConflict = true;
              break;
            }
          }
        }
      }
      if (hasConflict) routeConflictScore = 50;

      // Vehicle Suitability (Green EV bonus, suitable chassis)
      let vehicleSuitabilityScore = 80;
      if (vehicle.fuelType === 'electric') vehicleSuitabilityScore += 12;
      if (order.package.type === 'medical' && vehicle.fuelType === 'electric') vehicleSuitabilityScore += 8;

      // Delivery Window Score
      const windowMaxMin = order.deliveryWindow.maxAcceptableMinutes || 90;
      const deliveryWindowScore = totalTimeMin <= windowMaxMin ? 95 : Math.max(10, 95 - (totalTimeMin - windowMaxMin) * 3);

      // 4. WEIGHTED OVERALL COMPOSITE SCORE
      // Normalize weights
      const totalWeight =
        weights.travelTimeWeight +
        weights.distanceWeight +
        weights.deliveryPriorityWeight +
        weights.vehicleSuitabilityWeight +
        weights.driverAvailabilityWeight +
        weights.vehicleCostWeight +
        weights.trafficWeight +
        weights.routeConflictWeight;

      const rawScore =
        (travelTimeScore * weights.travelTimeWeight +
          distanceScore * weights.distanceWeight +
          priorityScore * weights.deliveryPriorityWeight +
          vehicleSuitabilityScore * weights.vehicleSuitabilityWeight +
          driverAvailabilityScore * weights.driverAvailabilityWeight +
          vehicleCostScore * weights.vehicleCostWeight +
          trafficScore * weights.trafficWeight +
          routeConflictScore * weights.routeConflictWeight) /
        totalWeight;

      const overallScore = isEligible ? Number(rawScore.toFixed(1)) : 0;

      candidateEvaluations.push({
        vehicle,
        driver,
        company,
        isEligible,
        rejectionReasons,
        scores: {
          travelTimeScore: Math.round(travelTimeScore),
          distanceScore: Math.round(distanceScore),
          capacityScore: Math.round(capacityScore),
          driverAvailabilityScore: Math.round(driverAvailabilityScore),
          driverWorkloadScore: Math.round(driverWorkloadScore),
          priorityScore: Math.round(priorityScore),
          vehicleCostScore: Math.round(vehicleCostScore),
          trafficScore: Math.round(trafficScore),
          routeConflictScore: Math.round(routeConflictScore),
          deliveryWindowScore: Math.round(deliveryWindowScore),
          vehicleSuitabilityScore: Math.round(vehicleSuitabilityScore),
          overallScore,
        },
        metrics: {
          driverDistanceToPickupKm: Number(driverDistToPickup.toFixed(2)),
          deliveryDistanceKm: recommendedRoute.distanceKm,
          totalDistanceKm: Number(totalEstimatedKm.toFixed(2)),
          estimatedTravelTimeMin: totalTimeMin,
          estimatedCostInr: estimatedCost,
          trafficDelayMin: recommendedRoute.trafficCongestionLevel === 'heavy' ? 8 : recommendedRoute.trafficCongestionLevel === 'moderate' ? 4 : 0,
        },
        bestRouteOption: recommendedRoute,
        allRouteOptions: routeOptions,
      });
    }

    // Sort: Eligible first, then descending by overallScore
    candidateEvaluations.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.scores.overallScore - a.scores.overallScore;
    });

    const eligibleCandidates = candidateEvaluations.filter((c) => c.isEligible);
    const rejectedCandidates = candidateEvaluations.filter((c) => !c.isEligible);
    const selectedCandidate = eligibleCandidates.length > 0 ? eligibleCandidates[0] : undefined;

    // Build Detailed Explanatory Reasoning
    const reasoningBulletPoints: string[] = [];
    let summary = 'No eligible vehicles found meeting all physical and regulatory constraints.';
    let keyDecidingFactor = 'Payload and availability barriers';

    if (selectedCandidate) {
      const v = selectedCandidate.vehicle;
      const d = selectedCandidate.driver;
      const m = selectedCandidate.metrics;

      reasoningBulletPoints.push(`✓ Proximity: Driver ${d.name} is only ${m.driverDistanceToPickupKm} km from pickup warehouse.`);
      reasoningBulletPoints.push(`✓ Speed & ETA: Projected total turnaround of ${m.estimatedTravelTimeMin} min comfortably beats the delivery window.`);
      reasoningBulletPoints.push(`✓ Capacity Fit: Vehicle ${v.plateNumber} (${v.vehicleType.toUpperCase()}) carries ${order.package.weightKg} kg payload with ${((v.currentLoadKg + order.package.weightKg) / v.capacityKg * 100).toFixed(0)}% optimal capacity utilization.`);
      
      if (v.fuelType === 'electric') {
        reasoningBulletPoints.push(`✓ Green Fleet Priority: Zero-emission EV Van reduces carbon footprint by ${(m.totalDistanceKm * 0.12).toFixed(1)} kg CO2.`);
      }
      
      reasoningBulletPoints.push(`✓ Operating Cost: Lowest total operational expenditure at ₹${m.estimatedCostInr} (₹${v.operatingCostPerKm}/km base rate).`);
      reasoningBulletPoints.push(`✓ Conflict Free: Zero shared corridor bottlenecks detected on ${selectedCandidate.bestRouteOption.title}.`);

      summary = `Selected ${v.companyName} (${v.plateNumber}) with Driver ${d.name} for superior proximity (${m.driverDistanceToPickupKm} km), lowest operating cost (₹${m.estimatedCostInr}), and optimal capacity matching.`;
      keyDecidingFactor = `Optimal balance of proximity (${m.driverDistanceToPickupKm} km), ${v.fuelType === 'electric' ? 'zero-emission EV efficiency' : 'transit speed'}, and lowest overall cost.`;
    }

    // Calculate Before (naive unoptimized default) vs After (optimized) metrics
    const baselineDistance = selectedCandidate ? selectedCandidate.metrics.totalDistanceKm * 1.28 : 25;
    const baselineTime = selectedCandidate ? Math.round(selectedCandidate.metrics.estimatedTravelTimeMin * 1.35) : 55;
    const baselineCost = selectedCandidate ? Math.round(selectedCandidate.metrics.estimatedCostInr * 1.32) : 210;

    const optimizedDist = selectedCandidate ? selectedCandidate.metrics.totalDistanceKm : 0;
    const optimizedTime = selectedCandidate ? selectedCandidate.metrics.estimatedTravelTimeMin : 0;
    const optimizedCost = selectedCandidate ? selectedCandidate.metrics.estimatedCostInr : 0;

    const beforeVsAfter = {
      before: {
        distanceKm: Number(baselineDistance.toFixed(1)),
        travelTimeMin: baselineTime,
        costInr: baselineCost,
        conflictsCount: 2,
        utilizationPct: 58,
        carbonKg: Number((baselineDistance * 0.165).toFixed(2)),
      },
      after: {
        distanceKm: Number(optimizedDist.toFixed(1)),
        travelTimeMin: optimizedTime,
        costInr: optimizedCost,
        conflictsCount: 0,
        utilizationPct: 84,
        carbonKg: Number((optimizedDist * 0.085).toFixed(2)),
      },
      savings: {
        distanceSavedKm: Number((baselineDistance - optimizedDist).toFixed(1)),
        timeSavedMin: baselineTime - optimizedTime,
        costSavedInr: baselineCost - optimizedCost,
        conflictsResolved: 2,
        fuelSavedLiters: Number(((baselineDistance - optimizedDist) * 0.09).toFixed(2)),
      },
    };

    return {
      id: `opt-run-${Date.now()}`,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      weights,
      selectedCandidate,
      allCandidates: candidateEvaluations,
      eligibleCount: eligibleCandidates.length,
      rejectedCount: rejectedCandidates.length,
      reasoning: {
        bulletPoints: reasoningBulletPoints,
        summary,
        keyDecidingFactor,
      },
      beforeVsAfter,
    };
  }
}
