import { LatLng, RouteOption, RoutePoint, RouteStrategy, DeliveryPriority } from '../types/logistics';
import { calculateHaversineDistanceKm, calculateBearing } from './geo';

interface RoadSegmentDefinition {
  name: string;
  speedLimit: number;
  toll: number;
  trafficFactor: number;
}

/**
 * High-fidelity Route Calculation Engine
 * Produces multiple distinct route options with realistic curvature, street names,
 * traffic conditions, toll costs, and carbon footprints.
 */
export class RoutingService {
  /**
   * Calculates 3 to 4 viable route alternatives for a given origin and destination
   */
  public static calculateRoutesSync(
    origin: LatLng,
    destination: LatLng,
    trafficMultiplier: number = 1.0,
    blockedSegment?: string,
    priority: DeliveryPriority = 'standard'
  ): RouteOption[] {
    const directDistKm = calculateHaversineDistanceKm(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    // If pickup and dropoff are identical, return minimal route
    if (directDistKm < 0.1) {
      const singlePt: RoutePoint = {
        lat: origin.lat,
        lng: origin.lng,
        name: origin.address || 'Origin/Destination',
        streetName: 'Local Access Way',
      };
      return [
        {
          id: 'route-minimal',
          strategy: 'fastest',
          title: 'Direct Local Dispatch',
          description: 'Immediate on-site delivery access',
          distanceKm: 0.2,
          durationMin: 2,
          estimatedCostInr: 25,
          trafficCongestionLevel: 'low',
          waypoints: [singlePt, singlePt],
          polyline: [[origin.lat, origin.lng], [destination.lat, destination.lng]],
          tollCostInr: 0,
          carbonEmissionKg: 0.05,
          isRecommended: true,
          score: 95,
          pros: ['Instant direct proximity', 'Zero transit delay'],
          cons: [],
        },
      ];
    }

    // Determine city / arterial corridor context
    const isMumbai = Math.abs(origin.lat - 19.07) < 0.8 && Math.abs(origin.lng - 72.87) < 0.8;
    const isDelhi = Math.abs(origin.lat - 28.61) < 0.8 && Math.abs(origin.lng - 77.20) < 0.8;
    const isBengaluru = Math.abs(origin.lat - 12.97) < 0.8 && Math.abs(origin.lng - 77.59) < 0.8;

    // Build Route A: Express / Arterial Highway (Fastest)
    const fastest = this.buildOption(
      'fastest',
      'Arterial Highway Corridor (Fastest)',
      'Primary multi-lane arterial corridor with prioritized traffic flow and high average speed.',
      origin,
      destination,
      directDistKm,
      1.22, // distance multiplier over direct line
      48,   // base avg speed km/h
      trafficMultiplier * 1.05,
      isMumbai ? ['Western Express Highway', 'BKC Flyover', 'Bandra Connector'] :
      isDelhi ? ['Outer Ring Road', 'Delhi-Noida Direct Flyway', 'Barapullah Corridor'] :
      isBengaluru ? ['Outer Ring Road', 'Silk Board Flyover', 'Electronic City Expressway'] :
      ['Grand National Expressway', 'Metropolitan Corridor', 'City Ring Parkway'],
      35, // toll cost
      blockedSegment === 'highway'
    );

    // Build Route B: Direct City Grid (Shortest Distance)
    const shortest = this.buildOption(
      'shortest',
      'Direct Inner City Grid (Shortest)',
      'Direct navigation through secondary collector avenues. Minimizes distance traveled.',
      origin,
      destination,
      directDistKm,
      1.12, // tighter distance multiplier
      28,   // slower city speed km/h
      trafficMultiplier * 1.35, // higher city friction
      isMumbai ? ['S.V. Road', 'Linking Road', 'Turner Road', 'Hill Road'] :
      isDelhi ? ['Mathura Road', 'Aurobindo Marg', 'Ring Road Inner Grid'] :
      isBengaluru ? ['100ft Road Indiranagar', 'Sarjapur Main Road', 'Old Airport Road'] :
      ['Central Avenue', 'Market Radial', 'Commercial Boulevard'],
      0, // no toll
      blockedSegment === 'inner_grid'
    );

    // Build Route C: Dynamic Traffic Bypass / Freeway Ring
    const trafficAvoidance = this.buildOption(
      'traffic_avoidance',
      'Elevated Bypass & Freeway (Congestion Avoidance)',
      'Routes around known bottleneck intersections via outer orbital bypass and grade-separated bridges.',
      origin,
      destination,
      directDistKm,
      1.38, // longer detour
      58,   // faster unobstructed speed
      trafficMultiplier * 0.85, // smoother traffic
      isMumbai ? ['Eastern Freeway', 'Bandra-Worli Sea Link', 'SCLR Elevated Way'] :
      isDelhi ? ['Eastern Peripheral Expressway', 'Signature Bridge Corridor'] :
      isBengaluru ? ['NICE Ring Road', 'Hebbal Elevated Expressway'] :
      ['Bypass Orbital Ring', 'Coastal Elevated Highway', 'Express Connector'],
      85, // higher toll
      blockedSegment === 'bypass'
    );

    // Build Route D: Eco-Friendly / Low-Carbon Route
    const ecoFriendly = this.buildOption(
      'eco_friendly',
      'Green Energy Optimized Corridor',
      'Optimized gradient and steady-state speed zones to minimize EV battery depletion and fuel burn.',
      origin,
      destination,
      directDistKm,
      1.18,
      38,
      trafficMultiplier * 1.0,
      ['Green Logistics Corridor', 'Low-Speed Eco Arterial', 'Boulevard Radial'],
      10,
      false
    );

    const allOptions = [fastest, shortest, trafficAvoidance, ecoFriendly];

    // Score and mark recommended route based on optimal blend of time, distance, and cost and delivery priority
    let bestScore = -1;
    let bestIndex = 0;
    allOptions.forEach((opt, idx) => {
      // Score calculation (0 - 100)
      const timeScore = Math.max(0, 100 - opt.durationMin * 1.5);
      const distScore = Math.max(0, 100 - opt.distanceKm * 2);
      const costScore = Math.max(0, 100 - opt.estimatedCostInr * 0.25);
      const trafficPenalty = opt.trafficCongestionLevel === 'severe' ? 30 : opt.trafficCongestionLevel === 'heavy' ? 18 : opt.trafficCongestionLevel === 'moderate' ? 8 : 0;
      
      let compositeScore = 0;
      if (priority === 'express') {
        compositeScore = Number((timeScore * 0.8 + distScore * 0.1 + costScore * 0.1 - trafficPenalty * 1.5).toFixed(1));
      } else if (priority === 'same_day') {
        compositeScore = Number((timeScore * 0.6 + distScore * 0.2 + costScore * 0.2 - trafficPenalty * 1.2).toFixed(1));
      } else {
        compositeScore = Number((timeScore * 0.2 + distScore * 0.5 + costScore * 0.3 - trafficPenalty * 0.5).toFixed(1));
      }
      opt.score = Math.max(10, compositeScore);

      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        bestIndex = idx;
      }
    });

    allOptions[bestIndex].isRecommended = true;

    return allOptions;
  }

