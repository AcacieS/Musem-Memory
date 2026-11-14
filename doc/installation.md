# Create Frontend: \
`npm create vite@latest client -- --template `

`cd client`

`npm install`

Run website:
`npm run dev`

# Create Backend
1. Create a file server and cd in
2. This creates package.json, which describes your backend project and its dependencies.
```
npm init -y
```
3. Install Express:
```
npm install express
```
4. Configure Node.js to use modern imports
We'll use ES modules, so our backend can write import express from 'express'.
```
npm pkg set type="module" scripts.dev="node --watch src/server.js"
```
This updates your package.json with:
- "type": "module" — enables import and export syntax.
- "dev": "node --watch src/server.js" — starts your server and automatically restarts it when you save changes.
Node.js v24 supports --watch, so you don't need to install nodemon separately.

5. Create a src folder inside server, then create server.js inside it.
`mkdir src`
6. s
Code	Meaning
express()	Creates your Express application.
express.json()	Allows your server to parse JSON sent by the frontend.
app.get(...)	Defines what happens when someone sends a GET request to this URL.
res.json(...)	Sends a JSON response back to the requester.
app.listen(...)	Starts the server on port 3000.

An endpoint is a URL your frontend or another client can request to interact with your backend. Our first endpoint is /api/health.

7. Start Backend: in server
`npm run dev`

8. Run
http://localhost:3000/api/health