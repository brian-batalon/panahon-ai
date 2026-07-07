import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://panahon-ai-production.up.railway.app'

function App() {
  const [municipality, setMunicipality] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!municipality) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/health`)
      const data = await res.json()
      setResult(data)
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