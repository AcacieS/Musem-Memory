import express from 'express'
import bcrypt from 'bcrypt'
import prisma from '../lib/prisma.js'

const router = express.Router()

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Validate the input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Please provide a valid email address.'
      })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.'
      })
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // 3. Create the user in the database
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    // 4. Return the new user's information
    res.status(201).json({
      message: 'Account created successfully!',
      user
    })

  } catch (error) {
    console.error('Registration error:', error)

    // Prisma error P2002 = unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'An account with this email already exists.'
      })
    }

    res.status(500).json({
      error: 'Failed to create account.'
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Check whether the user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      })
    }

    // Create a fresh session after successful login
    await new Promise((resolve, reject) => {
      req.session.regenerate(err => {
        if (err) reject(err)
        else resolve()
      })
    })

    req.session.userId = user.id

    await new Promise((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err)
        else resolve()
      })
    })

    res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Failed to log in.'
    })
  }
})

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err)
      return res.status(500).json({
        error: 'Failed to log out.'
      })
    }

    res.clearCookie('life_museum.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })

    res.json({
      message: 'Logged out successfully!'
    })
  })
})

// Get the currently logged-in user
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'Not authenticated.'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(401).json({
        error: 'User no longer exists.'
      })
    }

    res.json({ user })

  } catch (error) {
    console.error('Session check error:', error)
    res.status(500).json({
      error: 'Failed to check authentication.'
    })
  }
})

export default router