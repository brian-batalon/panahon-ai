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

function App() {
  const [municipality, setMunicipality] = useState('')
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState(null)
  const [mapPosition, setMapPosition] = useState(null)

  const mapRef = useRef(null)

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
      </div>

      {/* Search Bar */}
      <div className="search-overlay">
        <input
          type="text"
          placeholder="Search any municipality in the Philippines..."
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {/* Weather Card */}
      {weatherData && !weatherData.error && (
        <div className="weather-card">
          <div className="location">
            {weatherData.name}
            <span>Current conditions</span>
          </div>
          <div className="weather-grid">
            <div className="weather-item">
              <div className="label">Temp</div>
              <div className="value">{weatherData.temp}°<span className="unit">C</span></div>
            </div>
            <div className="weather-item">
              <div className="label">Humidity</div>
              <div className="value">{weatherData.humidity}<span className="unit">%</span></div>
            </div>
            <div className="weather-item">
              <div className="label">Clouds</div>
              <div className="value">{weatherData.clouds}<span className="unit">%</span></div>
            </div>
            <div className="weather-item">
              <div className="label">Rain</div>
              <div className="value">{weatherData.rain}<span className="unit">mm</span></div>
            </div>
            <div className="weather-item">
              <div className="label">Condition</div>
              <div className="value" style={{fontSize:'1.2rem'}}>
                {weatherData.condition <= 3 ? '☀️' : weatherData.condition <= 48 ? '☁️' : weatherData.condition <= 67 ? '🌧️' : '⛈️'}
              </div>
            </div>
            <div className="weather-item">
              <div className="label">AI 6h</div>
              <div className="value" style={{fontSize:'0.75rem', color:'#86efac'}}>Soon</div>
            </div>
          </div>
        </div>
      )}

      {weatherData && weatherData.error && (
        <div className="weather-card" style={{textAlign:'center', color:'#fca5a5'}}>
          {weatherData.error}
        </div>
      )}

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
  )
}

export default App