# Project Development Rules & AI Boundaries

## 1. Core Engineering Principles

### 1.1 Architectural Integrity
- Strictly adhere to established modular directory structures (`controllers`, `services`, `models`, `middlewares`, `routes`, `utils`, `types`).
- Clear separation of concerns: Business logic in services, HTTP transport logic in controllers, database logic in models/services.
- No business logic in routes or raw database calls directly in presentation components.

### 1.2 Feature Auditing & DRY (Don't Repeat Yourself)
- **Check Before Building**: Before writing a new helper, utility, or component, verify if a shared abstraction already exists in `utils/` or `components/common/`.
- **Abstract Repetitive Patterns**: Extract repetitive logic (such as pagination calculators, standard API response wrappers, and auth token extractors) into reusable single-source-of-truth utilities.

### 1.3 Naming Conventions
- **Classes, Types, Interfaces & React Components**: `PascalCase` (e.g., `NoteService`, `AuthResponse`, `NoteCard`).
- **Variables, Functions & Methods**: `camelCase` (e.g., `getPaginatedNotes`, `isAuthenticated`).
- **Files & Folders**: `kebab-case` (e.g., `auth-controller.ts`, `note-model.ts`, `interest-group-card.tsx`).
- **Constants & Environment Keys**: `SCREAMING_SNAKE_CASE` (e.g., `JWT_SECRET`, `DEFAULT_PAGE_LIMIT`).

---

## 2. Backend & Database Rules (Interview Task Compliance)

### 2.1 Indexing Directives (CRITICAL)
- **Visible Syntax Requirement**: **MUST** use the Mongoose `schema.index({ ... })` method explicitly inside the model files so that all indexes are visible during code review.
- **Zero Redundant / Unnecessary Indexes**:
  - **DO NOT** add speculative or decorative indexes. Every single index must have a direct operational justification corresponding to an exact API query or aggregation stage.
  - Avoid redundant index prefixes: E.g., if `{ user: 1, createdAt: -1 }` exists, do NOT create `{ user: 1 }` separately.
  - Never index boolean flags with low cardinality unless part of a selective compound index.
  - Default `_id` is automatically indexed by MongoDB; never redeclare `schema.index({ _id: 1 })`.

### 2.2 Aggregation Constraints (CRITICAL)
- **Scenario 1 (Group by Interests)**:
  - **MUST** execute via **exactly one `collection.aggregate()` call**.
  - **DO NOT** execute multiple queries or perform in-memory JavaScript grouping with `Array.prototype.reduce` or `lodash`.
- **Scenario 2 (User Posts)**:
  - **MUST** use a **single aggregation pipeline with a `$lookup` stage**.
  - **DO NOT** perform manual two-step `findById` then `find({ authorId })` queries for this scenario.

### 2.3 Pagination Rules
- Every REST endpoint returning a collection/list **MUST** implement pagination.
- Query parameters: `page` (positive integer, default 1), `limit` (positive integer, default 10, max 100).
- Response metadata MUST include: `total`, `page`, `limit`, `totalPages`, `hasNext`, `hasPrev`.
- Sorting MUST default to `{ createdAt: -1 }` and be covered by an index to prevent memory-exhausting unindexed sorts.

### 2.4 Authentication & Security Standards
- Passwords must be hashed using `bcrypt` (minimum 10 salt rounds) before saving to the database.
- Plain passwords must **never** be logged, returned in API responses, or stored in plaintext.
- Mongoose User schema must define `password: { select: false }` or explicitly sanitize projections (`$project: { password: 0 }`).
- Protected endpoints must verify JWT signatures and attach user context (`id`, `role`, `email`) to `req.user`.
- Role verification must be enforced by a reusable `authorizeRole('admin')` middleware.

---

## 3. Frontend Rules & Best Practices

### 3.1 Template & Library Restrictions
- **DO NOT USE PRE-MADE UI TEMPLATES OR BOILERPLATE THEMES**.
- Adhere to custom, clean Vanilla CSS architecture.
- Keep dependencies minimal, focused, and lean.

### 3.2 Error Handling & User Feedback
- Display human-readable error messages on network failure or validation error.
- Interactive controls must visually reflect loading/disabled states during async operations.
- Token expiration must gracefully clear local state and redirect to `/login`.

---

## 4. Approved Dependencies & Whitelist

### Backend (`/server`)
- `express`: Minimalist web framework.
- `mongoose`: MongoDB ODM.
- `jsonwebtoken`: JWT generation and validation.
- `bcryptjs`: Secure password hashing.
- `dotenv`: Environment configuration.
- `cors`: Cross-Origin Resource Sharing.
- `helmet`: Secure HTTP response headers.
- `morgan`: Request logging.
- `zod`: Request body and query schema validation.
- `ts-node-dev` / `typescript`: Development runtime and compilation.

### Frontend (`/client`)
- `react`, `react-dom`: Component engine.
- `react-router-dom`: SPA routing.
- `lucide-react`: Lightweight, tree-shakeable icons.
- `vite`: Build tool.

---

## 5. Error Handling Pattern & Response Contracts

### 5.1 Standardized Error Handling
- Use a custom `AppError` class extending `Error` with `statusCode` and operational flags.
- Async controller functions must use an `asyncHandler` wrapper or try/catch routing into `next(err)`.
- Global error handling middleware catches all unhandled exceptions, sanitizes sensitive stack traces in production, and emits a standard JSON error envelope:
```json
{
  "success": false,
  "message": "Human-readable error summary",
  "error": {
    "code": "ERROR_CODE",
    "details": []
  }
}
```

---

## 6. Boundaries for AI Assistants

1. **No Speculative Architecture**: Do not install unnecessary heavy frameworks (like GraphQL, Redis, Microservices, or full enterprise ORMs) when Express + Mongoose + TypeScript fulfills the interview requirements.
2. **Never Bypass Index Constraints**: Always double-check every `schema.index` added against the interview requirements.
3. **No Placeholders in Final Code**: Write complete, working code. Never leave stub comments like `// implement later` or `// todo`.
4. **Documentation Sync**: When introducing new routes or endpoints, update the API documentation immediately.
