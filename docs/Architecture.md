# System Architecture & Technical Specifications

## 1. System Overview & Architecture Flow

The system follows a decoupled Full-Stack Client-Server architecture with a RESTful API backend and a single-page application (SPA) frontend.

```
+-----------------------------------------------------------------------+
|                             CLIENT SPA                                |
|           (React 18 / Vite / TypeScript / Modular CSS)                |
+-----------------------------------------------------------------------+
                                   |
                         HTTP / REST API (JSON)
                      Bearer JWT in Authorization
                                   |
+-----------------------------------------------------------------------+
|                            BACKEND API                                |
|                  (Node.js / Express / TypeScript)                     |
|                                                                       |
|  [Security & Parsing] ---> Helmet, CORS, Express JSON Parser         |
|  [Auth Middleware]   ---> JWT Verification & Role Injection           |
|  [Validation Layer]  ---> Zod Request Schema Validators               |
|  [Routing Layer]     ---> /api/auth, /api/users, /api/notes, /api/posts|
|  [Controllers]       ---> Request extraction & response formatting    |
|  [Services]          ---> Business logic & Aggregation Pipelines      |
|  [Error Handler]     ---> Centralized Global Error Formatter          |
+-----------------------------------------------------------------------+
                                   |
                              Mongoose ODM
                           schema.index() definitions
                                   |
+-----------------------------------------------------------------------+
|                           MONGODB DATABASE                            |
|                                                                       |
|   - Users Collection  : Credentials, Roles, Interests Array           |
|   - Notes Collection  : Private User Notes, System Notes              |
|   - Posts Collection  : Public Posts referenced to Authors            |
+-----------------------------------------------------------------------+
```

---

## 2. Technology Stack

### 2.1 Backend (`/server`)
- **Runtime Environment**: Node.js (LTS v20+)
- **Programming Language**: TypeScript (strict type safety, interface contracts)
- **Framework**: Express.js
- **Database & ODM**: MongoDB with Mongoose (v8+)
- **Authentication**: `jsonwebtoken` (JWT) with standard Bearer authorization
- **Password Security**: `bcryptjs` (salt rounds: 10)
- **Validation**: Zod (type-safe request body/query schema validation)
- **Middleware / Utility**: `cors`, `helmet`, `dotenv`, `morgan` (HTTP logging)

### 2.2 Frontend (`/client`)
- **Build Tool & Bundler**: Vite (Fast HMR, optimized production build)
- **Framework / UI Library**: React 18+ with TypeScript
- **Routing**: `react-router-dom` v6
- **State Management & Data Fetching**: React Context + Custom Hooks with standard Fetch/Axios API client
- **Icons**: `lucide-react`
- **Styling**: Vanilla CSS Modules / CSS Variables Design System (strictly avoiding bloated external UI templates to comply with interview constraints)

---

## 3. Directory & File Structure

