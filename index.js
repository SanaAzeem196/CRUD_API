const express = require('express');
const app = express();
const PORT = 3000;

// A minimal "hello" route — just proves the server is alive
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// GET / — describes the API
app.get('/', (req, res) => {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks'],
  });
});

// GET /health — used to confirm the server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});