  private static buildOption(
    strategy: RouteStrategy,
    title: string,
    description: string,
    origin: LatLng,
    destination: LatLng,
    directDistKm: number,
    distMultiplier: number,
    baseSpeedKmh: number,
    trafficFactor: number,
    roadNames: string[],
    tollCost: number,
    isBlocked: boolean = false
  ): RouteOption {
    const distanceKm = Number((directDistKm * distMultiplier).toFixed(2));
    const effectiveSpeed = Math.max(12, baseSpeedKmh / trafficFactor);
    const durationMin = Math.max(
      4,
      Math.round((distanceKm / effectiveSpeed) * 60 + (isBlocked ? 25 : 0))
    );

    // Estimated baseline fuel/operating cost (₹8 per km + base ₹30 + tolls)
    const estimatedCostInr = Math.round(distanceKm * 7.5 + 35 + tollCost);
    const carbonEmissionKg = Number((distanceKm * 0.115).toFixed(2)); // ~115g CO2/km

    let congestion: 'low' | 'moderate' | 'heavy' | 'severe' = 'low';
    if (trafficFactor > 1.6 || isBlocked) congestion = 'severe';
    else if (trafficFactor > 1.3) congestion = 'heavy';
    else if (trafficFactor > 1.1) congestion = 'moderate';

    // Generate realistic waypoints along a curving trajectory
    const polyline = this.generateRealisticRoadPolyline(
      origin,
      destination,
      strategy,
      distMultiplier
    );

    const waypoints: RoutePoint[] = polyline.map((pt, i) => {
      const roadName = roadNames[i % roadNames.length];
      return {
        lat: pt[0],
        lng: pt[1],
        streetName: roadName,
        speedLimitKmh: baseSpeedKmh,
        trafficFactor: Number(trafficFactor.toFixed(2)),
      };
    });

    const pros: string[] = [];
    const cons: string[] = [];

    if (strategy === 'fastest') {
      pros.push('Shortest transit travel time', 'Priority flyover usage');
      if (tollCost > 0) cons.push(`Includes ₹${tollCost} toll charge`);
    } else if (strategy === 'shortest') {
      pros.push('Lowest mileage wear and tear', 'Zero toll surcharges');
      cons.push('Higher number of traffic lights and intersections');
    } else if (strategy === 'traffic_avoidance') {
      pros.push('Bypasses central congestion zones', 'High speed consistency');
      cons.push('Higher detour distance (+25%)');
    } else {
      pros.push('Lowest carbon footprint and fuel consumption', 'Smooth velocity profile');
      cons.push('Slightly higher travel time than expressway');
    }

    return {
      id: `route-${strategy}-${Date.now().toString().slice(-4)}`,
      strategy,
      title,
      description,
      distanceKm,
      durationMin,
      estimatedCostInr,
      trafficCongestionLevel: congestion,
      waypoints,
      polyline,
      tollCostInr: tollCost,
      carbonEmissionKg,
      isRecommended: false,
      score: 0,
      pros,
      cons,
    };
  }

