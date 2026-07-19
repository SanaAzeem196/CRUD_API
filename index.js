const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const app = express();
app.use(express.json());
const PORT = 3000;

// In-memory "database" — just a JS array, lives only in RAM.
// Resets every time the server restarts (that's expected for now).
let tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Walk the dog', done: false },
  { id: 3, title: 'Finish CRUD assignment', done: true },
];
let nextId = 4; // next free id to hand out (1, 2, 3 are already taken by seed data)

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

// GET /tasks — returns the whole list
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// GET /tasks/:id — returns one task by id
app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id); // path params arrive as strings, so convert
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});
// POST /tasks — creates a new task from the JSON body
app.post('/tasks', (req, res) => {
  const { title } = req.body || {};

  // Validation: the server never trusts the client.
  // Reject a missing title, a non-string title, or just whitespace.
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }

  const newTask = {
    id: nextId++,        // hand out the next free id, then increment
    title: title.trim(),
    done: false,          // new tasks always start unfinished
  };

  tasks.push(newTask);

  res.status(201).json(newTask); // 201 = "Created"
});

// PUT /tasks/:id — updates title and/or done
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body || {};
  const titleProvided = title !== undefined;
  const doneProvided = done !== undefined;

  // At least one field must be sent
  if (!titleProvided && !doneProvided) {
    return res.status(400).json({ error: 'request body must include title and/or done' });
  }
  // Whichever fields ARE sent must be the right type
  if (titleProvided && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (doneProvided && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be a boolean (true/false)' });
  }

  // Apply only the fields that were actually sent
  if (titleProvided) task.title = title.trim();
  if (doneProvided) task.done = done;

  res.json(task);
});

// DELETE /tasks/:id — removes the task
app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  tasks.splice(index, 1); // remove exactly one element at that position

  res.status(204).send(); // 204 = "No Content" — success, empty body
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});