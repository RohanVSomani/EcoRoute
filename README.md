EcoRoute — Full Stack (Frontend + Backend)
=========================================

This bundle contains:
 - backend/   -> Node + Express API (port 4000)
 - frontend/  -> React + Vite SPA (port 5173)

Quickstart (development)
------------------------
1. Start backend:
   cd backend
   npm install
   npm start

2. Start frontend:
   cd frontend
   npm install
   npm run dev

3. Open frontend at http://localhost:5173

Notes
-----
- This project uses public Nominatim and OSRM services (suitable for demo/prototype). For production, self-host Nominatim & OSRM or use paid routing providers.
- The backend implements a heuristic CO₂/fuel model. For a true AI-powered model, replace the heuristic with a trained model and a dataset (e.g. using telemetry).
"# EcoRoute" 
