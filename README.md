# Todo App

A full-stack todo app: React + Vite frontend, Express + PostgreSQL backend.

```
todo-app/
├── client/   # React (Vite) frontend
└── server/   # Express REST API backed by PostgreSQL
```

## Prerequisites

- Node.js 20+
- PostgreSQL

## Setup

### 1. Database and server

```bash
createdb todo_app
cd server
cp .env.example .env   # then set DATABASE_URL
npm install
npm run migrate        # creates/updates tables from db/migrations/
npm run dev            # http://localhost:5001
```

Schema changes live in `server/db/migrations/` as numbered `.sql` files.
`npm run migrate` applies any that have not run yet (tracked in the
`schema_migrations` table), each in its own transaction. Run it after
pulling changes that add a migration.

### 2. Client

```bash
cd client
cp .env.example .env   # VITE_API_URL should point at the server
npm install
npm run dev
```

## API

| Method | Endpoint                         | Description |
| ------ | -------------------------------- | ----------- |
| GET    | `/health`                        | Server + database status |
| GET    | `/api/groups`                    | List tabs |
| POST   | `/api/groups`                    | Create a tab `{ name }` |
| PUT    | `/api/groups/reorder`            | Save tab order `{ orderedIds }` (all tabs) |
| PUT    | `/api/groups/:id`                | Rename a tab `{ name }` |
| DELETE | `/api/groups/:id`                | Delete a tab and its todos (not the last tab) |
| GET    | `/api/todos?groupId=`            | List a tab's todos in saved order |
| POST   | `/api/todos`                     | Create a todo `{ groupId, title }` |
| PUT    | `/api/todos/:id`                 | Update `{ title?, completed? }` |
| DELETE | `/api/todos/:id`                 | Delete a todo |
| DELETE | `/api/todos/completed?groupId=`  | Delete a tab's completed todos |
| PUT    | `/api/todos/reorder`             | Save a tab's order `{ groupId, orderedIds }` |