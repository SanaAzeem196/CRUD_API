const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const Database = require('better-sqlite3');

// Opens tasks.db, creating the file if it doesn't exist yet.
const db = new Database('tasks.db');

// Creates the tasks table only if it doesn't already exist.
// id is the primary key — SQLite hands out these numbers for us.
// done is stored as 0/1 since SQLite has no real boolean type.
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

// Seed the 3 example tasks — but only if the table is currently empty.
// Without this "only if empty" check, every restart would add 3 more rows.
const row = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
if (row.count === 0) {
  // SQLite AUTOINCREMENT keeps its own counter even after rows are deleted.
  // Reset that counter when the table is empty so the demo tasks start again at 1.
  const sequenceTable = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sqlite_sequence'").get();
  if (sequenceTable) {
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'tasks'").run();
  }

  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insert.run('Buy milk', 0);
  insert.run('Walk the dog', 0);
  insert.run('Finish CRUD assignment', 1);
}
const app = express();
app.use(express.json());
app.use(express.static('public'));
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
// app.get('/', (req, res) => {
//   res.send('Hello, world!');
// });

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
// app.get('/tasks', (req, res) => {
//   res.json(tasks);
// });

// GET /tasks — returns the whole list, now read live from the database
app.get('/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks').all();
  res.json(rows);
});

// GET /tasks/:id — returns one task by id
// app.get('/tasks/:id', (req, res) => {
//   const id = Number(req.params.id); // path params arrive as strings, so convert
//   const task = tasks.find((t) => t.id === id);

//   if (!task) {
//     return res.status(404).json({ error: `Task ${id} not found` });
//   }

//   res.json(task);
// });

// GET /tasks/:id — returns one row by id, now read live from the database
app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

// POST /tasks — creates a new task from the JSON body
// app.post('/tasks', (req, res) => {
//   const { title } = req.body || {};

//   // Validation: the server never trusts the client.
//   // Reject a missing title, a non-string title, or just whitespace.
//   if (!title || typeof title !== 'string' || title.trim() === '') {
//     return res.status(400).json({ error: 'title is required and must be a non-empty string' });
//   }

//   const newTask = {
//     id: nextId++,        // hand out the next free id, then increment
//     title: title.trim(),
//     done: false,          // new tasks always start unfinished
//   };

//   tasks.push(newTask);

//   res.status(201).json(newTask); // 201 = "Created"
// });


// POST /tasks — inserts a new row into the database
app.post('/tasks', (req, res) => {
  const { title } = req.body || {};

  // Same validation as Assignment 1 — the server never trusts the client.
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }

  // Insert the new row. done starts at 0 (false). We don't set id —
  // SQLite's AUTOINCREMENT hands out the next free id for us.
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const result = insert.run(title.trim(), 0);

  // result.lastInsertRowid is the id SQLite just assigned to this row.
  // Fetch the row back so we return exactly what's now in the database.
  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(newTask); // 201 = "Created"
});

// PUT /tasks/:id — updates title and/or done
// app.put('/tasks/:id', (req, res) => {
//   const id = Number(req.params.id);
//   const task = tasks.find((t) => t.id === id);

//   if (!task) {
//     return res.status(404).json({ error: `Task ${id} not found` });
//   }

//   const { title, done } = req.body || {};
//   const titleProvided = title !== undefined;
//   const doneProvided = done !== undefined;

//   // At least one field must be sent
//   if (!titleProvided && !doneProvided) {
//     return res.status(400).json({ error: 'request body must include title and/or done' });
//   }
//   // Whichever fields ARE sent must be the right type
//   if (titleProvided && (typeof title !== 'string' || title.trim() === '')) {
//     return res.status(400).json({ error: 'title must be a non-empty string' });
//   }
//   if (doneProvided && typeof done !== 'boolean') {
//     return res.status(400).json({ error: 'done must be a boolean (true/false)' });
//   }

//   // Apply only the fields that were actually sent
//   if (titleProvided) task.title = title.trim();
//   if (doneProvided) task.done = done;

//   res.json(task);
// });

// PUT /tasks/:id — updates a row's title and/or done in the database
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, done } = req.body || {};
  const titleProvided = title !== undefined;
  const doneProvided = done !== undefined;

  if (!titleProvided && !doneProvided) {
    return res.status(400).json({ error: 'request body must include title and/or done' });
  }
  if (titleProvided && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (doneProvided && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be a boolean (true/false)' });
  }

  // Use the new value if one was sent, otherwise keep what's already stored.
  const newTitle = titleProvided ? title.trim() : task.title;
  const newDone = doneProvided ? (done ? 1 : 0) : task.done;

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /tasks/:id — removes the task
// app.delete('/tasks/:id', (req, res) => {
//   const id = Number(req.params.id);
//   const index = tasks.findIndex((t) => t.id === id);

//   if (index === -1) {
//     return res.status(404).json({ error: `Task ${id} not found` });
//   }

//   tasks.splice(index, 1); // remove exactly one element at that position

//   res.status(204).send(); // 204 = "No Content" — success, empty body
// });

// DELETE /tasks/:id — removes a row from the database
app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

  res.status(204).send(); // 204 = "No Content"
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});