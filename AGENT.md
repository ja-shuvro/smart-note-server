# Server AI Agent Context & System Blueprint (`server/AGENT.md`)

> **Instruction for AI Agents:** Read this document first. It contains the complete architectural, database, indexing, and security blueprint for the `server` workspace. Do not scan entire directory trees repeatedly.

---

## 1. System Overview & Tech Stack
- **Runtime:** Node.js (v20+) with TypeScript 5.7 (ES2022, NodeNext resolution).
- **Framework:** Express.js 4.21.
- **Database:** MongoDB Atlas via Mongoose 8.9.5.
- **Validation:** Zod 3.24 for strictly typed schemas on body/query params.
- **Security:** `helmet`, `cors`, `bcryptjs` (salt 10), `jsonwebtoken` (JWT RS256/HS256).
- **Deployment:** Vercel Serverless Function using `@vercel/node` via `server/vercel.json`.

---

## 2. Directory Architecture (Layered Clean Pattern)
```text
server/
├── src/
│   ├── app.ts                 # Express app definition & serverless DB auto-connect
│   ├── server.ts              # Local dev HTTP listener (port 5000)
│   ├── config/
│   │   ├── env.ts             # Strongly validated environment variables
│   │   └── database.ts        # Mongoose connection with readyState caching for serverless
│   ├── controllers/           # HTTP controllers (auth, user, note, post, aggregation)
│   ├── middlewares/           # auth-middleware (JWT), role-middleware (RBAC), error-middleware, validate-middleware
│   ├── models/                # Mongoose models with explicit schema.index()
│   ├── routes/                # Express router modules
│   ├── services/              # Core business logic & MongoDB Aggregation pipelines
│   ├── scripts/
│   │   ├── seed.ts            # Database seed script with Admin & Users
│   │   └── audit-indexes.ts   # Zero-redundancy index validation & explain('executionStats')
│   ├── types/                 # Express global augmentations & shared interfaces
│   ├── utils/                 # api-response.ts, app-error.ts, pagination.ts
│   └── validations/           # Zod validation schemas
├── public/                    # Build artifact placeholder for Vercel
├── vercel.json                # Vercel serverless routing configuration
└── tsconfig.json              # TypeScript compilation config (outDir: dist)
```

---

## 3. Database Schema & Explicit Indexing Strategy
*Constraint: Only strictly required indexes exist. Zero redundant indexes permitted.*

### A. User Collection (`src/models/user-model.ts`)
- **Fields:** `name` (String), `email` (String, unique), `password` (String, select: false), `role` ('user' | 'admin'), `interests` ([String]).
- **Explicit Indexes:**
  1. `userSchema.index({ email: 1 }, { unique: true })`
     - **Purpose:** O(1) login lookup and registration uniqueness check.
  2. `userSchema.index({ createdAt: -1 })`
     - **Purpose:** Admin paginated user directory listing sorted newest first.
  3. `userSchema.index({ interests: 1 })`
     - **Purpose:** Multikey index supporting Scenario 1 aggregation ($match / $unwind).

### B. Note Collection (`src/models/note-model.ts`)
- **Fields:** `title` (String), `content` (String), `user` (ObjectId ref User), `createdAt`, `updatedAt`.
- **Explicit Indexes:**
  1. `noteSchema.index({ user: 1, createdAt: -1 })`
     - **Purpose:** Compound index supporting regular user note listing (Equality on `user` + Sort on `createdAt: -1`). Eliminates in-memory sort. Covers single-field `{ user: 1 }` via prefix rule.
  2. `noteSchema.index({ createdAt: -1 })`
     - **Purpose:** Admin global oversight view (`?all=true`) listing all notes across system sorted newest first.

### C. Post Collection (`src/models/post-model.ts`)
- **Fields:** `title` (String), `content` (String), `authorId` (ObjectId ref User), `createdAt`, `updatedAt`.
- **Explicit Indexes:**
  1. `postSchema.index({ authorId: 1, createdAt: -1 })`
     - **Purpose:** Foreign key lookup compound index supporting Scenario 2 `$lookup` pipeline and retrieving author posts sorted newest first.

---

## 4. Aggregation Pipelines (`src/services/aggregation-service.ts`)

### Scenario 1: Group Users by Interests
- **Constraint:** Exactly one `collection.aggregate()` call.
- **Pipeline:**
  1. `$match`: Filter non-empty interests array (uses `{ interests: 1 }` index).
  2. `$unwind`: Flatten `$interests` array into individual documents.
  3. `$project`: Normalize casing (`$toLower`, `$trim`) and minimal user projection.
  4. `$group`: `_id: '$interest'`, accumulate `count: { $sum: 1 }` and `users: { $push: '$user' }`.
  5. `$sort`: `{ count: -1, _id: 1 }`.
  6. `$project`: Clean output `{ interest: '$_id', count: 1, users: 1 }`.

### Scenario 2: User Posts ($lookup)
- **Constraint:** Single aggregation pipeline with a `$lookup` stage.
- **Pipeline:**
  1. `$match`: Match target user by primary key `_id: ObjectId`.
  2. `$lookup`: Join `posts` collection where `posts.authorId == currentUserId`, sorted by `createdAt: -1` (uses `{ authorId: 1, createdAt: -1 }` index).
  3. `$project`: Project user document with embedded `posts` array and `totalPosts: { $size: '$posts' }`.

---

## 5. Role-Based Access Control (RBAC) Matrix
- **Role 'user':**
  - Can create, update, delete, and list their **own** notes.
  - Can view Scenario 1 (Interests aggregation) and Scenario 2 (User posts lookup).
  - Can publish posts.
  - Forbidden from accessing `/api/users/*` and viewing other users' notes.
- **Role 'admin':**
  - Inherits all user capabilities.
  - Can view everyone's notes via `GET /api/notes?all=true`.
  - Can manage users: create, list paginated, get, update, and delete users via `/api/users/*`.
  - User deletion cascades to all associated notes and posts.
  - Cannot delete own active admin account.

---

## 6. Coding & Development Standards
- **Standard Response Envelope:** `ApiResponse.success(res, message, data, statusCode, paginationMeta)`
- **Standard Error Class:** `new AppError(message, statusCode)` handled centrally by `errorHandler`.
- **Naming Conventions:**
  - Classes & Interfaces: `PascalCase` (`UserService`, `IUserDocument`).
  - Functions & Variables: `camelCase` (`getPaginatedNotes`, `userId`).
  - Files: `kebab-case` (`note-service.ts`, `auth-middleware.ts`).
  - Environment: `SCREAMING_SNAKE_CASE` (`MONGODB_URI`, `JWT_SECRET`).