### 3.1 Backend (`/server`)
```
server/
├── src/
│   ├── config/
│   │   ├── database.ts            # MongoDB Mongoose connection handler
│   │   └── env.ts                 # Validated environment variable loader
│   ├── controllers/
│   │   ├── auth-controller.ts     # Register, login, me endpoints
│   │   ├── user-controller.ts     # User management & interest aggregation
│   │   ├── note-controller.ts     # Notes CRUD & paginated listings
│   │   └── post-controller.ts     # Post creation & $lookup aggregation
│   ├── middlewares/
│   │   ├── auth-middleware.ts     # JWT token extraction & verification
│   │   ├── role-middleware.ts     # RBAC authorization guard (User / Admin)
│   │   ├── validate-middleware.ts # Zod schema validation interceptor
│   │   └── error-middleware.ts    # Global centralized error handler
│   ├── models/
│   │   ├── user-model.ts          # User schema + schema.index definitions
│   │   ├── note-model.ts          # Note schema + schema.index definitions
│   │   └── post-model.ts          # Post schema + schema.index definitions
│   ├── routes/
│   │   ├── index.ts               # Master route aggregator
│   │   ├── auth-routes.ts         # /api/auth routes
│   │   ├── user-routes.ts         # /api/users routes (Admin + Aggregation)
│   │   ├── note-routes.ts         # /api/notes routes
│   │   └── post-routes.ts         # /api/posts routes (Posts + Aggregation)
│   ├── services/
│   │   ├── auth-service.ts        # Auth & password verification logic
│   │   ├── user-service.ts        # User queries & interest aggregation
│   │   ├── note-service.ts        # Note queries & pagination logic
│   │   └── post-service.ts        # Post queries & $lookup pipeline logic
│   ├── types/
│   │   ├── express.d.ts           # Express Request user augmentation
│   │   └── index.ts               # Shared interfaces, DTOs, API responses
│   ├── utils/
│   │   ├── api-response.ts        # Standardized API response wrappers
│   │   ├── app-error.ts           # Custom operational error classes
│   │   └── pagination.ts          # Reusable pagination query helper
│   ├── app.ts                     # Express application configuration
│   └── server.ts                  # Server entry point & startup listener
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### 3.2 Frontend (`/client`)
```
client/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios/Fetch client with auth interceptor
│   │   ├── auth-api.ts            # Auth endpoint callers
│   │   ├── notes-api.ts           # Notes CRUD endpoint callers
│   │   ├── users-api.ts           # Admin user management & aggregation callers
│   │   └── posts-api.ts           # Posts creation & lookup aggregation callers
│   ├── components/
│   │   ├── common/
│   │   │   ├── button.tsx         # Reusable button component
│   │   │   ├── input.tsx          # Reusable input & form controls
│   │   │   ├── modal.tsx          # Reusable accessible modal dialog
│   │   │   ├── pagination.tsx     # Reusable pagination bar
│   │   │   └── status-badge.tsx   # Role and status badge indicators
│   │   ├── layout/
│   │   │   ├── navbar.tsx         # Top navigation bar & user menu
│   │   │   ├── sidebar.tsx        # Navigation sidebar
│   │   │   └── protected-route.tsx# Auth & Role guard wrapper
│   │   ├── notes/
│   │   │   ├── note-card.tsx      # Note preview card
│   │   │   └── note-form.tsx      # Note create/update editor
│   │   └── aggregations/
│   │       ├── interest-group-card.tsx # Visual grouping by interests
│   │       └── user-posts-feed.tsx     # User posts $lookup viewer
│   ├── context/
│   │   └── auth-context.tsx       # Auth state provider (user, token, role)
│   ├── hooks/
│   │   ├── use-auth.ts            # Custom auth hook
│   │   └── use-notes.ts           # Custom notes pagination & CRUD hook
│   ├── pages/
│   │   ├── login-page.tsx         # User & Admin login view
│   │   ├── register-page.tsx      # User registration with interests selector
│   │   ├── dashboard-page.tsx     # Personal notes listing & management
│   │   ├── admin-users-page.tsx   # Admin user management view
│   │   ├── admin-notes-page.tsx   # Admin all-notes oversight view
│   │   ├── interests-page.tsx     # Scenario 1 Aggregation visualization
│   │   └── posts-page.tsx         # Scenario 2 $lookup Aggregation view
│   ├── styles/
│   │   ├── variables.css          # Design tokens (colors, typography, spacing)
│   │   ├── reset.css              # Baseline modern CSS reset
│   │   └── global.css             # Utility classes & component styles
│   ├── types/
│   │   └── index.ts               # Frontend TypeScript interfaces
│   ├── App.tsx                    # Root routing and context provider
│   └── main.tsx                   # React DOM entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Database Schema & Indexing Strategy

### 4.1 Indexing Design Principles & Interview Constraints
- **Explicit Visibility**: Every single index is defined using the Mongoose `schema.index(...)` API directly in the model files so reviewers can clearly audit them.
- **Strict Efficiency**: **NO redundant or unnecessary indexes**.
  - Default `_id` has an automatic unique index in MongoDB.
  - An index is ONLY created if it directly supports a high-cardinality equality filter, a compound equality+sort pagination pattern, or an aggregation query.

### 4.2 Schema Definitions & Explicit Indexes

