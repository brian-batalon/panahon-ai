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

  return (
    <div className="app">
      <h1>🌤️ Panahon AI</h1>
      <p>Weather prediction for any municipality in the Philippines</p>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Enter a municipality..."
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {result && (
        <div className="result">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default App