# Backend Server Developer Guide (`server/DEVELOPER.md`)

Welcome to the Secure Note-Taking Application Backend codebase. This document is written for engineers onboarding onto the project to get up to speed quickly.

---

## 1. Quickstart & Local Setup

### Prerequisites
- Node.js v20+ & npm
- A running MongoDB instance or MongoDB Atlas connection URI

### Installation & Run Steps
```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and ensure MONGODB_URI and JWT_SECRET are set

# 4. Populate test data (Admin & Users)
npm run seed

# 5. Start development server with live reload
npm run dev

# 6. Verify MongoDB indexes and explain plans
npm run audit
```
The server will start at `http://localhost:5000`. Test the health check endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## 2. Default Seed Credentials
Running `npm run seed` creates:
- **System Administrator:** `admin@example.com` / `admin123` (Role: `admin`)
- **Regular User (Alice):** `alice@example.com` / `user123` (Role: `user`, Interests: chess, reading, coding)
- **Regular User (Bob):** `bob@example.com` / `user123` (Role: `user`, Interests: chess, hiking)

---

## 3. Database Indexing & Audit
This project strictly follows the **Zero-Redundant Index Rule**:
- **Email uniqueness:** `{ email: 1 }` (unique)
- **User notes listing:** `{ user: 1, createdAt: -1 }` (compound equality + sort)
- **Admin global listing:** `{ createdAt: -1 }`
- **Interests aggregation:** `{ interests: 1 }` (multikey)
- **Posts lookup aggregation:** `{ authorId: 1, createdAt: -1 }`

Verify compliance at any time:
```bash
npm run audit
```
This script runs `.explain('executionStats')` on note listing queries to ensure `IXSCAN` index usage and zero in-memory sort operations.

---

## 4. API Specification Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create user account (body: name, email, password, interests)
- `POST /api/auth/login` - Authenticate & obtain JWT (body: email, password)
- `GET /api/auth/me` - Retrieve current authenticated user profile [Bearer token]

### Notes (`/api/notes`)
- `GET /api/notes?page=1&limit=10` - List current user's notes (paginated)
- `GET /api/notes?all=true` - Admin-only system-wide notes listing
- `POST /api/notes` - Create note (body: title, content)
- `GET /api/notes/:id` - Get single note (checks ownership or admin role)
- `PUT /api/notes/:id` - Update note (checks ownership or admin role)
- `DELETE /api/notes/:id` - Delete note (checks ownership or admin role)

### User Management (`/api/users` - Admin Only)
- `GET /api/users?page=1&limit=10` - List users (paginated)
- `POST /api/users` - Admin provision new user
- `GET /api/users/:id` - Read single user
- `PUT /api/users/:id` - Update user details & role
- `DELETE /api/users/:id` - Delete user (cascades to all notes and posts)

### Aggregations (`/api/aggregations`)
- `GET /api/aggregations/interests` - Scenario 1: Group users by interests (1 aggregate call)
- `GET /api/aggregations/users/:userId/posts` - Scenario 2: Retrieve posts belonging to a user ($lookup)

---

## 5. Deployment Notes (Vercel Serverless)
- Entry point for Vercel is `src/app.ts` configured via `vercel.json` with `@vercel/node`.
- Database connections in `src/config/database.ts` reuse existing connections via `mongoose.connection.readyState >= 1` to prevent connection leaks across serverless function invocations.
- Ensure `MONGODB_URI` and `JWT_SECRET` are added in the Vercel Dashboard project settings.
