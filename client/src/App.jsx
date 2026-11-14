
import { useEffect, useState } from 'react'
import './App.css'
import AuthForm from './AuthForm'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [originalText, setOriginalText] = useState('')
  const [loading, setLoading] = useState(false)
  const [exhibit, setExhibit] = useState(null)
  const [error, setError] = useState('')
  const [exhibits, setExhibits] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let ignore = false

    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (ignore) return

        setUser(data.user)

        // Load this user's exhibitions
        const exhibitsResponse = await fetch('/api/exhibits', {
          credentials: 'include'
        })

        if (!exhibitsResponse.ok) {
          throw new Error('Failed to load exhibitions.')
        }

        const exhibitsData = await exhibitsResponse.json()

        if (!ignore) {
          setExhibits(exhibitsData)
        }

      } catch (err) {
        if (!ignore) {
          console.error('Session check error:', err)
        }
      } finally {
        if (!ignore) {
          setAuthChecked(true)
          setGalleryLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      ignore = true
    }
  }, [])
  useEffect(() => {
  async function checkBackend() {
    try {
      const response = await fetch('/api/health')

      if (!response.ok) {
        throw new Error('Backend unavailable')
      }

      setBackendStatus('Connected')
    } catch (err) {
      console.error('Backend connection error:', err)
      setBackendStatus('Disconnected')
    }
  }

  checkBackend()
}, [])
  function handleAuthenticated(userData) {
    setUser(userData)
    setError('')
    fetchExhibits()
  }
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to log out.')
      }

      setUser(null)
      setExhibits([])
      setExhibit(null)
      setOriginalText('')
      setError('')

    } catch (err) {
      setError(err.message)
    }
  }
  // Fetch all saved exhibits
  async function fetchExhibits() {
    try {
      const response = await fetch('/api/exhibits', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load exhibits.')
      }

      const data = await response.json()
      setExhibits(data)
    } catch (err) {
      console.error('Gallery error:', err)
    } finally {
      setGalleryLoading(false)
    }
  }
  // Submit a new memory
  async function handleSubmit(event) {
    event.preventDefault()

    if (!originalText.trim()) {
      setError('Please write a memory first.')
      return
    }

    setLoading(true)
    setError('')
    setExhibit(null)

    try {
      const response = await fetch('/api/exhibits', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ originalText })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(
            'Our AI curator is temporarily unavailable. Please try again in a moment!'
          )
        }

        throw new Error(
          data.error || 'Something went wrong while creating your exhibit.'
        )
      }

      setExhibit(data.exhibit ?? data)
      setOriginalText('')

      // Update gallery after successful creation
      await fetchExhibits()

    } catch (err) {
      setError(err.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  
return (
  <main className="museum">
    <header className="header">
      <h1>Life Museum</h1>
      <p>A museum of your ordinary moments.</p>
    </header>

    <section className="intro">
      <p className="eyebrow">YOUR PERSONAL COLLECTION</p>
      <h2>Every moment has a story.</h2>
      <p>
        Turn the little things in your life into exhibits
        worth remembering.
      </p>
    </section>

    {!authChecked ? (
      <p>Checking your account...</p>
    ) : !user ? (
      <AuthForm onAuthenticated={handleAuthenticated} />
    ) : (
      <>
        {/* Logged-in user's account information */}
        <div className="account-bar">
          <span>Logged in as {user.email}</span>
          <button onClick={handleLogout}>
            Log out
          </button>
        </div>

        {/* Create a new exhibit */}
        <section className="memory-form">
          <h2>Create a new exhibit</h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="memory">
              What moment would you like to preserve?
            </label>

            <textarea
              id="memory"
              value={originalText}
              onChange={(event) => setOriginalText(event.target.value)}
              placeholder="Today, I had coffee with an old friend..."
              rows={5}
              disabled={loading}
            />

            <button type="submit" disabled={loading}>
              {loading
                ? 'Our curator is preparing your exhibit...'
                : 'Create my exhibit'}
            </button>

            {loading && (
              <p className="loading-message">
                Please wait while our AI curator prepares your exhibit.
              </p>
            )}

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>

        {/* Newly generated exhibit */}
        {exhibit && (
          <section className="exhibit">
            <p className="eyebrow">NEWLY ACQUIRED</p>
            <h2>{exhibit.title}</h2>
            <h3>{exhibit.subtitle}</h3>
            <p>{exhibit.description}</p>

            <div className="exhibit-tags">
              {exhibit.tags?.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </section>
        )}

        {/* Saved exhibit gallery */}
        <section className="gallery">
          <p className="eyebrow">THE COLLECTION</p>
          <h2>Memory Archive</h2>
          <p>Little moments, preserved in time.</p>

          {galleryLoading ? (
            <p>Opening the museum...</p>
          ) : exhibits.length === 0 ? (
            <p>Your museum is still empty. Create your first exhibit!</p>
          ) : (
            <div className="exhibit-grid">
              {exhibits.map((item) => (
                <article className="exhibit-card" key={item.id}>
                  <p className="eyebrow">EXHIBIT #{item.id}</p>
                  <h3>{item.title}</h3>
                  <h4>{item.subtitle}</h4>
                  <p>{item.description}</p>

                  <div className="exhibit-tags">
                    {item.tags?.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>

                  <small>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </>
    )}

    <p className="connection-status">
      Backend status: {backendStatus}
    </p>
  </main>
)
}

export default App
