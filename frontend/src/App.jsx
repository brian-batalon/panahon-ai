import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Fix default marker icon
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})
L.Marker.prototype.options.icon = DefaultIcon

const API_URL = import.meta.env.VITE_API_URL || 'https://panahon-ai-production.up.railway.app'

// Philippines center
const PH_CENTER = [12.8797, 121.7740]
const DEFAULT_ZOOM = 6

function FlyToLocation({ position }) {
  const map = useMap()
  if (position) {
    map.flyTo(position, 10, { duration: 1.5 })
  }
  return null
}

function App() {
  const [municipality, setMunicipality] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mapPosition, setMapPosition] = useState(null)

  const handleSearch = async () => {
    if (!municipality) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/health`)
      const data = await res.json()
      setResult(data)
      // Placeholder: fly to sample coordinates for now
      setMapPosition([14.5265, 121.1536]) // Angono, Rizal
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">🌿</div>
          Panahon AI
        </div>
        <div className="nav-links">
          <span>Home</span>
          <span>About</span>
          <span>Contact</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <h1>
          Weather Predictions,<br />
          <span className="highlight">Made for the Philippines</span>
        </h1>
        <p>
          AI-powered 6-hour weather forecasts for any municipality. Built with XGBoost, powered by open data.
        </p>
      </div>

      {/* Search */}
      <div className="search-card">
        <label>Search Municipality</label>
        <div className="search-row">
          <input
            type="text"
            placeholder="e.g. Angono, Baguio, Cebu City..."
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="map-card">
        <MapContainer
          center={PH_CENTER}
          zoom={DEFAULT_ZOOM}
          className="map-container"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapPosition && (
            <Marker position={mapPosition}>
              <Popup>{municipality}</Popup>
            </Marker>
          )}
          <FlyToLocation position={mapPosition} />
        </MapContainer>
      </div>

      {/* Result */}
      {result && (
        <div className="result-card">
          <h3>📡 API Response</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* Features */}
      <div className="features">
        <div className="feature-card">
          <div className="icon">🤖</div>
          <h4>AI-Powered</h4>
          <p>XGBoost model</p>
        </div>
        <div className="feature-card">
          <div className="icon">⏱️</div>
          <h4>6-Hour Forecast</h4>
          <p>Real-time data</p>
        </div>
        <div className="feature-card">
          <div className="icon">📍</div>
          <h4>All PH Cities</h4>
          <p>1,634 municipalities</p>
        </div>
      </div>
    </div>
  )
}

export default App