#### 1. User Model (`User`)
- **Fields**:
  - `_id`: ObjectId (Automatic index)
  - `name`: String (Required)
  - `email`: String (Required, unique, trimmed, lowercase)
  - `password`: String (Required, bcrypt hash)
  - `role`: Enum (`'user'`, `'admin'`), default `'user'`
  - `interests`: Array of Strings (e.g. `['chess', 'reading']`)
  - `createdAt`: Date (Auto timestamp)
  - `updatedAt`: Date (Auto timestamp)
- **Indexes**:
  ```typescript
  // 1. Email lookup for authentication (Register unique check & Login query)
  userSchema.index({ email: 1 }, { unique: true });

  // 2. Admin listing sorted by creation date with pagination
  userSchema.index({ createdAt: -1 });

  // 3. Scenario 1 Aggregation: Group by Interests ($unwind on interests)
  // Multikey index supporting efficient index scan on interests array
  userSchema.index({ interests: 1 });
  ```
- **Justification for User Indexes**:
  - `{ email: 1 }`: Essential for `User.findOne({ email })` during login ($O(1)$ lookup instead of $O(N)$ collection scan) and enforces uniqueness.
  - `{ createdAt: -1 }`: Essential for Admin User Management paginated query `User.find().sort({ createdAt: -1 }).skip(x).limit(y)`. Avoids in-memory sort.
  - `{ interests: 1 }`: Supports Scenario 1 interest aggregation pipeline filtering/unwinding.

#### 2. Note Model (`Note`)
- **Fields**:
  - `_id`: ObjectId (Automatic index)
  - `title`: String (Required)
  - `content`: String (Required)
  - `user`: ObjectId (Ref: `'User'`, Required)
  - `createdAt`: Date (Auto timestamp)
  - `updatedAt`: Date (Auto timestamp)
- **Indexes**:
  ```typescript
  // 1. Compound index for User Listing own notes sorted by most recent first
  // Equality on `user` + Sort on `createdAt` (ESR rule)
  noteSchema.index({ user: 1, createdAt: -1 });

  // 2. Admin oversight listing: all notes across the platform sorted by most recent
  noteSchema.index({ createdAt: -1 });
  ```
- **Justification for Note Indexes**:
  - `{ user: 1, createdAt: -1 }`: Highly optimized compound index for regular users listing their own notes: `Note.find({ user: userId }).sort({ createdAt: -1 }).skip(s).limit(l)`. Covers both the filter and the sort, completely eliminating in-memory sorting and scanning only the user's keys.
  - `{ createdAt: -1 }`: Used by the Administrator oversight view to fetch all notes system-wide sorted by newest first without in-memory sort.
  - *Why NOT `{ user: 1 }` separately?* The compound `{ user: 1, createdAt: -1 }` prefix already covers equality lookups on `{ user: 1 }` according to MongoDB prefix rules, avoiding redundant index overhead!

#### 3. Post Model (`Post`)
- **Fields**:
  - `_id`: ObjectId (Automatic index)
  - `title`: String (Required)
  - `content`: String (Required)
  - `authorId`: ObjectId (Ref: `'User'`, Required)
  - `createdAt`: Date (Auto timestamp)
  - `updatedAt`: Date (Auto timestamp)
- **Indexes**:
  ```typescript
  // 1. Foreign-key lookup index for Scenario 2 ($lookup from User or Post retrieval)
  // Equality on `authorId` + Sort on `createdAt`
  postSchema.index({ authorId: 1, createdAt: -1 });
  ```
- **Justification for Post Indexes**:
  - `{ authorId: 1, createdAt: -1 }`: Supports the `$lookup` pipeline matching `authorId` as well as retrieving a specific user's posts sorted chronologically.

---

## 5. Aggregation Pipeline Specifications

