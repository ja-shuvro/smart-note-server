# Technical Interview Task: Secure Note-Taking Application

A full-stack note-taking platform built with a high-performance REST API backend and a clean, responsive client interface. Engineered strictly to satisfy all constraints specified in the Technical Interview Task specification.

---

## 1. Quick Start & Setup

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB running locally on `mongodb://localhost:27017` (or cloud MongoDB Atlas URI)

### Setup Backend (`/server`)
```bash
cd server
npm install

# Setup environment
cp .env.example .env

# Seed database with sample users, notes, and posts
npm run seed

# Run automated index audit & explain verification
npm run audit

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```

### Setup Frontend (`/client`)
```bash
cd client
npm install

# Start frontend dev server (Runs on http://localhost:5173)
npm run dev
```

---

## 2. Test Credentials (Pre-seeded)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` | Can view all system notes, manage/delete users, create own notes & posts |
| **User** | `alice@example.com` | `user123` | Can manage own notes, view interests aggregation, publish posts |
| **User** | `bob@example.com` | `user123` | Can manage own notes, view interests aggregation, publish posts |

---

## 3. Database Indexing Strategy (Core Assessment)

> **Rule**: Indexes must be visible via `schema.index()` and contain **zero unnecessary indexes**.

| Model | Explicit Index Definition (`schema.index`) | Query / Operation Pattern Supported | Zero-Redundancy Rationale |
| :--- | :--- | :--- | :--- |
| `User` | `userSchema.index({ email: 1 }, { unique: true })` | `User.findOne({ email })` for login & registration uniqueness | Essential $O(1)$ lookup; avoids full collection scan. |
| `User` | `userSchema.index({ createdAt: -1 })` | Admin paginated user directory: `User.find().sort({ createdAt: -1 })` | Eliminates in-memory SORT stage in MongoDB RAM. |
| `User` | `userSchema.index({ interests: 1 })` | **Scenario 1 Aggregation**: Multikey index on `interests` array | Enables index-supported filtering and unwinding on interests. |
| `Note` | `noteSchema.index({ user: 1, createdAt: -1 })` | Regular user listing own notes: `Note.find({ user }).sort({ createdAt: -1 })` | **Compound ESR index**. Covers equality on `user` AND chronological sort. Prefix rule satisfies `{ user: 1 }`, avoiding redundant separate index! |
| `Note` | `noteSchema.index({ createdAt: -1 })` | Admin all-notes oversight view: `Note.find().sort({ createdAt: -1 })` | Satisfies platform-wide chronological note pagination. |
| `Post` | `postSchema.index({ authorId: 1, createdAt: -1 })` | **Scenario 2 Aggregation**: `$lookup` join condition & author post feed | Foreign-key index optimizing the `$lookup` pipeline matching `authorId`. |

### Automated Index Audit
Run the automated index inspection script:
```bash
npm run audit
```
This script queries MongoDB index metadata and runs `.explain('executionStats')` on live queries, proving that all list queries execute via `IXSCAN` (Index Scan) with zero in-memory sorting.

---

## 4. Aggregation Pipelines Implementation

### Scenario 1: Group by Interests
- **Constraint**: Must use **exactly one `collection.aggregate()` call**.
- **Implementation** in [`src/services/aggregation-service.ts`](src/services/aggregation-service.ts):
```typescript
User.aggregate([
  // 1. $match: Filter documents where interests is a non-empty array (uses { interests: 1 } index)
  { $match: { interests: { $exists: true, $type: 'array', $ne: [] } } },
  // 2. $unwind: Deconstruct array to create document per interest
  { $unwind: '$interests' },
  // 3. $project: Normalize interest casing
  { $project: { interest: { $toLower: { $trim: { input: '$interests' } } }, user: { _id: '$_id', name: '$name', email: '$email', role: '$role' } } },
  // 4. $group: Group by interest and accumulate users
  { $group: { _id: '$interest', count: { $sum: 1 }, users: { $push: '$user' } } },
  // 5. $sort: Rank by count descending, then alphabetical
  { $sort: { count: -1, _id: 1 } },
  // 6. $project: Clean output structure
  { $project: { _id: 0, interest: '$_id', count: 1, users: 1 } }
]);
```

### Scenario 2: User Posts ($lookup Join)
- **Constraint**: Must use a **single aggregation pipeline with a `$lookup` stage**.
- **Implementation** in [`src/services/aggregation-service.ts`](src/services/aggregation-service.ts):
```typescript
User.aggregate([
  // 1. $match: Match target user by primary _id
  { $match: { _id: new Types.ObjectId(targetUserId) } },
  // 2. $lookup: Single stage joining 'posts' collection using authorId foreign key
  {
    $lookup: {
      from: 'posts',
      let: { currentUserId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$authorId', '$$currentUserId'] } } },
        { $sort: { createdAt: -1 } }
      ],
      as: 'posts'
    }
  },
  // 3. $project: Exclude sensitive credentials and return user with embedded posts
  {
    $project: {
      _id: 1, name: 1, email: 1, role: 1, interests: 1, createdAt: 1,
      totalPosts: { $size: '$posts' },
      posts: 1
    }
  }
]);
```

---

## 5. REST API Endpoints Specification

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user (name, email, password, interests)
- `POST /api/auth/login` - Authenticate & return signed JWT
- `GET /api/auth/me` - Get authenticated profile (`Bearer <token>`)

### Notes (`/api/notes`)
- `GET /api/notes?page=1&limit=10` - Paginated notes (Regular user: own notes; Admin: pass `?all=true` for all system notes)
- `GET /api/notes/:id` - Fetch single note (ownership verified)
- `POST /api/notes` - Create new note assigned to logged-in user
- `PUT /api/notes/:id` - Update note (ownership verified, Admin can override)
- `DELETE /api/notes/:id` - Delete note (ownership verified, Admin can override)

### Admin User Management (`/api/users`) - *Admin Only*
- `GET /api/users?page=1&limit=10` - Paginated user directory
- `POST /api/users` - Admin provisions new user
- `GET /api/users/:id` - Fetch user detail
- `PUT /api/users/:id` - Update user role or profile
- `DELETE /api/users/:id` - Delete user (cascades to their notes & posts)

### Aggregations & Posts (`/api/aggregations` & `/api/posts`)
- `GET /api/aggregations/interests` - **Scenario 1**: Returns users grouped by interests
- `GET /api/aggregations/users/:userId/posts` - **Scenario 2**: Returns user posts via `$lookup`
- `POST /api/posts` - Publish a new public post
- `GET /api/posts?page=1&limit=10` - Paginated public posts feed
