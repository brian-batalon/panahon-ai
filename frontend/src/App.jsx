import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

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
const OWM_KEY = '1ef9f1f0fe4e2692a69ad484915371cd'

const PH_CENTER = [12.8797, 121.7740]
const DEFAULT_ZOOM = 6

function tempColor(temp) {
  if (temp >= 35) return '#ef4444'
  if (temp >= 32) return '#f97316'
  if (temp >= 28) return '#eab308'
  if (temp >= 24) return '#22d3ee'
  return '#3b82f6'
}

function conditionEmoji(code) {
  if (code >= 200 && code < 300) return '⛈️'
  if (code >= 300 && code < 600) return '🌧️'
  if (code >= 600 && code < 700) return '🌨️'
  if (code >= 700 && code < 800) return '🌫️'
  if (code === 800) return '☀️'
  if (code === 801) return '🌤️'
  if (code === 802) return '⛅'
  if (code >= 803) return '☁️'
  return '🌡️'
}

function createPinIcon(temp, emoji) {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        transform:translate(-50%,-100%);
      ">
        <div style="
          background:rgba(26,26,26,0.9);
          backdrop-filter:blur(8px);
          border:2px solid ${tempColor(temp)};
          border-radius:12px;
          padding:4px 8px;
          font-size:0.75rem;
          font-weight:700;
          color:white;
          white-space:nowrap;
          margin-bottom:2px;
        ">${temp}°C ${emoji}</div>
        <div style="
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:8px solid ${tempColor(temp)};
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
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
        <h1>⛅ Panahon AI</h1>
        <p className="modal-subtitle">
          An intelligent weather monitoring and prediction system powered by Machine Learning and Geographic Information Systems (GIS), designed to serve communities across the Philippines with accurate weather forecasts.
        </p>
        
        <div className="modal-section">
          <h3>🗺️ On-Demand Monitoring</h3>
          <p>Panahon AI fetches real-time weather data for any municipality you search, using the OpenWeatherMap and Open-Meteo APIs.</p>
        </div>
        
        <div className="modal-section">
          <h3>🤖 AI-Powered Forecasting</h3>
          <p>Uses XGBoost machine learning models to forecast temperature, humidity, cloud cover, and rain probability 6, 12, and 24 hours ahead.</p>
        </div>
        
        <div className="modal-section">
          <h3>📊 Data-Driven Insights</h3>
          <p>All readings and predictions are stored for model retraining, climate research, and policy-making.</p>
        </div>
        
        <div className="modal-section">
          <h3>🇵🇭 Why It Matters</h3>
          <p>The Philippines faces increasing climate-related risks. Panahon AI empowers communities with actionable weather data.</p>
        </div>
        
        <div className="modal-footer">
          <p>Built by <strong>Engr. Brian Ezekiel D. Batalon, ECE, ECT, SO2</strong></p>
          <button className="modal-start-btn" onClick={onClose}>Get Started</button>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={onClose}>✕</button>
        
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⛅</div>
          <div>
            <h2>Panahon AI</h2>
            <p>Weather Intelligence for the Philippines</p>
          </div>
        </div>

        <div className="sidebar-info">
          <p>An intelligent weather monitoring and prediction system powered by Machine Learning and GIS, providing 6, 12, and 24-hour forecasts for any municipality in the Philippines.</p>
        </div>

        <div className="sidebar-section">
          <h3>🗺️ On-Demand</h3>
          <p>Fetches real-time data only for locations you search — no wasted resources.</p>
        </div>

        <div className="sidebar-section">
          <h3>🤖 XGBoost ML</h3>
          <p>Multi-output AI model: Temp 78.8%, Humidity 67.8%, Clouds 49.7%, Rain predictions.</p>
        </div>

        <div className="sidebar-section">
          <h3>📡 OpenWeatherMap + Open-Meteo</h3>
          <p>Free and open weather data APIs for reliable forecasts.</p>
        </div>

        <div className="sidebar-section">
          <h3>🗄️ Supabase</h3>
          <p>All data stored for future model retraining and climate research.</p>
        </div>

        <div className="sidebar-footer">
          <p>Built by</p>
          <p className="sidebar-name">Engr. Brian Ezekiel D. Batalon</p>
          <p className="sidebar-credentials">ECE, ECT, SO2</p>
        </div>
      </div>
    </>
  )
}

