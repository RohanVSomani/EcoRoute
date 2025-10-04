/**
 * EcoRoute Backend (Node + Express)
 */
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { computeTurnPenaltyFactor, estimateFromRoute, VEHICLE_PROFILES } from './utils/eco.js';

const app = express();
app.use(cors());
app.use(express.json());

const OSRM_ROUTE = 'https://router.project-osrm.org/route/v1/car/';

async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'EcoRoute-Backend/1.0' }});
  const j = await r.json();
  if (!j || j.length === 0) throw new Error('Geocode not found: '+q);
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon), display_name: j[0].display_name };
}

async function fetchRoutes(from, to) {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url = `${OSRM_ROUTE}${coords}?overview=full&alternatives=true&geometries=geojson&annotations=duration,distance`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j || j.code !== 'Ok') throw new Error('Routing error');
  return j.routes;
}

app.post('/api/route', async (req, res) => {
  try {
    const { from, to, vehicle='car', optimizeFor='co2' } = req.body;
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });

    const fromC = await geocode(from);
    const toC = await geocode(to);

    const routes = await fetchRoutes(fromC, toC);
    if (!routes || routes.length === 0) throw new Error('No routes returned');

    const computed = routes.map((r, idx) => {
      const distKm = (r.distance || 0) / 1000;
      const durMin = (r.duration || 0) / 60;
      const poly = r.geometry.coordinates.map(c => [c[1], c[0]]);
      const estimate = estimateFromRoute({ distanceKm: distKm, durationMin: durMin, polyline: poly, vehicle });
      return { idx, route: r, estimate, poly };
    });

    const byDistance = [...computed].sort((a,b) => a.estimate.distanceKm - b.estimate.distanceKm)[0];
    const byCo2 = [...computed].sort((a,b) => a.estimate.co2Kg - b.estimate.co2Kg)[0];
    const preferred = optimizeFor === 'time' ? byDistance : byCo2;
    const co2SavedPercent = Math.max(0, (byDistance.estimate.co2Kg - byCo2.estimate.co2Kg) / (byDistance.estimate.co2Kg || 1) * 100);

    res.json({
      from: fromC,
      to: toC,
      routes: computed,
      shortest: byDistance,
      eco: byCo2,
      preferred,
      co2SavedPercent: Math.round(co2SavedPercent)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.get('/api/vehicles', (req,res) => {
  res.json(Object.keys(VEHICLE_PROFILES));
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('EcoRoute backend running on port', port));
