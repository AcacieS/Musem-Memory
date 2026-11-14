
import { useState } from 'react'
import './AuthForm.css'

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint =
        mode === 'register' ? 'register' : 'login'

      // First, register or log in
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.')
      }

      // Registration does not create a session yet.
      // Log the user in automatically after registering.
      if (mode === 'register') {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        })

        const loginData = await loginResponse.json()

        if (!loginResponse.ok) {
          throw new Error(
            'Account created! Please log in with your new account.'
          )
        }

        onAuthenticated(loginData.user)
      } else {
        onAuthenticated(data.user)
      }

      setPassword('')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <section className="auth-container">
      <h2>
        {mode === 'login' ? 'Welcome back' : 'Join the museum'}
      </h2>

      <p>
        {mode === 'login'
          ? 'Log in to revisit your memories.'
          : 'Create an account to start collecting your moments.'}
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete={
            mode === 'login' ? 'current-password' : 'new-password'
          }
          minLength={8}
          required
        />

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? 'Please wait...'
            : mode === 'login'
              ? 'Log in'
              : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        {mode === 'login'
          ? "Don't have an account?"
          : 'Already have an account?'}
        {' '}
        <button type="button" onClick={switchMode}>
          {mode === 'login' ? 'Register' : 'Log in'}
        </button>
      </p>
    </section>
  )
}

export default AuthForm