function App() {
  const [municipality, setMunicipality] = useState('')
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState(null)
  const [aiPredictions, setAiPredictions] = useState(null)
  const [mapPosition, setMapPosition] = useState(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [forecastHour, setForecastHour] = useState(0)

  const mapRef = useRef(null)

  const closeWelcome = () => setShowWelcome(false)

  const handleSearch = async () => {
    if (!municipality.trim()) return
    setLoading(true)
    setWeatherData(null)
    setAiPredictions(null)
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
      const latNum = parseFloat(lat)
      const lonNum = parseFloat(lon)

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
      )

      if (!weatherRes.ok) {
        setWeatherData({ error: 'Weather service unavailable. Try again later.' })
        setLoading(false)
        return
      }

      const weatherJson = await weatherRes.json()

      setWeatherData({
        name: placeName,
        lat: latNum,
        lon: lonNum,
        temp: Math.round(weatherJson.main.temp),
        humidity: weatherJson.main.humidity,
        clouds: weatherJson.clouds.all,
        rain: weatherJson.rain ? Math.round(weatherJson.rain['1h'] * 100 / 10) || 0 : 0,
        condition: weatherJson.weather[0].id,
      })

      // Call AI prediction
      try {
        const predRes = await fetch(`${API_URL}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current: {
              temperature: weatherJson.main.temp,
              humidity: weatherJson.main.humidity,
              cloud_cover: weatherJson.clouds.all,
            },
            lat: latNum,
            lon: lonNum,
            hours: [6, 12, 24]
          })
        })
        const predData = await predRes.json()
        setAiPredictions(predData.predictions)
      } catch {}

      setMapPosition([latNum, lonNum])
    } catch {
      setWeatherData({ error: 'Failed to fetch weather data. Please try again.' })
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="app">
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              icon={createPinIcon(weatherData.temp, conditionEmoji(weatherData.condition))}
            >
              <Popup>
                <strong>{weatherData.name}</strong><br/>
                🌡️ {weatherData.temp}°C &nbsp; 💧 {weatherData.humidity}%<br/>
                ☁️ Clouds: {weatherData.clouds}% &nbsp; 🌧️ Rain: {weatherData.rain}%
              </Popup>
            </Marker>
          )}
          <FlyToLocation position={mapPosition} />
        </MapContainer>

        <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>☰</button>

        <div className="search-float">
          <input
            type="text"
            placeholder="Search municipality..."
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '...' : '🔍'}
          </button>
        </div>

        {weatherData && !weatherData.error && (
          <div className="weather-card">
            <div className="weather-card-header">
              <span className="weather-location">📍 {weatherData.name}</span>
            </div>

            <div className="forecast-tabs">
              {[0, 6, 12, 24].map(h => (
                <button
                  key={h}
                  className={`forecast-tab ${forecastHour === h ? 'active' : ''}`}
                  onClick={() => setForecastHour(h)}
                >
                  {h === 0 ? 'Now' : `${h}h`}
                </button>
              ))}
            </div>

            <div className="weather-card-grid">
              <div className="wc-item">
                <span className="wc-label">Temp</span>
                <span className="wc-value">
                  {forecastHour === 0 
                    ? `${weatherData.temp}°C`
                    : aiPredictions?.[`${forecastHour}h`]?.temperature 
                      ? `${aiPredictions[`${forecastHour}h`].temperature}°C`
                      : '—'
                  }
                </span>
              </div>
              <div className="wc-item">
                <span className="wc-label">Humidity</span>
                <span className="wc-value">
                  {forecastHour === 0 
                    ? `${weatherData.humidity}%`
                    : aiPredictions?.[`${forecastHour}h`]?.humidity 
                      ? `${aiPredictions[`${forecastHour}h`].humidity}%`
                      : '—'
                  }
                </span>
              </div>
              <div className="wc-item">
                <span className="wc-label">Clouds</span>
                <span className="wc-value">
                  {forecastHour === 0 
                    ? `${weatherData.clouds}%`
                    : aiPredictions?.[`${forecastHour}h`]?.clouds 
                      ? `${aiPredictions[`${forecastHour}h`].clouds}%`
                      : '—'
                  }
                </span>
              </div>
              <div className="wc-item">
                <span className="wc-label">Rain</span>
                <span className="wc-value">
                  {forecastHour === 0 
                    ? `${weatherData.rain}%`
                    : aiPredictions?.[`${forecastHour}h`]?.rain 
                      ? `${Math.round(aiPredictions[`${forecastHour}h`].rain * 10)}%`
                      : '—'
                  }
                </span>
              </div>
              <div className="wc-item">
                <span className="wc-label">Condition</span>
                <span className="wc-value" style={{fontSize:'1.4rem'}}>
                  {forecastHour === 0 ? conditionEmoji(weatherData.condition) : '🤖'}
                </span>
              </div>
              <div className="wc-item">
                <span className="wc-label">AI Model</span>
                <span className="wc-value" style={{color:'#86efac', fontSize:'0.7rem'}}>
                  {forecastHour === 0 ? 'Now' : aiPredictions ? 'XGBoost AI' : '...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {weatherData && weatherData.error && (
          <div className="weather-card" style={{textAlign:'center', color:'#fca5a5'}}>
            {weatherData.error}
          </div>
        )}
      </div>
    </div>
  )
}

export default App