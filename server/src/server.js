
import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pg from 'pg'

import exhibitsRouter from './routes/exhibits.js'
import authRouter from './routes/auth.js'

const app = express()
const PORT = 3000

// PostgreSQL connection pool
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// PostgreSQL session store
const PgSession = connectPgSimple(session)

const sessionStore = new PgSession({
  pool,
  tableName: 'user_sessions',
  createTableIfMissing: true
})

// Middleware
app.use(express.json())

app.use(session({
  store: sessionStore,
  name: 'life_museum.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Life Museum backend is running!'
  })
})

// API routes
app.use('/api/auth', authRouter)
app.use('/api/exhibits', exhibitsRouter)

// Keep API middleware failures (for example, an unavailable session database)
// in JSON format so API clients don't try to parse Express's default HTML page.
app.use((error, req, res, next) => {
  console.error('Request middleware error:', error)

  if (res.headersSent) {
    return next(error)
  }

  if (req.path.startsWith('/api/')) {
    return res.status(503).json({
      error: 'The service is temporarily unavailable. Please try again shortly.'
    })
  }

  res.status(500).send('Internal server error.')
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
