import { useState, useRef } from 'react'
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
  if (temp >= 35) return '#d63031'
  if (temp >= 32) return '#e17055'
  if (temp >= 28) return '#fdcb6e'
  if (temp >= 24) return '#81ecec'
  return '#74b9ff'
}

function FlyToLocation({ position }) {
  const map = useMap()
  if (position) map.flyTo(position, 10, { duration: 1.5 })
  return null
}

function App() {
  const [municipality, setMunicipality] = useState('')
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState(null)
  const [mapPosition, setMapPosition] = useState(null)

  const mapRef = useRef(null)

  const handleSearch = async () => {
    if (!municipality) return
    setLoading(true)
    setWeatherData(null)
    setMapPosition(null)

    try {
      // Geocode the municipality name to get coordinates
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

      // Fetch weather from Open-Meteo
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,cloud_cover,rain,weather_code`
      )
      const weatherJson = await weatherRes.json()
      const current = weatherJson.current

      const result = {
        name: placeName,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        temp: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        clouds: current.cloud_cover,
        rain: current.rain || 0,
        condition: current.weather_code,
      }

      setWeatherData(result)
      setMapPosition([parseFloat(lat), parseFloat(lon)])
    } catch (err) {
      setWeatherData({ error: 'Failed to fetch weather data.' })
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
          <div className="logo-dot" />
          Panahon AI
        </div>
        <div className="nav-links">
          <span>Map</span>
          <span>Forecast</span>
          <span>About</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Weather Forecast</h2>
            <p>AI-powered 6-hour predictions</p>
          </div>

          {/* Search */}
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search any municipality..."
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Weather Result */}
          {weatherData && !weatherData.error && (
            <div className="prediction-card">
              <h3>📍 {weatherData.name}</h3>
              <div className="prediction-grid">
                <div className="prediction-item">
                  <div className="label">Temperature</div>
                  <div className="value">{weatherData.temp}°<span className="unit">C</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Humidity</div>
                  <div className="value">{weatherData.humidity}<span className="unit">%</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Clouds</div>
                  <div className="value">{weatherData.clouds}<span className="unit">%</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Rain</div>
                  <div className="value">{weatherData.rain}<span className="unit">mm</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Condition</div>
                  <div className="value" style={{fontSize:'0.9rem'}}>
                    {weatherData.condition <= 3 ? '☀️' : weatherData.condition <= 48 ? '☁️' : weatherData.condition <= 67 ? '🌧️' : '⛈️'}
                  </div>
                </div>
                <div className="prediction-item">
                  <div className="label">AI Forecast</div>
                  <div className="value" style={{fontSize:'0.75rem', color:'#4a6741'}}>Coming soon</div>
                </div>
              </div>
            </div>
          )}

          {weatherData && weatherData.error && (
            <div className="prediction-card">
              <div className="prediction-empty" style={{color: '#d63031'}}>{weatherData.error}</div>
            </div>
          )}
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
                  className: 'weather-marker',
                  html: `<div style="
                    width:16px;height:16px;border-radius:50%;
                    background:${tempColor(weatherData.temp)};
                    border:3px solid white;
                    box-shadow:0 2px 8px rgba(0,0,0,0.4);
                  "></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })}
              >
                <Popup>
                  <strong>{weatherData.name}</strong><br/>
                  🌡️ {weatherData.temp}°C<br/>
                  💧 {weatherData.humidity}% &nbsp; ☁️ {weatherData.clouds}%
                </Popup>
              </Marker>
            )}
            <FlyToLocation position={mapPosition} />
          </MapContainer>

          {/* Legend */}
          <div className="map-legend">
            <h4>Temperature</h4>
            <div className="legend-row"><div className="legend-dot" style={{background:'#d63031'}}/> 35°C+ Hot</div>
            <div className="legend-row"><div className="legend-dot" style={{background:'#e17055'}}/> 32-35°C</div>
            <div className="legend-row"><div className="legend-dot" style={{background:'#fdcb6e'}}/> 28-32°C</div>
            <div className="legend-row"><div className="legend-dot" style={{background:'#81ecec'}}/> 24-28°C</div>
            <div className="legend-row"><div className="legend-dot" style={{background:'#74b9ff'}}/> &lt;24°C Cool</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App