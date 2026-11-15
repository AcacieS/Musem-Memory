
import { useEffect, useRef, useState } from 'react'
import './App.css'
import AuthForm from './AuthForm'
import ExhibitCard from './components/ExhibitCard'

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
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingExhibitId, setDeletingExhibitId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const deleteDialogRef = useRef(null)
  const deletingExhibitIdRef = useRef(null)

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
    let stopped = false
    let retryTimer

    async function checkBackend() {
      try {
        const response = await fetch('/api/health')
        if (!response.ok) throw new Error('Backend unavailable')
        if (!stopped) setBackendStatus('Connected')
      } catch {
        if (stopped) return
        setBackendStatus('Disconnected')
        retryTimer = setTimeout(checkBackend, 2000)
      }
    }

    checkBackend()
    return () => {
      stopped = true
      clearTimeout(retryTimer)
    }
  }, [])
  useEffect(() => {
    const dialog = deleteDialogRef.current
    if (!dialog) return

    if (pendingDelete && !dialog.open) {
      dialog.showModal()
    } else if (!pendingDelete && dialog.open) {
      dialog.close()
    }
  }, [pendingDelete])
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
  function requestDelete(exhibitToDelete) {
    setDeleteError('')
    setDeleteMessage('')
    setPendingDelete(exhibitToDelete)
  }

  function cancelDelete() {
    if (deletingExhibitIdRef.current !== null) return
    setDeleteError('')
    setPendingDelete(null)
  }

  function handleDeleteDialogCancel(event) {
    event.preventDefault()
    cancelDelete()
  }

  async function confirmDelete() {
    if (!pendingDelete || deletingExhibitIdRef.current !== null) return

    const exhibitId = pendingDelete.id
    deletingExhibitIdRef.current = exhibitId
    setDeletingExhibitId(exhibitId)
    setDeleteError('')

    try {
      const response = await fetch(`/api/exhibits/${exhibitId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Could not delete this exhibit. Please try again.')
      }

      setExhibits(current => current.filter(item => item.id !== exhibitId))
      setExhibit(current => current?.id === exhibitId ? null : current)
      setPendingDelete(null)
      setDeleteMessage('Exhibit deleted.')
    } catch (err) {
      const message = err instanceof TypeError
        ? 'Could not reach the server. Your exhibit is still in your museum. Please try again.'
        : err.message || 'Could not delete this exhibit. Please try again.'
      setDeleteError(message)
    } finally {
      deletingExhibitIdRef.current = null
      setDeletingExhibitId(null)
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

      const responseText = await response.text()
      let data = null

      const contentType = response.headers.get('content-type') || '(missing)'
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText)
        } catch {
          console.error('Exhibit response was not valid JSON.', {
            status: response.status,
            contentType,
            bodyLength: responseText.length
          })
        }
      } else {
        console.error('Exhibit response body was empty.', {
          status: response.status,
          contentType
        })
      }

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(
            'Our AI curator is temporarily unavailable. Please try again in a moment!'
          )
        }

        if (data?.error || data?.message) {
          throw new Error(data.error || data.message)
        }

        if (response.status === 502 && !contentType.includes('application/json')) {
          throw new Error(
            'The development proxy could not get a valid response from the API server (HTTP 502). Check that the backend is running on port 3000. Check your gallery before retrying; the exhibit may have been saved.'
          )
        }

        throw new Error(
          `The API returned HTTP ${response.status} without a JSON error message. Check the server terminal for the generation error.`
        )
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        console.error('Exhibit creation returned no usable data.', {
          status: response.status,
          contentType: response.headers.get('content-type')
        })
        throw new Error(
          'The server returned an empty or invalid response. Check your gallery before retrying; the exhibit may have been saved.'
        )
      }

      setExhibit(data.exhibit ?? data)
      setOriginalText('')

      // Update gallery after successful creation
      await fetchExhibits()

    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Could not connect to the server. Please try again.'
          : err.message || 'Could not create your exhibit. Please try again.'
      )
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

            <button type="submit" disabled={loading || backendStatus !== 'Connected'}>
              {loading
                ? 'Our curator is preparing your exhibit...'
                : backendStatus === 'Connected'
                  ? 'Create my exhibit'
                  : 'Connecting to the museum...'}
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
          {deleteMessage && <p className="delete-success" role="status">{deleteMessage}</p>}

          {galleryLoading ? (
            <p>Opening the museum...</p>
          ) : exhibits.length === 0 ? (
            <p>Your museum is still empty. Create your first exhibit!</p>
          ) : (
            <div className="exhibit-grid">
              {exhibits.map((item) => (
                <ExhibitCard
                  exhibit={item}
                  key={item.id}
                  onDeleteRequest={requestDelete}
                  isDeleting={deletingExhibitId === item.id}
                />
              ))}
            </div>
          )}
        </section>
        <dialog
          ref={deleteDialogRef}
          className="delete-dialog"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          aria-busy={deletingExhibitId !== null}
          onCancel={handleDeleteDialogCancel}
        >
          <h2 id="delete-dialog-title">Delete this exhibit?</h2>
          <p id="delete-dialog-description">
            This memory will be permanently removed from your museum. This action cannot be undone.
          </p>
          {deleteError && <p className="delete-dialog__error" role="alert">{deleteError}</p>}
          <div className="delete-dialog__actions">
            <button
              type="button"
              className="delete-dialog__cancel"
              onClick={cancelDelete}
              disabled={deletingExhibitId !== null}
              autoFocus
            >
              Cancel
            </button>
            <button
              type="button"
              className="delete-dialog__confirm"
              onClick={confirmDelete}
              disabled={deletingExhibitId !== null}
            >
              {deletingExhibitId !== null ? 'Deleting...' : 'Delete exhibit'}
            </button>
          </div>
        </dialog>
      </>
    )}

    <p className="connection-status">
      Backend status: {backendStatus}
    </p>
  </main>
)
}

export default App
