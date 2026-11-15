
import express from 'express'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'
import { generateExhibit } from '../services/ai.js'

const router = express.Router()
// All exhibition routes now require authentication
router.use(requireAuth)
// GET all exhibits
router.get('/', async (req, res) => {
  try {
    const exhibits = await prisma.exhibit.findMany({
      where: {
        userId: req.session.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(exhibits)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Failed to retrieve exhibits'
    })
  }
})

// GET one exhibit by ID
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'Invalid exhibit ID'
      })
    }

    const exhibit = await prisma.exhibit.findFirst({
      where: {
        id,
        userId: req.session.userId
      }
    })

    if (!exhibit) {
      return res.status(404).json({
        error: 'Exhibit not found'
      })
    }

    res.json(exhibit)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Failed to retrieve exhibit'
    })
  }
})

// DELETE one exhibit owned by the authenticated user
router.delete('/:id', async (req, res) => {
  const idText = req.params.id

  if (!/^[1-9]\d*$/.test(idText)) {
    return res.status(400).json({
      error: 'Invalid exhibit ID.'
    })
  }

  const exhibitId = Number(idText)
  if (!Number.isSafeInteger(exhibitId) || exhibitId > 2147483647) {
    return res.status(400).json({
      error: 'Invalid exhibit ID.'
    })
  }

  try {
    const result = await prisma.exhibit.deleteMany({
      where: {
        id: exhibitId,
        userId: req.session.userId
      }
    })

    if (result.count === 0) {
      return res.status(404).json({
        error: 'Exhibit not found.'
      })
    }

    return res.status(200).json({
      message: 'Exhibit deleted successfully.'
    })
  } catch (error) {
    console.error('Error deleting exhibit:', error)
    return res.status(500).json({
      error: 'Failed to delete exhibit.'
    })
  }
})
router.post('/', async (req, res) => {
  try {
    const { originalText } = req.body

    // Validate user input
    if (
      typeof originalText !== 'string' ||
      !originalText.trim()
    ) {
      return res.status(400).json({
        error: 'A memory is required'
      })
    }

    if (originalText.length > 2000) {
      return res.status(400).json({
        error: 'Memory must be 2000 characters or fewer'
      })
    }

    // Ask Gemini to generate the exhibit
    const generatedExhibit = await generateExhibit(originalText.trim())

    // Persist only fields normalized by the server. AI output is never spread
    // wholesale into Prisma data or interpreted as CSS.
    const newExhibit = await prisma.exhibit.create({
      data: {
        originalText,
        title: generatedExhibit.title,
        subtitle: generatedExhibit.subtitle,
        description: generatedExhibit.description,
        tags: generatedExhibit.tags,
        mood: generatedExhibit.mood || null,
        styleConfig: generatedExhibit.styleConfig,
        userId: req.session.userId
      }
    })

    res.status(201).json(newExhibit)

  } catch (error) {
  console.error('Error creating exhibit:', error)

  if (error.status === 429 || error.status === 503) {
    return res.status(503).json({
      error: 'AI service is temporarily unavailable. Please try again later.'
    })
  }

  if (error.status === 404) {
    return res.status(502).json({
      error: 'AI model not found. Check the model configuration.'
    })
  }

  res.status(500).json({
    error: 'Failed to generate and save exhibit'
  })
}
})

export default router
