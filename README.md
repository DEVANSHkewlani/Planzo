# Planzo — Multi-user Project Manager

Planzo is a **multi-user project management web app** for teams. Users can sign up/login, create or join projects, manage tasks, track notifications, collaborate with real-time updates (WebSocket), and use tools like calendar and whiteboard.

## Features

- **Multi-user auth**: signup/login and session-based usage via API + JWT
- **Projects**: create projects, join by team code, role-based membership
- **Tasks**: create/manage tasks inside projects
- **Notifications**: unread count + notifications page
- **Calendar**: events scheduling
- **Whiteboard**: drawing/whiteboard tools
- **File uploads**: uploads served from `/uploads`
- **Realtime updates**: WebSocket server included

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (via `better-sqlite3`) stored locally as `planzo.db`
- **Realtime**: WebSocket (`ws`)
- **Frontend**: static HTML pages served from `./frontend` (Tailwind via CDN)

## Project Structure

- **`server.js`**: Express server + WebSocket server
- **`routes/`**: REST API routes (`/api/*`)
- **`db/`**: database initialization and schema
- **`frontend/`**: static UI pages (served directly)
- **`uploads/`**: uploaded files (served at `/uploads`)

## Requirements

- Node.js 18+ recommended
- npm 9+ recommended

## Local Setup

Install dependencies:

```bash
npm install
```

Run the server:

```bash
npm start
```

Open the app:

- **Website**: `http://localhost:3000`
- Common pages:
  - `http://localhost:3000/dashboard.html`
  - `http://localhost:3000/projects.html`

Health check:

- `http://localhost:3000/api/health`

## Environment Variables

You can configure these environment variables:

- **`PORT`**: server port (default `3000`)
- **`JWT_SECRET`**: JWT signing secret  
  - If not set, the app uses a default development secret (recommended to override in production).

Example:

```bash
export PORT=3000
export JWT_SECRET="replace_me_in_production"
npm start
```

## Deployment

This repo includes a **`Procfile`**:

- `web: node server.js`

Typical deploy flow:

- Set `JWT_SECRET` in your host’s environment variables
- Ensure persistent storage if you want to keep the SQLite database (`planzo.db`) across deploys

## Notes

- The server serves static frontend files from `./frontend`.
- Uploaded files are stored in `./uploads` and served from `/uploads`.

