# AI
Seems that OpenAI API costs. \
Choice: Google Gemini 
https://aistudio.google.com/api-keys

## Install the Gemini SDK
Open your backend PowerShell terminal and make sure you're inside life-museum/server.
```
npm install @google/genai
```

## Add your Gemini API key
Open your existing server/.env file.
Add 
```
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```
Security reminder:
- Keep the key in server/.env.
- Never put it in client/.env or React code.
- Never commit it to GitHub.

Also check that server/.gitignore contains:
```
.env
node_modules/
```

## 3. Create the AI service
Let's keep AI code separate from our API routes.

Inside server/src, create a folder called services, then create:
```
server/src/services/ai.js
```
Add this code:
```

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

  const response = await ai.models.generateContent({
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
      maxOutputTokens: 400
    }
  })

  if (!response.text) {
    throw new Error('Gemini returned an empty response')
  }

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
```

Understand what this service does \
`generateExhibit(originalText)`
takes a memory as input and returns an object similar to:
```json
{
  "title": "An Afternoon Revisited",
  "subtitle": "A familiar face, a familiar feeling",
  "description": "A quiet afternoon spent reconnecting...",
  "tags": [
    "Friendship",
    "Memories",
    "Everyday Life"
  ]
}
```

## 4. Modify your POST endpoint
connecting Gemini to Prisma.

BEFORE POST endpoint expected the client to provide:
```
{
  "originalText": "...",
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "tags": []
}
```
We want the client to provide only the original memory. Gemini will generate everything else. \
What happens now?
1. Express receives the original memory.
2. It validates the input.
3. generateExhibit() sends the memory to Gemini.
4. Gemini returns the generated title, subtitle, description and tags.
5. Prisma saves everything to PostgreSQL.
6. Express returns the completed exhibit.
Change `exhibits.js`:

Original:
```js
// POST create a new exhibit
router.post('/', async (req, res) => {
  try {
    const {
      originalText,
      title,
      subtitle,
      description,
      tags
    } = req.body

    if (
      typeof originalText !== 'string' ||
      !originalText.trim() ||
      typeof title !== 'string' ||
      !title.trim() ||
      typeof description !== 'string' ||
      !description.trim()
    ) {
      return res.status(400).json({
        error: 'originalText, title and description are required'
      })
    }

    if (
      tags !== undefined &&
      (!Array.isArray(tags) ||
        !tags.every(tag => typeof tag === 'string'))
    ) {
      return res.status(400).json({
        error: 'Tags must be an array of strings'
      })
    }

    const newExhibit = await prisma.exhibit.create({
      data: {
        originalText: originalText.trim(),
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        description: description.trim(),
        tags: tags || []
      }
    })

    res.status(201).json(newExhibit)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Failed to create exhibit'
    })
  }
})
```

New:
```js

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
    const generated = await generateExhibit(originalText.trim())

    // Save the original memory and AI-generated content
    const newExhibit = await prisma.exhibit.create({
      data: {
        originalText: originalText.trim(),
        title: generated.title,
        subtitle: generated.subtitle,
        description: generated.description,
        tags: generated.tags
      }
    })

    res.status(201).json(newExhibit)

  } catch (error) {
    console.error('Error creating exhibit:', error)

    res.status(500).json({
      error: 'Failed to generate and save exhibit'
    })
  }
})

```

## 5. Update your REST Client tests

Original:
```http

### Check backend
GET http://localhost:3000/api/health


### Create an exhibit
POST http://localhost:3000/api/exhibits
Content-Type: application/json

{
  "originalText": "I had coffee with an old friend today. We talked for hours about our childhood memories.",
  "title": "An Afternoon Revisited",
  "subtitle": "A familiar face, a familiar feeling",
  "description": "A quiet afternoon spent reconnecting with an old friend. For a few hours, the years seemed to disappear, and old memories came back to life.",
  "tags": ["Friendship", "Memories", "Everyday Life"]
}


### Get all exhibits
GET http://localhost:3000/api/exhibits


### Get one exhibit
GET http://localhost:3000/api/exhibits/1

```

New:
```http

### Create an AI-generated exhibit
POST http://localhost:3000/api/exhibits
Content-Type: application/json

{
  "originalText": "I had coffee with an old friend today. We talked for hours about our childhood memories. It felt like no time had passed."
}


### Get all exhibits
GET http://localhost:3000/api/exhibits


### Get one exhibit
GET http://localhost:3000/api/exhibits/1


### Test invalid input
POST http://localhost:3000/api/exhibits
Content-Type: application/json

{
  "originalText": ""
}

```

Check in database
```bash
docker exec -it life-museum-db psql -U postgres -d life_museum
```
Check in database
```bash
SELECT * FROM "Exhibit";
```
