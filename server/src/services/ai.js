
import { GoogleGenAI } from '@google/genai'

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
      items: {
        type: 'STRING'
      }
    }
  },
  required: ['title', 'subtitle', 'description', 'tags']
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
    contents: `Create a museum exhibit based on this personal memory:

"${originalText}"`,
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
      `,
      responseMimeType: 'application/json',
      responseSchema: exhibitSchema,
      temperature: 0.8,
      maxOutputTokens: 1000,
      thinkingConfig: {
        thinkingBudget: 0
        },
    }
  })
  console.log('Gemini response received!')
  console.log('Finish reason:', response.candidates?.[0]?.finishReason)
console.log('Usage:', response.usageMetadata)
  if (!response.text) {
    throw new Error('Gemini returned an empty response')
  }
  console.log('Raw Gemini response:')
console.log(response.text)
  const exhibit = JSON.parse(response.text)

  // Basic validation before saving the AI output
  if (
    typeof exhibit.title !== 'string' ||
    typeof exhibit.subtitle !== 'string' ||
    typeof exhibit.description !== 'string' ||
    !Array.isArray(exhibit.tags) ||
    !exhibit.tags.every(tag => typeof tag === 'string')
  ) {
    throw new Error('Gemini returned an invalid exhibit')
  }

  return exhibit
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

      console.log(`Gemini unavailable. Retrying (${attempt + 1}/2)...`)

      await new Promise(resolve =>
        setTimeout(resolve, 2000 * (attempt + 1))
      )
    }
  }
}