  /**
   * Generates a curved, realistic road geometry with 12 to 24 waypoint nodes
   * with natural perpendicular lateral offsets mimicking real city street grids.
   */
  public static generateRealisticRoadPolyline(
    origin: LatLng,
    destination: LatLng,
    strategy: RouteStrategy,
    curvatureScale: number
  ): [number, number][] {
    const numPoints = 16;
    const points: [number, number][] = [];

    const dLat = destination.lat - origin.lat;
    const dLng = destination.lng - origin.lng;

    // Perpendicular vector for lateral road curving
    const perpLat = -dLng;
    const perpLng = dLat;

    // Strategy offset bias
    let curveBias = 0;
    if (strategy === 'traffic_avoidance') curveBias = 0.22;
    if (strategy === 'shortest') curveBias = 0.04;
    if (strategy === 'fastest') curveBias = -0.12;
    if (strategy === 'eco_friendly') curveBias = 0.09;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;

      // Base linear interpolation
      const baseLat = origin.lat + dLat * t;
      const baseLng = origin.lng + dLng * t;

      // Sinusoidal bell curve for road bend
      const arc = Math.sin(t * Math.PI);
      const wobble = Math.sin(t * Math.PI * 3) * 0.002;

      const offsetLat = (perpLat * curveBias * arc) + wobble;
      const offsetLng = (perpLng * curveBias * arc) + wobble;

      const ptLat = Number((baseLat + offsetLat).toFixed(6));
      const ptLng = Number((baseLng + offsetLng).toFixed(6));

      points.push([ptLat, ptLng]);
    }

