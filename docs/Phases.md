# Implementation Phases & Milestones Roadmap

## Phase Overview

```
Phase 1: Project Foundation & Environment Setup
   ↓
Phase 2: Database Modeling & Explicit Indexing
   ↓
Phase 3: Authentication, Security & Password Hashing
   ↓
Phase 4: RBAC & Notes REST API (with Pagination)
   ↓
Phase 5: Aggregation Pipelines (Scenario 1 & Scenario 2)
   ↓
Phase 6: Admin User Management API
   ↓
Phase 7: Frontend Development & API Integration
   ↓
Phase 8: Index Audit, Aggregation Validation & Final Documentation
```

---

## Phase 1: Project Foundation & Environment Setup
- [ ] Initialize `/server` project with Node.js, Express, and TypeScript (`tsconfig.json`, `package.json`).
- [ ] Initialize `/client` project with Vite, React, and TypeScript.
- [ ] Setup server configuration loader (`src/config/env.ts` with type validation).
- [ ] Configure MongoDB connection utility with Mongoose (`src/config/database.ts`).
- [ ] Establish global error handling framework (`AppError`, `asyncHandler`, `error-middleware.ts`).
- [ ] Setup standard API response utilities (`ApiResponse`, `PaginationHelper`).

---

## Phase 2: Database Modeling & Explicit Indexing Strategy
- [ ] **User Model (`src/models/user-model.ts`)**:
  - Fields: `name`, `email`, `password`, `role`, `interests`, timestamps.
  - Indexes: Explicit `schema.index({ email: 1 }, { unique: true })`, `schema.index({ createdAt: -1 })`, `schema.index({ interests: 1 })`.
- [ ] **Note Model (`src/models/note-model.ts`)**:
  - Fields: `title`, `content`, `user`, timestamps.
  - Indexes: Explicit `schema.index({ user: 1, createdAt: -1 })` (compound), `schema.index({ createdAt: -1 })`.
- [ ] **Post Model (`src/models/post-model.ts`)**:
  - Fields: `title`, `content`, `authorId`, timestamps.
  - Indexes: Explicit `schema.index({ authorId: 1, createdAt: -1 })`.
- [ ] Verify that **NO redundant indexes** are defined (e.g., no redundant single `{ user: 1 }`, no redeclared `_id`).

---

## Phase 3: Authentication, Security & Password Hashing
- [ ] Implement password hashing pre-save hook and `comparePassword` method with `bcryptjs`.
- [ ] Implement JWT token signing and verification service (`auth-service.ts`).
- [ ] Implement authentication controller (`register`, `login`, `getProfile`).
- [ ] Build JWT authentication middleware (`auth-middleware.ts`) to extract Bearer token and populate `req.user`.
- [ ] Build RBAC authorization middleware (`role-middleware.ts`) to enforce `admin` vs `user` permissions.
- [ ] Seed default Admin and User credentials for testing.

---

## Phase 4: RBAC & Notes REST API (with Pagination)
- [ ] Implement reusable pagination utility (`page`, `limit`, calculate `skip`, total count, total pages).
- [ ] **Create Note**: `POST /api/notes` (assigns note to `req.user.id`).
- [ ] **List Personal Notes**: `GET /api/notes` (filters by `{ user: req.user.id }`, sorted by `createdAt: -1`, paginated).
- [ ] **Admin Global Notes Listing**: `GET /api/notes?all=true` (allows admin to inspect all notes system-wide, paginated).
- [ ] **Get Specific Note**: `GET /api/notes/:id` (verifies note ownership unless admin).
- [ ] **Update Note**: `PUT /api/notes/:id` (verifies ownership unless admin).
- [ ] **Delete Note**: `DELETE /api/notes/:id` (verifies ownership unless admin).

---

## Phase 5: Aggregation Pipelines (Scenario 1 & Scenario 2)
- [ ] **Scenario 1: Group by Interests (`GET /api/aggregations/interests`)**:
  - Implement single `User.aggregate([...])` call.
  - Stages: `$match` -> `$unwind: "$interests"` -> `$project` -> `$group` by interest -> `$sort` -> `$project`.
  - Validate that exactly one `collection.aggregate()` call is made.
- [ ] **Scenario 2: User Posts with `$lookup` (`GET /api/users/:id/posts`)**:
  - Implement single aggregation pipeline joining `users` and `posts` collections with a `$lookup` stage.
  - Validate that posts belonging to the target user are retrieved with author information in a single pipeline.
- [ ] **Create Public Posts Endpoint (`POST /api/posts`)**:
  - Allow users to publish posts so the aggregation has rich data to join.

---

## Phase 6: Admin User Management API
- [ ] **List All Users**: `GET /api/users` (admin only, paginated, sorted by `createdAt: -1`).
- [ ] **Create User**: `POST /api/users` (admin directly creates user with role).
- [ ] **Get User Details**: `GET /api/users/:id` (admin only).
- [ ] **Update User**: `PUT /api/users/:id` (admin updates role or profile).
- [ ] **Delete User**: `DELETE /api/users/:id` (admin removes user).

---

## Phase 7: Frontend Development & API Integration
- [ ] Create Vanilla CSS design tokens (`variables.css`, `reset.css`, `global.css`) without templates.
- [ ] Implement `AuthContext` with login, registration, persistent JWT token, and logout.
- [ ] Build Authentication screens (`LoginPage`, `RegisterPage` with interests tag input).
- [ ] Build Note Dashboard (`NotesPage`) with note creation, editing, deletion, and pagination controls.
- [ ] Build Admin Panel (`AdminPage`) with user management table and global notes feed.
- [ ] Build Scenario 1 View (`InterestsPage`) showcasing users grouped by interests.
- [ ] Build Scenario 2 View (`PostsPage`) showcasing user posts aggregated via `$lookup`.
- [ ] Add interactive testing helpers (e.g., Quick Fill demo credentials, pipeline query explanation toggles).

---

## Phase 8: Index Audit, Aggregation Validation & Handover
- [ ] Audit MongoDB indexes using `db.collection.getIndexes()` or Mongoose sync.
- [ ] Verify query execution plans using `.explain("executionStats")` to prove index usage (COLLSCAN vs IXSCAN).
- [ ] Ensure all code strictly complies with the interview constraints and user guidelines.
- [ ] Synchronize documentation in `docs/` and create comprehensive root `README.md`.
