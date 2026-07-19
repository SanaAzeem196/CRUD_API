const express = require('express');
const app = express();
const PORT = 3000;

// A minimal "hello" route — just proves the server is alive
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});