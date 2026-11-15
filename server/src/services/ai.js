import { GoogleGenAI } from '@google/genai'

const styleOptions = {
  palette: ['warm', 'calm', 'dreamy', 'bright', 'minimal'],
  font: ['serif', 'sans-serif', 'handwritten'],
  border: ['none', 'thin-solid', 'dashed'],
  decoration: ['none', 'stars', 'dots', 'botanical'],
  layout: ['minimal', 'editorial', 'scrapbook', 'poster']
}

const defaultStyleConfig = {
  palette: 'warm',
  font: 'serif',
  border: 'thin-solid',
  decoration: 'none',
  layout: 'minimal'
}

const exhibitSchema = {
  type: 'OBJECT',
  properties: {
    title: {
      type: 'STRING',
      description: 'A short, creative museum exhibit title.'
    },
    subtitle: {
      type: 'STRING',
      description: 'A short, thoughtful subtitle.'
    },
    description: {
      type: 'STRING',
      description: 'A 40-70 word museum-style description.'
    },
    tags: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    mood: {
      type: 'STRING',
      description: 'A concise word or phrase for the memory’s overall mood.'
    },
    themes: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Two to four short themes present in the memory.'
    },
    styleConfig: {
      type: 'OBJECT',
      properties: {
        palette: { type: 'STRING', enum: styleOptions.palette },
        font: { type: 'STRING', enum: styleOptions.font },
        border: { type: 'STRING', enum: styleOptions.border },
        decoration: { type: 'STRING', enum: styleOptions.decoration },
        layout: { type: 'STRING', enum: styleOptions.layout }
      },
      required: ['palette', 'font', 'border', 'decoration', 'layout']
    }
  },
  required: ['title', 'subtitle', 'description', 'tags', 'mood', 'themes', 'styleConfig']
}

export async function generateExhibit(originalText) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from .env')
  }

  const ai = new GoogleGenAI({ apiKey })
  console.log('Sending request to Gemini...')
  const response = await generateWithRetry(ai, {
    model: 'gemini-3.8-flash',
    contents: `Create a museum exhibit based on this personal memory:\n\n"${originalText}"`,
    config: {
      systemInstruction: `
        You are the curator of a personal museum.

        Your job is to transform ordinary personal memories
        into thoughtful museum exhibits.

        Guidelines:
        - Preserve the meaning and details of the memory.
        - Never invent events, people, feelings, or facts.
        - Give the exhibit a creative and memorable title.
        - Write a thoughtful description of 40-70 words.
        - Use a warm, slightly poetic tone.
        - Not every memory needs to sound inspirational.
        - Generate 2-4 relevant tags.
        - Identify the memory's mood and 2-4 themes grounded in its details.
        - Choose styleConfig identifiers only from the options in the response schema.
        - Choose a restrained design that reflects the memory while keeping all text readable.
        - Do not return CSS, HTML, URLs, or styling code.
      `,
      responseMimeType: 'application/json',
      responseSchema: exhibitSchema,
      temperature: 0.8,
      maxOutputTokens: 1000,
      thinkingConfig: { thinkingBudget: 0 }
    }
  })

  console.log('Gemini response received!')
  if (!response.text) {
    throw new Error('Gemini returned an empty response')
  }

  let exhibit
  try {
    exhibit = JSON.parse(response.text)
  } catch {
    throw new Error('Gemini returned malformed exhibit JSON')
  }

  if (
    !exhibit ||
    typeof exhibit.title !== 'string' ||
    !exhibit.title.trim() ||
    typeof exhibit.subtitle !== 'string' ||
    typeof exhibit.description !== 'string' ||
    !exhibit.description.trim() ||
    !Array.isArray(exhibit.tags) ||
    !exhibit.tags.every(tag => typeof tag === 'string')
  ) {
    throw new Error('Gemini returned an invalid exhibit')
  }

  return {
    title: exhibit.title.trim(),
    subtitle: exhibit.subtitle.trim(),
    description: exhibit.description.trim(),
    tags: normalizeStringList(exhibit.tags, 4),
    mood: typeof exhibit.mood === 'string' ? exhibit.mood.trim().slice(0, 60) : '',
    themes: normalizeStringList(exhibit.themes, 4),
    styleConfig: normalizeStyleConfig(exhibit.styleConfig)
  }
}

function normalizeStringList(value, limit) {
  if (!Array.isArray(value)) return []
  return value
    .filter(item => typeof item === 'string')
    .map(item => item.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, limit)
}

function normalizeStyleConfig(value) {
  const config = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return Object.fromEntries(
    Object.entries(defaultStyleConfig).map(([key, fallback]) => [
      key,
      typeof config[key] === 'string' && styleOptions[key].includes(config[key])
        ? config[key]
        : fallback
    ])
  )
}

async function generateWithRetry(ai, request, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(request)
    } catch (error) {
      if (
        (error.status !== 503 && error.status !== 429) ||
        attempt === retries
      ) {
        throw error
      }

      console.log(`Gemini unavailable. Retrying (${attempt + 1}/${retries})...`)
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
    }
  }
}
