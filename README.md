# Task API

A to-do list API built with Node.js and Express — full CRUD (Create, Read, Update, Delete) on tasks, with interactive documentation via Swagger UI.

This repo covers two stages of the same project:

| Version | Assignment | Storage | Status |
|---|---|---|---|
| **v1** | Week 2 · A1 — Build your first CRUD API | In-memory (JS array) | superseded |
| **v2** | Week 3 · A2 — Connecting your CRUD to the database | SQLite (`tasks.db`) | **current** |

Each task looks like this:

```json
{ "id": 1, "title": "Buy milk", "done": false }
```

---

## Tech stack

| Tool | Purpose |
|---|---|
| [Node.js](https://nodejs.org) | JavaScript runtime |
| [Express](https://expressjs.com) | Web framework — routing, JSON parsing |
| [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) | Serves interactive API docs at `/docs` |
| [better-sqlite3](https://www.npmjs.com/package/better-sqlite3) | SQLite driver — added in v2 for persistent storage |

---

## Getting started

### Prerequisites
- Node.js 18+ installed (check with `node -v`)

### Install & run

```bash
git clone https://github.com/<your-username>/crud.git
cd crud
npm install
npm start
```

You should see:

```
Task API running at http://localhost:3000
```

Then open:
- **http://localhost:3000/** — API info
- **http://localhost:3000/docs** — interactive Swagger UI (try every endpoint without a terminal)
- **http://localhost:3000/** *(served from `public/index.html`)* — a small front-end console for the API

On first run, `npm start` also creates `tasks.db` automatically and seeds it with 3 example tasks — no manual database setup needed.

---

## Project structure

```
crud/
├── index.js           # server + all routes (now backed by SQLite in v2)
├── tasks.db            # SQLite database file — created automatically, git-ignored
├── openapi.json        # API spec that powers Swagger UI
├── public/
│   └── index.html       # small front-end console served at /
├── package.json        # dependencies & scripts
├── package-lock.json   # exact dependency versions
├── .gitignore          # excludes node_modules and tasks.db
└── README.md           # this file
```

---

## API reference

Identical in both v1 and v2 — this is the whole point of the v2 migration: same endpoints, same request/response shapes, only the storage underneath changed.

| Method | Endpoint       | Description                          | Success | Errors |
|--------|----------------|---------------------------------------|---------|--------|
| GET    | `/`            | API name, version, and endpoint list  | `200`   | —      |
| GET    | `/health`      | Liveness check                        | `200`   | —      |
| GET    | `/tasks`       | List all tasks                        | `200`   | —      |
| GET    | `/tasks/:id`   | Get a single task by id                | `200`   | `404` if not found |
| POST   | `/tasks`       | Create a task — body: `{ "title": string }` | `201` | `400` if title missing/empty |
| PUT    | `/tasks/:id`   | Update `title` and/or `done`           | `200`   | `400` invalid body · `404` not found |
| DELETE | `/tasks/:id`   | Delete a task                          | `204`   | `404` if not found |

**Status codes used:** `200` OK · `201` Created · `204` No Content · `400` Bad Request · `404` Not Found.

---

## Trying it out

### Option A — Swagger UI (easiest)
Go to `http://localhost:3000/docs`, expand any endpoint, click **Try it out**, fill in the fields, and hit **Execute**.

### Option B — terminal (PowerShell)

```powershell
# Get the full list
curl.exe -i http://localhost:3000/tasks

# Get one task
curl.exe -i http://localhost:3000/tasks/1

# Create a task
Invoke-RestMethod -Uri http://localhost:3000/tasks -Method Post -ContentType "application/json" -Body '{"title":"Buy milk"}'

# Update a task
Invoke-RestMethod -Uri http://localhost:3000/tasks/1 -Method Put -ContentType "application/json" -Body '{"done":true}'

# Delete a task
curl.exe -i -X DELETE http://localhost:3000/tasks/1
```

### Example: real request/response

```
GET http://localhost:3000/tasks/4

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": 4,
  "title": "complete assignment",
  "done": false
}
```

### Swagger UI

![Swagger UI — GET /tasks/4](images/image.png)

---

# v1 — In-memory CRUD (Week 2 · Assignment A1)

The original version of this project. Tasks are stored **in memory only** (a plain JavaScript array) — there is no database, so all data resets whenever the server restarts.

### The "mortality experiment"

Create a task, restart the server, then `GET /tasks` again — the new task is gone; only the 3 seed tasks remain.

This happens because `tasks` was just a variable in memory — nothing was written to disk. Fixing this is exactly what v2's SQLite database (below) is for.

### Development notes (v1 stages)

| Stage | What was added |
|-------|-----------------|
| 0 | Bare Express server, no routes |
| 1 | `GET /` and `GET /health` |
| 2 | In-memory task list + `GET /tasks`, `GET /tasks/:id` (with 404s) |
| 3 | `POST /tasks` with validation |
| 4 | `PUT /tasks/:id` and `DELETE /tasks/:id` — full CRUD complete |
| 5 | `openapi.json` + Swagger UI at `/docs` |
| 6 | README + public GitHub repo |

---

# v2 — SQLite-backed CRUD (Week 3 · Assignment A2)

Same API, same endpoints, same request/response shapes — but storage moved from an in-memory array to a real SQLite database, so data now survives a server restart.

### Why SQLite

SQLite is a lightweight, serverless SQL database stored as a single file. It requires no separate database server or additional setup — just the database file on disk — which makes it ideal for small projects, local development, and demos. Compared with the v1 in-memory approach, SQLite persists data across server restarts, so tasks survive shutdowns and crashes instead of vanishing when the process exits.

### Where the database lives

This project stores its data in a SQLite file named `tasks.db`. The file is created automatically the first time the server initializes the database. `tasks.db` is git-ignored, so every fresh clone of the repository starts with an empty database — the app then recreates the table and seeds it with 3 example tasks on that first run.

### Development notes (v2 stages)

| Stage | What was added |
|-------|-----------------|
| 0 | `tasks.db` created automatically; `tasks` table created if missing; 3 tasks seeded only when empty |
| 1 | `GET /tasks` and `GET /tasks/:id` now run real SQL queries against SQLite |
| 2 | `POST /tasks` now runs `INSERT INTO tasks` — data survives a restart for the first time |
| 3 | `PUT /tasks/:id` and `DELETE /tasks/:id` now run `UPDATE` / `DELETE` SQL statements |
| 4 | Explored the database directly in DB Browser for SQLite, running queries by hand |
| 5 | README updated with why-SQLite, DB Browser screenshots, and this documentation |

### Running the queries for `tasks.db` in DB Browser for SQLite

This walks through Stage 4: opening the live database file and running SQL by hand, then confirming the API reflects each change instantly — no restart, no syncing, one source of truth.

**1. `SELECT * FROM tasks;`** — the starting state: 5 tasks in the table.

![alt text](images/image-1.png)

**2. `SELECT * FROM tasks WHERE done = 1;`** — filtered to only the completed task.

![alt text](images/image-2.png)

**3. `SELECT COUNT(*) FROM tasks;`** — a quick count: 5 rows.

![alt text](images/image-3.png)

**4. `UPDATE tasks SET done = 1;`** — marks every task done (no `WHERE` clause, on purpose, to see the effect) — 5 rows affected.

![alt text](images/image-4.png)

**5. `DELETE FROM tasks WHERE done = 1;`** — since everything was just marked done, this deletes every row — 5 rows affected.

![alt text](images/image-5.png)

**6. `SELECT * FROM tasks;`** — confirms the table is now empty: 0 rows returned.

![alt text](images/image-6.png)

**7. Calling `GET /tasks` from the running API (via Swagger UI), with no server restart** — the response comes back `[]`, matching the empty table exactly. This is the actual checkpoint: the API and DB Browser are reading the same file, live.

![alt text](images/image-7.png)

---

# v3 — Postgres-backed CRUD (Week 3 · Assignment A3)



A small Express.js task-management API backed by PostgreSQL. The project includes a browser-based task console and interactive OpenAPI documentation.

### Features

- Create, read, update, and delete tasks
- PostgreSQL persistence through the `pg` connection pool
- Automatic table creation on startup
- Idempotent seed data: the three example tasks are inserted only when the table is empty
- JSON request and response bodies
- Health-check endpoint
- Swagger UI at `/docs`
- Static browser console served from `public/`

### Requirements

- Node.js 18 or newer
- npm
- PostgreSQL 16 or Docker Desktop

### Quick Start With PostgreSQL

1. Install the dependencies:

   ```powershell
   npm install
   npm install pg dotenv
   ```

2. Create a `.env` file in the project root:

   ```env
   DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks
   ```

3. Start PostgreSQL. For a local Docker database:

   ```powershell
   docker run --name taskdb `
     -e POSTGRES_PASSWORD=dev `
     -e POSTGRES_DB=tasks `
     -p 5432:5432 `
     -v taskdata:/var/lib/postgresql/data `
     -d postgres:16
   ```

   If the container already exists but is stopped, start it with:

   ```powershell
   docker start taskdb
   ```

4. Start the API:

   ```powershell
   npm start
   ```

   The server listens at [http://localhost:3000](http://localhost:3000). On its first successful startup, it creates the `tasks` table and inserts three example tasks.

### Docker Compose

The intended Compose configuration runs the API and PostgreSQL together. Set these values in `.env` when the API runs inside Compose:

This checkout currently includes `.dockerignore` but does not include `Dockerfile` or `compose.yaml`. Add those files using the Compose configuration from the project setup notes before running the commands below.

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dev
POSTGRES_DB=tasks
DATABASE_URL=postgres://postgres:dev@db:5432/tasks
```

Then start the stack:

```powershell
docker compose up --build
```

Stop the stack with:

```powershell
docker compose down
```

The `DATABASE_URL` hostname must be `db` inside Compose and `localhost` when running the Node.js process directly on the host. A named `taskdata` volume preserves PostgreSQL data across container restarts.

### API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Returns basic API information |
| `GET` | `/health` | Returns `{ "status": "ok" }` |
| `GET` | `/tasks` | Lists all tasks |
| `GET` | `/tasks/:id` | Returns one task |
| `POST` | `/tasks` | Creates a task |
| `PUT` | `/tasks/:id` | Updates a task title and/or completion state |
| `DELETE` | `/tasks/:id` | Deletes a task |
| `GET` | `/docs` | Opens the Swagger UI |

Each task has this shape:

```json
{
  "id": 1,
  "title": "Buy milk",
  "done": false
}
```

### Create a task

```powershell
curl.exe -i -X POST http://localhost:3000/tasks `
  -H "Content-Type: application/json" `
  -d '{"title":"Read the project README"}'
```

`title` is required and must be a non-empty string. A successful request returns `201 Created`.

### Update a task

```powershell
curl.exe -i -X PUT http://localhost:3000/tasks/1 `
  -H "Content-Type: application/json" `
  -d '{"done":true}'
```

The request body must include `title`, `done`, or both. `title` must be a non-empty string and `done` must be a boolean.

#### Read and delete tasks

```powershell
curl.exe -i http://localhost:3000/tasks
curl.exe -i http://localhost:3000/tasks/1
curl.exe -i -X DELETE http://localhost:3000/tasks/1
```

Missing task IDs return `404 Not Found`. A successful delete returns `204 No Content`.

### Database Initialization

At startup, the API runs the following logical steps:

1. Creates `tasks` if it does not already exist.
2. Counts the existing rows.
3. Inserts the three example tasks only when the count is zero.
4. Starts listening after database initialization succeeds.

This means restarting the API does not duplicate the seed data. The PostgreSQL schema is:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false
);
```

### Browser Console

Open [http://localhost:3000](http://localhost:3000) in a browser while the API is running. The console can list, create, complete, update, and delete tasks through the API.

### Project Structure

```text
.
├── index.js        # Express server and database initialization
├── openapi.json    # OpenAPI definition used by Swagger UI
├── package.json    # npm metadata and start script
├── public/
│   └── index.html  # Browser task console
├── .env            # Local secrets and database connection settings
└── .gitignore      # Ignored local files and generated database files
```

### Development Notes

- Do not commit `.env`; use environment variables for database credentials.
- Do not use the old SQLite `tasks.db` workflow. The current API reads and writes PostgreSQL rows.
- The OpenAPI specification is served at `/docs` by `swagger-ui-express`.
- For a clean install, ensure `pg` and `dotenv` are installed; the current manifest still contains the earlier `better-sqlite3` dependency.


# v4 — Auth · Login & protect (Week 4 · Assignment A4)

Same task API as before, plus real user accounts. Requests can now prove who's making them, and certain routes refuse to answer unless that proof checks out.

### What changed

Every earlier version of this project was wide open — anyone who knew the URL could read or write any task. This version adds an authentication layer on top: users sign up and log in through **Supabase Auth**, which hands back a signed **JSON Web Token (JWT)**. That token has to be presented on protected routes, or the server refuses the request with `401`.

The task endpoints (`/tasks`, `/tasks/:id`) are **unchanged and still public** — this assignment is about adding auth as a new layer, not locking down existing routes. The new protected routes are `/protected/profile`, `/protected/dashboard`, and `/auth/logout`.

### Why Supabase

Rolling your own authentication means hashing passwords, signing tokens, and handling all the ways that can go wrong — a real risk if done incorrectly. Supabase is an external **Identity Provider**: it stores accounts, hashes passwords, and signs tokens on its own infrastructure. This app never sees or stores a raw password — it only ever forwards credentials to Supabase and verifies the tokens Supabase hands back.

### The trust triangle

```
1. Client sends email + password  →  Supabase
2. Supabase verifies and returns a signed JWT  →  Client
3. Client sends that JWT on every protected request  →  This API
4. This API asks Supabase "is this token real?"  →  Supabase confirms
```

The server never trusts a token by just reading it — every check on a protected route makes a real network call to Supabase to confirm the signature is genuine and the token hasn't expired.

### Where the secrets live

Two new values in `.env` (git-ignored, never committed):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

`SUPABASE_KEY` here is the **anon / public key** — safe to use from the app. The `service_role` key (also visible in the Supabase dashboard) is never used anywhere in this project; it bypasses all security and must stay fully server-side, which this project doesn't need at all.

`.env.example` documents the same key names with placeholder values, so a stranger cloning this repo knows exactly what to set without ever seeing a real secret.

### Endpoint reference

| Method | Endpoint                | Description                          | Auth required | Success | Errors |
|--------|--------------------------|---------------------------------------|:---:|---------|--------|
| POST   | `/auth/signup`           | Create a new account                  | ❌  | `201`   | `400` missing email/password |
| POST   | `/auth/login`            | Log in, receive a JWT                 | ❌  | `200`   | `400` missing fields · `401` invalid credentials |
| POST   | `/auth/logout`           | End the current session               | ✅  | `204`   | `401` missing/invalid/expired token |
| GET    | `/public/info`           | Open, unauthenticated info            | ❌  | `200`   | — |
| GET    | `/protected/profile`     | Return the logged-in user's own data  | ✅  | `200`   | `401` missing/invalid/expired token |
| GET    | `/protected/dashboard`   | A second route reusing the same guard | ✅  | `200`   | `401` missing/invalid/expired token |
| GET    | `/tasks`, `/tasks/:id`, etc. | Existing CRUD — unchanged from v1–v3 | ❌  | — | — |

**Auth required** routes expect a header:
```
Authorization: Bearer <access_token>
```

### The auth guard

Every protected route shares one reusable piece of middleware (`requireAuth`) instead of repeating the same token check in each route by hand:

1. Reads the `Authorization` header and pulls out the token after `Bearer `.
2. If no token is present → `401` immediately, no network call needed.
3. If a token is present, calls `supabase.auth.getUser(token)` — a real request to Supabase's servers, which confirms the signature is genuine and the token hasn't expired or been tampered with.
4. On success, attaches the verified user to `req.user` and lets the route run. On failure → `401`.

Adding a new protected route is then just one extra argument — `app.get('/some/route', requireAuth, handler)` — with no new verification code required, which is exactly what `/protected/dashboard` demonstrates.

### Trying it out

**Swagger UI** (`http://localhost:3000/docs`) — protected routes show a padlock icon. Click **Authorize**, paste a raw access token (no `Bearer` prefix needed, Swagger adds it), then **Try it out** on any locked route.

**The console UI** (`http://localhost:3000/`) — now has an Account panel: sign up, log in, view your live profile (a real call to `/protected/profile`), and log out, all from the browser.

**Terminal / API client**, full flow:
```powershell
# 1. Sign up
POST http://localhost:3000/auth/signup
Body: { "email": "test@example.com", "password": "password123" }
→ 201

# 2. Log in
POST http://localhost:3000/auth/login
Body: { "email": "test@example.com", "password": "password123" }
→ 200, returns access_token and refresh_token

# 3. Call a protected route
GET http://localhost:3000/protected/profile
Header: Authorization: Bearer <paste access_token>
→ 200, returns id, email, created_at

# 4. Tamper with the token (change one character) and repeat step 3
→ 401 { "error": "Invalid or expired token" }
```

### Screenshots

![alt text](image.png)

![alt text](image-1.png)

![alt text](image-2.png)

<!-- Replace the filenames above with your actual screenshots, placed in the same folder as this README. -->

### Development notes (v4 stages)

| Stage | What was added |
|-------|-----------------|
| 0 | Supabase project created; `SUPABASE_URL`/`SUPABASE_KEY` added to `.env`; Supabase client initialized |
| 1 | `POST /auth/signup` and `POST /auth/login` — talk to Supabase, return `201` / `200` with tokens |
| 2 | `GET /public/info` (open) and `GET /protected/profile` (checks a token is *present*, not yet verified) |
| 3 | `/protected/profile` now actually verifies the token via `supabase.auth.getUser()` — a tampered token correctly returns `401` |
| 4 | Verification logic extracted into reusable `requireAuth` middleware; added `POST /auth/logout` and a second protected route (`/protected/dashboard`) reusing the same guard with no new code |
| 5 | `openapi.json` updated with a `bearerAuth` security scheme; Swagger UI now shows padlocks on protected routes and supports "Authorize" |
| 6 | README updated; project pushed with `.env` confirmed git-ignored and `.env.example` committed |

### A note on 401 vs 403

Every rejection in this version is a `401 Unauthorized` — meaning "I don't know who you are" (no token, bad token, expired token). This project doesn't yet distinguish `403 Forbidden` ("I know exactly who you are, and you still may not") — that would require role/permission logic on top of authentication, which is outside this assignment's scope but worth knowing as the next layer up.

## License

MIT — built for educational purposes.