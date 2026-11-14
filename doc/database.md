# Database
## Create a Docker Compose file
Inside server, create a file named: `docker-compose.yml`

Add this configuration:
```yml

services:
  db:
    image: postgres:16-alpine
    container_name: life-museum-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: local_dev_password
      POSTGRES_DB: life_museum
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Configuration	Meaning
image	: Downloads the PostgreSQL image if needed. \
container_name	: Names our database container. \
POSTGRES_USER	: Database username. \
POSTGRES_PASSWORD	: Database password. \
POSTGRES_DB	: Creates a database called life_museum. \
5433:5432	: Maps your computer's port 5433 to PostgreSQL's port 5432. \
volumes	: Keeps database data even if the container stops. 

Why port 5433? PostgreSQL commonly uses 5432. Using 5433 on your computer helps avoid conflicts with another PostgreSQL instance you might already have running.

## Start the database
Docker Desktop needs to be open
```
docker compose up -d
```
And check if running 
```
docker ps
```
## Test the database connection
This gets in postgres
```
docker exec -it life-museum-db psql -U postgres -d life_museum
```
Then you can show table with `\dt`

Exit with `\q`

## Install Prisma
This installs the Prisma CLI as a development dependency. We use it for commands such as creating database migrations.
```
npm install -D prisma@6.19.3
```
Then
This installs Prisma Client, which our Express backend will use to communicate with PostgreSQL.
```
npm install @prisma/client@6.19.3
```
### Initialize Prisma
```
npx prisma init --datasource-provider postgresql
```
This creates folder:
- schema.prisma: describes the structure of our database.
- .env: stores our database connection string.
- prisma/: contains the schema and eventually our migration history.

### Connect Prisma to PostgreSQL
Open the .env file inside server. \
Replace its contents with:
```
Credential check .env, we changed DATABASE_URL=
```
Also, don't upload .env to GitHub. It contains credentials.

### Define our database model
Open: server/prisma/schema.prisma \
Replace its contents with: \
```prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Exhibit {
  id           Int      @id @default(autoincrement())
  originalText String   @db.Text
  title        String
  subtitle     String?
  description  String   @db.Text
  tags         String[] @default([])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

An Exhibit represents one memory in your Life Museum.
Field	Meaning
id	Unique identifier for each exhibit
originalText	The memory originally submitted by the user
title	AI-generated exhibit title
subtitle	Optional subtitle
description	AI-generated museum description
tags	Categories associated with the memory
createdAt	When the exhibit was created
updatedAt	When the exhibit was last modified

A few Prisma concepts:
- Int: integer.
- String: text.
- String?: optional string (can be null).
- String[]: an array of strings.
- @id: primary key.
- @default(autoincrement()): automatically generates the ID.
- @default(now()): automatically sets the creation time.
- @updatedAt: automatically updates the timestamp when the record changes.

EX:
```json
{
  "id": 1,
  "originalText": "I had coffee with an old friend today.",
  "title": "An Afternoon Revisited",
  "subtitle": "A familiar face, a familiar feeling",
  "description": "A quiet afternoon spent reconnecting...",
  "tags": ["Friendship", "Everyday Life"]
}
```

### Create the database tables
Now we have described our database structure, but PostgreSQL doesn't know about it yet.

We need to create a migration. Run \
This formats and validates your Prisma schema.
```
npx prisma format
```
Then run:
```
npx prisma migrate dev --name init
```
- Prisma reads your schema.prisma.
- It connects to PostgreSQL using DATABASE_URL.
- It generates SQL instructions to create the Exhibit table.
- It executes those instructions.
- It records the migration in the _prisma_migrations table.

### Verify your database
Check whether the table was actually created.
```
docker exec -it life-museum-db psql -U postgres -d life_museum
```
Same `\dt` \
Specific table `\d "Exhibit"`

### Connect Express to Prisma and create your first API
HTTP request	| Endpoint	| Purpose
| -------- | -------- | -------- |
GET	| /api/exhibits	| Retrieve all exhibits
GET	| /api/exhibits/1	| Retrieve one exhibit
POST | /api/exhibits | Create a new exhibit

#### Install dotenv
Your backend needs to read the database connection string from .env.
In your server terminal, run:
```
npm install dotenv
```
Then open src/server.js and add this at the very top:
This loads environment variables from your .env file when the server starts.
```
import 'dotenv/config'
```

#### Create a Prisma client
We don't want to create a new database connection every time someone makes an API request.

Instead, we'll create one reusable Prisma Client instance.

Inside server/src, create a folder named lib, then create:
```
server/src/lib/prisma.js
```
Add:
Whenever another file needs to communicate with PostgreSQL, it can import this same Prisma instance.
```
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
```

#### Create the exhibits API routes
Inside server/src, create a folder called routes.
Create this file:
```
server/src/routes/exhibits.js
```

| Prisma method	| What it does |
| -------- | -------- |
| prisma.exhibit.findMany()	| Gets multiple records |
| prisma.exhibit.findUnique()	| Gets one record using a unique field |
| prisma.exhibit.create()	| Inserts a new record |

Notice that we use await because database operations are asynchronous. We don't know exactly how long the database will take to respond.

Also, req.body contains the JSON data sent by the client. That's why we added express.json() earlier.

#### Connect the routes to Express
Now open server/src/server.js.
```js
// Exhibit routes
app.use('/api/exhibits', exhibitsRouter)
```
It tells Express that every route defined inside exhibitsRouter starts with /api/exhibits.

For example:
- router.get('/') becomes GET /api/exhibits.
- router.get('/:id') becomes GET /api/exhibits/:id.
- router.post('/') becomes POST /api/exhibits.

#### Check Database with this
Again:
```
docker exec -it life-museum-db psql -U postgres -d life_museum
```
Do
```
SELECT * FROM "Exhibit";
```