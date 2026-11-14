
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

    // Save the original memory and AI-generated content
    // const newExhibit = await prisma.exhibit.create({
    //   data: {
    //     originalText: originalText.trim(),
    //     title: generated.title,
    //     subtitle: generated.subtitle,
    //     description: generated.description,
    //     tags: generated.tags
    //   }
    // })
    const newExhibit = await prisma.exhibit.create({
      data: {
        originalText,
        ...generatedExhibit,
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
