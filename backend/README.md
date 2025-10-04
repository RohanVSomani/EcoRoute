EcoRoute Backend
----------------
Node + Express server providing:
 - POST /api/route  { from, to, vehicle, optimizeFor }
 - GET  /api/vehicles

Uses public Nominatim (geocoding) and public OSRM router.project-osrm.org for routing.

Run locally:
  cd backend
  npm install
  npm start

For production:
 - Replace public Nominatim and OSRM with private/paid services
 - Add caching, rate-limiting, authentication
