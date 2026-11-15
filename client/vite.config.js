import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (error, _request, response) => {
            console.error('API proxy error:', error.message)

            if (response && !response.headersSent && !response.destroyed) {
              response.writeHead(502, { 'Content-Type': 'application/json' })
              response.end(JSON.stringify({
                error: 'Could not connect to the API server on port 3000.'
              }))
            }
          })
        }
      }
    }
  }
})
