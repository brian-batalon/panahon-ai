import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Fix Leaflet default icon
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

const PH_CENTER = [12.8797, 121.7740]
const DEFAULT_ZOOM = 6

function tempColor(temp) {
  if (temp >= 35) return '#ef4444'
  if (temp >= 32) return '#f97316'
  if (temp >= 28) return '#eab308'
  if (temp >= 24) return '#22d3ee'
  return '#3b82f6'
}

function FlyToLocation({ position }) {
  const map = useMap()
  if (position) map.flyTo(position, 11, { duration: 1.2 })
  return null
}

function WelcomeModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h1>🌿 Panahon AI</h1>
        <p className="modal-subtitle">
          An intelligent weather monitoring and prediction system powered by Machine Learning and Geographic Information Systems (GIS), designed to serve communities across the Philippines with accurate 6-hour weather forecasts.
        </p>
        
        <div className="modal-section">
          <h3>🗺️ On-Demand Monitoring</h3>
          <p>Panahon AI fetches real-time weather data for any municipality you search, using the Open-Meteo API. No unnecessary data collection — only the locations that matter to you.</p>
        </div>
        
        <div className="modal-section">
          <h3>🤖 AI-Powered Forecasting</h3>
          <p>The system uses an XGBoost machine learning model to forecast temperature, humidity, cloud cover, and rain probability 6 hours ahead, helping you make informed decisions.</p>
        </div>
        
        <div className="modal-section">
          <h3>📊 Data-Driven Insights</h3>
          <p>All weather readings, predictions, and search logs are stored in a structured database, building a growing dataset for model retraining, climate research, and policy-making.</p>
        </div>
        
        <div className="modal-section">
          <h3>🇵🇭 Why It Matters</h3>
          <p>The Philippines faces increasing climate-related risks. Panahon AI empowers local governments, emergency responders, farmers, and communities with actionable weather data to make informed decisions and ultimately save lives.</p>
        </div>
        
        <div className="modal-footer">
          <p>Built by <strong>Engr. Brian Ezekiel D. Batalon, ECE, ECT, SO2</strong></p>
          <button className="modal-start-btn" onClick={onClose}>Get Started</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [municipality, setMunicipality] = useState('')
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState(null)
  const [mapPosition, setMapPosition] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)

  const mapRef = useRef(null)

  useEffect(() => {
    const visited = localStorage.getItem('panahon-ai-visited')
    if (!visited) {
      setShowWelcome(true)
    }
  }, [])

  const closeWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem('panahon-ai-visited', 'true')
  }

  const handleSearch = async () => {
    if (!municipality.trim()) return
    setLoading(true)
    setWeatherData(null)
    setMapPosition(null)

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(municipality)},Philippines&format=json&limit=1`
      )
      const geoData = await geoRes.json()

      if (!geoData.length) {
        setWeatherData({ error: 'Location not found. Try a different name.' })
        setLoading(false)
        return
      }

      const { lat, lon, display_name } = geoData[0]
      const placeName = display_name.split(',')[0]

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,cloud_cover,rain,weather_code`
      )
      const weatherJson = await weatherRes.json()
      const current = weatherJson.current

      setWeatherData({
        name: placeName,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        temp: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        clouds: current.cloud_cover,
        rain: current.rain || 0,
        condition: current.weather_code,
      })
      setMapPosition([parseFloat(lat), parseFloat(lon)])
    } catch {
      setWeatherData({ error: 'Failed to fetch weather data.' })
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="app">
      {/* Welcome Modal */}
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🌿</div>
          <div>
            <h2>Panahon AI</h2>
            <p>Weather Intelligence for the Philippines</p>
          </div>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search any municipality..."
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '...' : '🔍'}
          </button>
        </div>

        {weatherData && !weatherData.error && (
          <div className="sidebar-weather">
            <h3>📍 {weatherData.name}</h3>
            <div className="sidebar-grid">
              <div className="sidebar-item">
                <span className="s-label">Temperature</span>
                <span className="s-value">{weatherData.temp}°C</span>
              </div>
              <div className="sidebar-item">
                <span className="s-label">Humidity</span>
                <span className="s-value">{weatherData.humidity}%</span>
              </div>
              <div className="sidebar-item">
                <span className="s-label">Cloud Cover</span>
                <span className="s-value">{weatherData.clouds}%</span>
              </div>
              <div className="sidebar-item">
                <span className="s-label">Rain</span>
                <span className="s-value">{weatherData.rain} mm</span>
              </div>
              <div className="sidebar-item">
                <span className="s-label">Condition</span>
                <span className="s-value" style={{fontSize:'1.5rem'}}>
                  {weatherData.condition <= 3 ? '☀️' : weatherData.condition <= 48 ? '☁️' : weatherData.condition <= 67 ? '🌧️' : '⛈️'}
                </span>
              </div>
              <div className="sidebar-item">
                <span className="s-label">AI 6-Hour Forecast</span>
                <span className="s-value" style={{color:'#86efac', fontSize:'0.8rem'}}>Coming soon</span>
              </div>
            </div>
          </div>
        )}

        {weatherData && weatherData.error && (
          <div className="sidebar-weather" style={{color:'#fca5a5', textAlign:'center'}}>
            {weatherData.error}
          </div>
        )}

        <div className="sidebar-footer">
          <p>Built by <strong>Engr. Brian Ezekiel D. Batalon</strong></p>
          <p className="credentials">ECE, ECT, SO2</p>
        </div>
      </div>

      {/* Map */}
      <div className="map-area">
        <MapContainer
          ref={mapRef}
          center={PH_CENTER}
          zoom={DEFAULT_ZOOM}
          className="map-container"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapPosition && weatherData && !weatherData.error && (
            <Marker
              position={mapPosition}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                  width:18px;height:18px;border-radius:50%;
                  background:${tempColor(weatherData.temp)};
                  border:3px solid white;
                  box-shadow:0 2px 10px rgba(0,0,0,0.5);
                "></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
              })}
            >
              <Popup>
                <strong>{weatherData.name}</strong><br/>
                🌡️ {weatherData.temp}°C &nbsp; 💧 {weatherData.humidity}%<br/>
                ☁️ Clouds: {weatherData.clouds}%
              </Popup>
            </Marker>
          )}
          <FlyToLocation position={mapPosition} />
        </MapContainer>

        {/* Legend */}
        <div className="map-legend">
          <h4>Temperature</h4>
          <div className="legend-row"><div className="legend-dot" style={{background:'#ef4444'}}/> 35°C+</div>
          <div className="legend-row"><div className="legend-dot" style={{background:'#f97316'}}/> 32-35°C</div>
          <div className="legend-row"><div className="legend-dot" style={{background:'#eab308'}}/> 28-32°C</div>
          <div className="legend-row"><div className="legend-dot" style={{background:'#22d3ee'}}/> 24-28°C</div>
          <div className="legend-row"><div className="legend-dot" style={{background:'#3b82f6'}}/> &lt;24°C</div>
        </div>
      </div>
    </div>
  )
}

export default App