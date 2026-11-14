So change the src to have that frontend is connect to backend
```jsx
const response = await fetch('/api/exhibits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ originalText })
})
```