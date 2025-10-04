
import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { computeRoute } from './utils_api'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function App() {
  const mapRef = useRef(null)
  const mapDivRef = useRef(null)
  const [from, setFrom] = useState('Times Square, New York')
  const [to, setTo] = useState('Central Park, New York')
  const [vehicle, setVehicle] = useState('van')
  const [optimizeFor, setOptimizeFor] = useState('co2')
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    mapRef.current = L.map(mapDivRef.current, { center: [40.758, -73.9855], zoom: 13 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current)
    return () => mapRef.current && mapRef.current.remove()
  }, [])

  async function compute() {
    try {
      setAnalysis(null)
      const payload = { from, to, vehicle, optimizeFor }
      const j = await computeRoute(payload)

      mapRef.current.eachLayer(layer => {
        if (layer.options && layer.options.pane === 'overlayPane') {
          try { mapRef.current.removeLayer(layer) } catch (e) {}
        }
      })

      const fm = j.from
      const tm = j.to
      L.marker([fm.lat, fm.lon]).addTo(mapRef.current).bindPopup('Source: '+fm.display_name)
      L.marker([tm.lat, tm.lon]).addTo(mapRef.current).bindPopup('Destination: '+tm.display_name)

      const shortest = j.shortest
      const eco = j.eco

      L.polyline(shortest.poly, { color: '#1E90FF', weight: 5, opacity: 0.9 }).addTo(mapRef.current)
      L.polyline(eco.poly, { color: '#2ecc71', weight: 5, opacity: 0.9 }).addTo(mapRef.current)

      const all = shortest.poly.concat(eco.poly)
      mapRef.current.fitBounds(all, { padding: [40,40] })

      setAnalysis({
        shortest: shortest.estimate,
        eco: eco.estimate,
        co2SavedPercent: j.co2SavedPercent
      })

    } catch (err) {
      alert('Error: '+err.message)
      console.error(err)
    }
  }

  useEffect(() => { compute() }, [])

  return (
    <div className="app-grid">
      <aside className="side-panel">
        <h1 className="brand">EcoRoute</h1>

        <div className="controls card">
          <label>Source</label>
          <input value={from} onChange={e => setFrom(e.target.value)} />
          <label>Destination</label>
          <input value={to} onChange={e => setTo(e.target.value)} />

          <div className="row">
            <label>Vehicle</label>
            <select value={vehicle} onChange={e => setVehicle(e.target.value)}>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="bike">Bike</option>
              <option value="ev">EV</option>
            </select>
          </div>

          <div className="row toggle">
            <label>Optimize for</label>
            <div className="toggle-buttons">
              <button className={optimizeFor === 'time' ? 'active' : ''} onClick={() => setOptimizeFor('time')}>Time</button>
              <button className={optimizeFor === 'co2' ? 'active' : ''} onClick={() => setOptimizeFor('co2')}>CO₂</button>
            </div>
          </div>

          <button className="primary wide" onClick={compute}>Calculate routes</button>
        </div>

        <div className="cards card">
          <h3>Route comparison</h3>
          {analysis ? (
            <>
              <div className="metric">
                <div>
                  <small>Shortest — Distance</small>
                  <div className="big">{analysis.shortest.distanceKm} km</div>
                </div>
                <div>
                  <small>Eco — Distance</small>
                  <div className="big">{analysis.eco.distanceKm} km</div>
                </div>
              </div>

              <div className="metric">
                <div>
                  <small>Shortest — Time</small>
                  <div className="big">{analysis.shortest.durationMin} min</div>
                </div>
                <div>
                  <small>Eco — Time</small>
                  <div className="big">{analysis.eco.durationMin} min</div>
                </div>
              </div>

              <div className="metric">
                <div>
                  <small>Shortest — Fuel (L)</small>
                  <div className="big">{analysis.shortest.fuelL}</div>
                </div>
                <div>
                  <small>Eco — Fuel (L)</small>
                  <div className="big">{analysis.eco.fuelL}</div>
                </div>
              </div>

              <div className="metric">
                <div>
                  <small>CO₂ saved</small>
                  <div className="big">{analysis.co2SavedPercent}%</div>
                </div>
              </div>
            </>
          ) : (
            <div>Loading analysis…</div>
          )}
        </div>

        <div className="card small-analytics">
          <h3>Analytics</h3>
          {analysis && (
            <Bar data={{
              labels: ['Distance (km)', 'Time (min)', 'Fuel (L)', 'CO₂ (kg)'],
              datasets: [
                { label: 'Shortest', data: [analysis.shortest.distanceKm, analysis.shortest.durationMin, analysis.shortest.fuelL, analysis.shortest.co2Kg] },
                { label: 'Eco', data: [analysis.eco.distanceKm, analysis.eco.durationMin, analysis.eco.fuelL, analysis.eco.co2Kg] }
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          )}
        </div>

        <footer className="card muted">
          <small>Production-ready backend required for real CO₂ models • This demo proxies public services.</small>
        </footer>
      </aside>

      <main className="map-wrap">
        <div ref={mapDivRef} id="map" style={{ height: '100%', width: '100%' }}></div>
      </main>
    </div>
  )
}