    return points;
  }

  private static buildOptionFromTomTom(
    strategy: RouteStrategy,
    title: string,
    description: string,
    tomtomRoute: any,
    tollCost: number = 0
  ): RouteOption {
    const summary = tomtomRoute.summary;
    const distanceKm = Number((summary.lengthInMeters / 1000).toFixed(2));
    const durationMin = Math.round(summary.travelTimeInSeconds / 60);
    const trafficDelayMin = Math.round((summary.trafficDelayInSeconds || 0) / 60);

    // Estimated fuel/operating cost (₹7.5 per km + base ₹35 + tolls)
    const estimatedCostInr = Math.round(distanceKm * 7.5 + 35 + tollCost);
    const carbonEmissionKg = Number((distanceKm * 0.115).toFixed(2));

    let congestion: 'low' | 'moderate' | 'heavy' | 'severe' = 'low';
    if (trafficDelayMin > 8) congestion = 'severe';
    else if (trafficDelayMin > 4) congestion = 'heavy';
    else if (trafficDelayMin > 1.5) congestion = 'moderate';

    // Parse points from TomTom into Leaflet polyline format [lat, lng][]
    const points = tomtomRoute.legs[0].points;
    const polyline: [number, number][] = points.map((p: any) => [p.latitude, p.longitude]);

    // Sub-sample waypoints if there are too many (e.g. limit to 16 points to avoid lag in mapping/simulation)
    const sampleRate = Math.max(1, Math.floor(polyline.length / 16));
    const waypoints: RoutePoint[] = [];
    for (let i = 0; i < polyline.length; i += sampleRate) {
      waypoints.push({
        lat: polyline[i][0],
        lng: polyline[i][1],
        streetName: strategy === 'fastest' ? 'Expressway / Highway' : strategy === 'shortest' ? 'Local Arterial' : strategy === 'eco_friendly' ? 'Eco Corridor' : 'City Bypass',
        speedLimitKmh: strategy === 'fastest' ? 60 : 40,
        trafficFactor: congestion === 'severe' ? 1.8 : congestion === 'heavy' ? 1.4 : congestion === 'moderate' ? 1.15 : 1.0,
      });
    }
    // Make sure we include the exact destination
    const lastPolyPoint = polyline[polyline.length - 1];
    if (waypoints.length === 0 || waypoints[waypoints.length - 1].lat !== lastPolyPoint[0] || waypoints[waypoints.length - 1].lng !== lastPolyPoint[1]) {
      waypoints.push({
        lat: lastPolyPoint[0],
        lng: lastPolyPoint[1],
        streetName: 'Destination Access Road',
        speedLimitKmh: 30,
        trafficFactor: 1.0,
      });
    }

    const pros: string[] = [];
    const cons: string[] = [];

    if (strategy === 'fastest') {
      pros.push('Shortest transit travel time via TomTom Live Traffic');
      if (tollCost > 0) cons.push(`Includes estimated ₹${tollCost} toll charge`);
    } else if (strategy === 'shortest') {
      pros.push('Minimizes physical distance traveled', 'Zero toll surcharges');
      cons.push('Higher traffic delays and grid density');
    } else if (strategy === 'traffic_avoidance') {
      pros.push('Bypasses central congestion zones via TomTom dynamic rerouting');
      cons.push('Detour may increase fuel consumption');
    } else {
      pros.push('Lowest fuel consumption / optimized gradients');
      cons.push('Slightly slower travel speeds');
    }

    return {
      id: `route-${strategy}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2,5)}`,
      strategy,
      title,
      description,
      distanceKm,
      durationMin,
      estimatedCostInr,
      trafficCongestionLevel: congestion,
      waypoints,
      polyline,
      tollCostInr: tollCost,
      carbonEmissionKg,
      isRecommended: false,
      score: 0,
      pros,
      cons,
    };
  }

  public static async calculateRoutes(
    origin: LatLng,
    destination: LatLng,
    trafficMultiplier: number = 1.0,
    blockedSegment?: string,
    apiKey?: string,
    priority: DeliveryPriority = 'standard'
  ): Promise<RouteOption[]> {
    if (!apiKey || apiKey.trim() === '') {
      return this.calculateRoutesSync(origin, destination, trafficMultiplier, blockedSegment, priority);
    }

    try {
      const endpoints = {
        fastest: `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?key=${apiKey}&routeType=fastest&traffic=true&travelMode=truck&maxAlternatives=1`,
        shortest: `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?key=${apiKey}&routeType=shortest&traffic=true&travelMode=truck`,
        eco: `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?key=${apiKey}&routeType=eco&traffic=true&travelMode=truck`,
      };

      const [fastestRes, shortestRes, ecoRes] = await Promise.all([
        fetch(endpoints.fastest).then((r) => r.json()),
        fetch(endpoints.shortest).then((r) => r.json()),
        fetch(endpoints.eco).then((r) => r.json()),
      ]);

      const routes: RouteOption[] = [];

      if (fastestRes && fastestRes.routes && fastestRes.routes[0]) {
        routes.push(
          this.buildOptionFromTomTom(
            'fastest',
            'TomTom Live Traffic (Fastest)',
            'Real-time traffic-adjusted route providing the quickest turnaround.',
            fastestRes.routes[0],
            35
          )
        );
        
        if (fastestRes.routes[1]) {
          routes.push(
            this.buildOptionFromTomTom(
              'traffic_avoidance',
              'TomTom Congestion Bypass',
              'Alternative route corridor avoiding major bottlenecks and peak delay segments.',
              fastestRes.routes[1],
              60
            )
          );
        }
      }

      if (shortestRes && shortestRes.routes && shortestRes.routes[0]) {
        routes.push(
          this.buildOptionFromTomTom(
            'shortest',
            'TomTom City Grid (Shortest)',
            'Shortest geographical distance path through city surface streets.',
            shortestRes.routes[0],
            0
          )
        );
      }

      if (ecoRes && ecoRes.routes && ecoRes.routes[0]) {
        routes.push(
          this.buildOptionFromTomTom(
            'eco_friendly',
            'TomTom Green Eco Corridor',
            'Eco-optimized routing minimizing fuel/battery draw and idling phases.',
            ecoRes.routes[0],
            10
          )
        );
      }

      // If for some reason TomTom didn't return standard 4 routes, we backfill with sync mocks so the UI has exactly 4 strategies
      if (routes.length < 4) {
        const syncRoutes = this.calculateRoutesSync(origin, destination, trafficMultiplier, blockedSegment, priority);
        syncRoutes.forEach((sr) => {
          if (!routes.some((r) => r.strategy === sr.strategy)) {
            routes.push(sr);
          }
        });
      }

      // Now, score the routes based on priority!
      let bestScore = -1;
      let bestIndex = 0;
      routes.forEach((opt, idx) => {
        const timeScore = Math.max(0, 100 - opt.durationMin * 1.5);
        const textDist = opt.distanceKm;
        const distScore = Math.max(0, 100 - textDist * 2);
        const costScore = Math.max(0, 100 - opt.estimatedCostInr * 0.25);
        const trafficPenalty = opt.trafficCongestionLevel === 'severe' ? 30 : opt.trafficCongestionLevel === 'heavy' ? 18 : opt.trafficCongestionLevel === 'moderate' ? 8 : 0;

        let compositeScore = 0;
        if (priority === 'express') {
          compositeScore = Number((timeScore * 0.8 + distScore * 0.1 + costScore * 0.1 - trafficPenalty * 1.5).toFixed(1));
        } else if (priority === 'same_day') {
          compositeScore = Number((timeScore * 0.6 + distScore * 0.2 + costScore * 0.2 - trafficPenalty * 1.2).toFixed(1));
        } else {
          compositeScore = Number((timeScore * 0.2 + distScore * 0.5 + costScore * 0.3 - trafficPenalty * 0.5).toFixed(1));
        }

        opt.score = Math.max(10, compositeScore);

        if (compositeScore > bestScore) {
          bestScore = compositeScore;
          bestIndex = idx;
        }
      });

      if (routes.length > 0) {
        // Clear isRecommended flag from others
        routes.forEach(r => r.isRecommended = false);
        routes[bestIndex].isRecommended = true;
      }

      return routes;
    } catch (err) {
      console.error('TomTom Routing Calculation Failed, using high-fidelity mock fallback:', err);
      return this.calculateRoutesSync(origin, destination, trafficMultiplier, blockedSegment, priority);
    }
  }
}
