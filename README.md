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

### 1. Database

Create a database, then create the `todos` table:

```bash
createdb todo_app
psql "postgresql://USER:PASSWORD@localhost:5432/todo_app" -f server/db/schema.sql
```

### 2. Server

```bash
cd server
cp .env.example .env   # then set DATABASE_URL
npm install
npm run dev            # http://localhost:5001
```

### 3. Client

```bash
cd client
cp .env.example .env   # VITE_API_URL should point at the server
npm install
npm run dev
```

## API

| Method | Endpoint               | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/health`              | Server + database status  |
| GET    | `/api/todos`           | List todos (newest first) |
| POST   | `/api/todos`           | Create a todo `{ title }` |
| PUT    | `/api/todos/:id`       | Update `{ title?, completed? }` |
| DELETE | `/api/todos/:id`       | Delete a todo             |
| DELETE | `/api/todos/completed` | Delete all completed todos |
