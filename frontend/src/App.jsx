import { useState, useEffect, useRef } from 'react'
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
const OWM_KEY = '1ef9f1f0fe4e2692a69ad484915371cd'

const PH_CENTER = [12.8797, 121.7740]
const DEFAULT_ZOOM = 6

// Weather color scale
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

// Weather markers component
function WeatherMarkers({ data, onMarkerClick }) {
  const map = useMap()
  
  useEffect(() => {
    if (!data || !data.length) return
    
    const markers = data.map(city => {
      const color = tempColor(city.temp)
      const icon = L.divIcon({
        className: 'weather-marker',
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:${color};border:2px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      
      const marker = L.marker([city.lat, city.lon], { icon })
        .bindPopup(`
          <strong>${city.name}</strong><br/>
          🌡️ ${city.temp}°C &nbsp; ☁️ ${city.clouds}%<br/>
          💧 ${city.humidity}% &nbsp; 🌧️ ${city.rain || 0}mm
        `)
      
      marker.on('click', () => onMarkerClick(city))
      return marker
    })
    
    const group = L.featureGroup(markers).addTo(map)
    map.fitBounds(group.getBounds().pad(0.1))
    
    return () => map.removeLayer(group)
  }, [data, map, onMarkerClick])
  
  return null
}

function App() {
  const [municipality, setMunicipality] = useState('')
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [mapPosition, setMapPosition] = useState(null)
  const [weatherData, setWeatherData] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const mapRef = useRef(null)

  // Fetch weather for major PH cities on load
  useEffect(() => {
    const cities = [
      { name: 'Manila', lat: 14.5995, lon: 120.9842 },
      { name: 'Cebu', lat: 10.3157, lon: 123.8854 },
      { name: 'Davao', lat: 7.1907, lon: 125.4553 },
      { name: 'Baguio', lat: 16.4023, lon: 120.5960 },
      { name: 'Zamboanga', lat: 6.9214, lon: 122.0790 },
      { name: 'Cagayan de Oro', lat: 8.4542, lon: 124.6319 },
      { name: 'Iloilo', lat: 10.7202, lon: 122.5621 },
      { name: 'Tacloban', lat: 11.2427, lon: 125.0072 },
      { name: 'Puerto Princesa', lat: 9.7381, lon: 118.7372 },
      { name: 'Legazpi', lat: 13.1391, lon: 123.7438 },
      { name: 'Tuguegarao', lat: 17.6132, lon: 121.7269 },
      { name: 'General Santos', lat: 6.1139, lon: 125.1717 },
    ]

    Promise.all(
      cities.map(async city => {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OWM_KEY}&units=metric`
          )
          const data = await res.json()
          return {
            name: city.name,
            lat: city.lat,
            lon: city.lon,
            temp: Math.round(data.main.temp),
            humidity: data.main.humidity,
            clouds: data.clouds.all,
            rain: data.rain ? data.rain['1h'] || 0 : 0,
            condition: data.weather[0].main,
          }
        } catch {
          return null
        }
      })
    ).then(results => {
      setWeatherData(results.filter(Boolean))
    })
  }, [])

  const handleSearch = async () => {
    if (!municipality) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/health`)
      const data = await res.json()
      setPrediction({
        temperature: 32,
        humidity: 78,
        rainProbability: 45,
      })
      setMapPosition([14.5265, 121.1536])
    } catch (err) {
      setPrediction({ error: err.message })
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleMarkerClick = (city) => {
    setSelectedCity(city)
    setMunicipality(city.name)
    setMapPosition([city.lat, city.lon])
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
              placeholder="Search municipality..."
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Predicting...' : 'Get AI Forecast'}
            </button>
          </div>

          {/* Prediction */}
          <div className="prediction-card">
            <h3>📍 {selectedCity ? selectedCity.name : 'Select a city or search'}</h3>
            {selectedCity ? (
              <div className="prediction-grid">
                <div className="prediction-item">
                  <div className="label">Temperature</div>
                  <div className="value">{selectedCity.temp}°<span className="unit">C</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Humidity</div>
                  <div className="value">{selectedCity.humidity}<span className="unit">%</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Clouds</div>
                  <div className="value">{selectedCity.clouds}<span className="unit">%</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Rain</div>
                  <div className="value">{selectedCity.rain}<span className="unit">mm</span></div>
                </div>
                <div className="prediction-item">
                  <div className="label">Condition</div>
                  <div className="value" style={{fontSize:'0.9rem'}}>{selectedCity.condition === 'Clouds' ? '☁️' : selectedCity.condition === 'Rain' ? '🌧️' : '☀️'}</div>
                </div>
                <div className="prediction-item">
                  <div className="label">AI Forecast</div>
                  <div className="value" style={{fontSize:'0.75rem', color:'#4a6741'}}>Coming soon</div>
                </div>
              </div>
            ) : (
              <div className="prediction-empty">
                Click a city on the map or search above
              </div>
            )}
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
            {weatherData && (
              <WeatherMarkers data={weatherData} onMarkerClick={handleMarkerClick} />
            )}
            {mapPosition && (
              <Marker position={mapPosition}>
                <Popup>{municipality}</Popup>
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