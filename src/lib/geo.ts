import { LatLng } from '../types/logistics';

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates initial bearing (angle in degrees 0-360) from point 1 to point 2
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  const bearing = (toDeg(theta) + 360) % 360;
  return Math.round(bearing);
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Interpolates point between two lat/lng coordinates based on fraction (0 to 1)
 */
export function interpolateCoordinate(
  p1: [number, number],
  p2: [number, number],
  fraction: number
): [number, number] {
  const lat = p1[0] + (p2[0] - p1[0]) * fraction;
  const lng = p1[1] + (p2[1] - p1[1]) * fraction;
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}

/**
 * Calculates cumulative distances along a polyline
 */
export function getPolylineCumulativeDistances(
  points: [number, number][]
): { distances: number[]; totalDistance: number } {
  if (points.length === 0) return { distances: [], totalDistance: 0 };
  const distances = [0];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = calculateHaversineDistanceKm(
      points[i][0],
      points[i][1],
      points[i + 1][0],
      points[i + 1][1]
    );
    total += d;
    distances.push(total);
  }
  return { distances, totalDistance: Number(total.toFixed(2)) };
}

/**
 * Finds exact interpolated position, bearing, and segment index for a given progress percentage (0 - 100)
 */
export function getPositionAtProgress(
  polyline: [number, number][],
  progressPct: number
): {
  position: [number, number];
  bearing: number;
  segmentIndex: number;
} {
  if (!polyline || polyline.length === 0) {
    return { position: [19.076, 72.8777], bearing: 0, segmentIndex: 0 };
  }
  if (polyline.length === 1 || progressPct <= 0) {
    return { position: polyline[0], bearing: 0, segmentIndex: 0 };
  }
  if (progressPct >= 100) {
    const last = polyline[polyline.length - 1];
    const prev = polyline[polyline.length - 2] || last;
    return {
      position: last,
      bearing: calculateBearing(prev[0], prev[1], last[0], last[1]),
      segmentIndex: polyline.length - 2,
    };
  }

  const { distances, totalDistance } = getPolylineCumulativeDistances(polyline);
  if (totalDistance === 0) {
    return { position: polyline[0], bearing: 0, segmentIndex: 0 };
  }

  const targetDistance = (progressPct / 100) * totalDistance;

  for (let i = 0; i < distances.length - 1; i++) {
    const segStartDist = distances[i];
    const segEndDist = distances[i + 1];

    if (targetDistance >= segStartDist && targetDistance <= segEndDist) {
      const segLength = segEndDist - segStartDist;
      const segFraction = segLength > 0 ? (targetDistance - segStartDist) / segLength : 0;
      const p1 = polyline[i];
      const p2 = polyline[i + 1];
      const pos = interpolateCoordinate(p1, p2, segFraction);
      const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      return { position: pos, bearing, segmentIndex: i };
    }
  }

  const last = polyline[polyline.length - 1];
  return { position: last, bearing: 0, segmentIndex: polyline.length - 1 };
}
