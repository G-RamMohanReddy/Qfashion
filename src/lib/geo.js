/**
 * Hyperlocal geo.
 *
 * Every delivery promise the app makes — "45 mins from GS Road, 2.4 km away" —
 * is computed here from coordinates, never hard-coded onto a product.
 */

import { HUBS, STORES, CITIES } from '../data/seedData.js';

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;

export function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return +(2 * R * Math.asin(Math.sqrt(h))).toFixed(2);
}

/** Two-wheeler door-to-door average through Indian city traffic. */
export const rideMins = (km, kmh = 19) => Math.max(4, Math.round((km / kmh) * 60));

/** Store prep + ride + 5 min handover, widened into a believable range. */
export function deliveryWindow({ prepMins = 12, km = 3 }) {
  const base = prepMins + rideMins(km) + 5;
  const min = Math.max(25, Math.round(base * 0.85));
  const max = Math.max(min + 12, Math.round(base * 1.3));
  return { min, max, mid: Math.round((min + max) / 2) };
}

export const windowLabel = (w) => `${w.min}-${w.max} mins`;

/** Stores whose delivery radius covers this hub, nearest first. */
export function storesForHub(hubId) {
  const hub = HUBS.find((h) => h.id === hubId);
  if (!hub) return [];
  return STORES.filter((s) => s.cityId === hub.cityId)
    .map((s) => ({ ...s, km: distanceKm(hub, s) }))
    .filter((s) => s.km <= s.radiusKm)
    .sort((a, b) => a.km - b.km);
}

export function nearestHub(coords) {
  let best = null;
  for (const h of HUBS) {
    const km = distanceKm(coords, h);
    if (!best || km < best.km) best = { hub: h, km };
  }
  return best;
}

/**
 * Browser geolocation with a reverse-geocode step.
 *
 * We reverse-geocode against our own hub table rather than calling an external
 * service: a delivery app only cares which serviceable neighbourhood you are in,
 * that answer is one haversine away, and it works offline with no API key and no
 * third party seeing a customer's coordinates.
 *
 * Resolves { ok, coords, hub, city, km, accuracy } or { ok:false, reason, message }.
 */
export function detectLocation({ timeout = 9000 } = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, reason: 'unsupported', message: 'This browser cannot share a location. Pick your area below.' });
      return;
    }

    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const timer = setTimeout(() => done({ ok: false, reason: 'timeout', message: 'Location is taking too long. Pick your area below.' }), timeout + 500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const near = nearestHub(coords);
        const city = CITIES.find((c) => c.id === near.hub.cityId);
        if (near.km > 35) {
          done({
            ok: false,
            reason: 'out-of-zone',
            coords,
            nearest: near,
            message: `We are not live in your area yet. The closest Q Fashion zone is ${near.hub.name}, about ${Math.round(near.km)} km away.`,
          });
          return;
        }
        done({ ok: true, coords, hub: near.hub, city, km: near.km, accuracy: Math.round(pos.coords.accuracy || 0) });
      },
      (err) => {
        clearTimeout(timer);
        const map = {
          1: { reason: 'denied', message: 'Location permission was blocked. Pick your area below instead.' },
          2: { reason: 'unavailable', message: 'Your device could not get a fix. Pick your area below.' },
          3: { reason: 'timeout', message: 'Location timed out. Pick your area below.' },
        };
        done({ ok: false, ...(map[err.code] || { reason: 'error', message: 'Could not detect your location.' }) });
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}