### 5.1 Scenario 1: Group Users by Interests
- **Requirement**: "Specific view to see users grouped by interests. Constraint: You must use exactly one `collection.aggregate()` call. Do not use any other methods."
- **Pipeline Implementation**:
  ```typescript
  const result = await User.aggregate([
    // Stage 1: Filter out documents where interests is empty or null (supported by { interests: 1 } index)
    {
      $match: {
        interests: { $exists: true, $ne: [] }
      }
    },
    // Stage 2: Deconstruct the interests array so each interest generates a document
    {
      $unwind: "$interests"
    },
    // Stage 3: Normalize interest to lowercase/trimmed to prevent casing fragmentation
    {
      $project: {
        interest: { $toLower: "$interests" },
        user: {
          _id: "$_id",
          name: "$name",
          email: "$email",
          role: "$role"
        }
      }
    },
    // Stage 4: Group documents by interest and collect users
    {
      $group: {
        _id: "$interest",
        count: { $sum: 1 },
        users: { $push: "$user" }
      }
    },
    // Stage 5: Sort interests alphabetically or by count descending
    {
      $sort: { count: -1, _id: 1 }
    },
    // Stage 6: Format final output
    {
      $project: {
        _id: 0,
        interest: "$_id",
        count: 1,
        users: 1
      }
    }
  ]);
  ```

### 5.2 Scenario 2: User Posts ($lookup)
- **Requirement**: "Users can write posts which are stored in a separate Posts collection. Retrieve all posts belonging to a particular user. Constraint: Use a single aggregation pipeline with a `$lookup` stage."
- **Pipeline Implementation**:
  ```typescript
  const userId = new mongoose.Types.ObjectId(targetUserId);

  const result = await User.aggregate([
    // Stage 1: Match the specific target user by _id
    {
      $match: { _id: userId }
    },
    // Stage 2: Join posts from the 'posts' collection using $lookup
    {
      $lookup: {
        from: "posts",
        let: { uId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$authorId", "$$uId"] }
            }
          },
          {
            $sort: { createdAt: -1 }
          }
        ],
        as: "posts"
      }
    },
    // Stage 3: Exclude sensitive credentials like password hash
    {
      $project: {
        password: 0,
        __v: 0
      }
    }
  ]);
  ```
- **Alternative Post-Centric Pipeline Option** (if querying directly from Posts with Author details joined):
  ```typescript
  const result = await Post.aggregate([
    {
      $match: { authorId: userId }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "author"
      }
    },
    {
      $unwind: "$author"
    },
    {
      $project: {
        "author.password": 0,
        "author.__v": 0
      }
    }
  ]);
  ```
  *(Both pipelines meet the constraint and can be surfaced via dedicated endpoints or query options).*

---

## 6. REST API Endpoints Specification

### 6.1 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with name, email, password, interests |
| `POST` | `/api/auth/login` | Public | Authenticate user & return signed JWT |
| `GET` | `/api/auth/me` | Authenticated | Return authenticated user's profile |

### 6.2 Notes (`/api/notes`)
| Method | Endpoint | Access | Query / Body Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notes` | Authenticated | `page`, `limit`, `all` (Admin only) | List notes with pagination. Regular users get own notes; Admins can pass `?all=true` |
| `GET` | `/api/notes/:id` | Authenticated | None | Retrieve specific note by ID (ownership verified unless Admin) |
| `POST` | `/api/notes` | Authenticated | `{ title, content }` | Create new note assigned to current user |
| `PUT` | `/api/notes/:id` | Authenticated | `{ title?, content? }` | Update note (owner or Admin) |
| `DELETE` | `/api/notes/:id` | Authenticated | None | Delete note (owner or Admin) |

### 6.3 Admin User Management (`/api/users`)
| Method | Endpoint | Access | Query / Body Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin only | `page`, `limit` | Paginated list of all users |
| `POST` | `/api/users` | Admin only | `{ name, email, password, role, interests }` | Admin creates user |
| `GET` | `/api/users/:id` | Admin only | None | Retrieve user by ID |
| `PUT` | `/api/users/:id` | Admin only | `{ name?, role?, interests? }` | Update user details or role |
| `DELETE` | `/api/users/:id` | Admin only | None | Delete user |

### 6.4 Aggregation & Posts (`/api/aggregations` & `/api/posts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/aggregations/interests` | Authenticated | **Scenario 1**: Returns users grouped by interests via single `aggregate()` |
| `GET` | `/api/users/:id/posts` | Authenticated | **Scenario 2**: Returns user posts using single pipeline with `$lookup` |
| `POST` | `/api/posts` | Authenticated | Create a new post |
| `GET` | `/api/posts` | Authenticated | Paginated list of recent posts |

---

## 7. Standard API Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "email", "issue": "Invalid email address format" }
    ]
  }
}
```
