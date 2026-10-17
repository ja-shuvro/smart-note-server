# Product Requirement Document (PRD)

## 1. Executive Summary
The **Secure Note-Taking Application** is a full-stack web application designed as a technical demonstration of robust backend engineering, secure authentication, role-based access control (RBAC), database indexing efficiency, and advanced MongoDB aggregation pipelines.

While accompanied by a functional and clean frontend interface, the primary engineering focus is centered on backend architectural integrity, data security, minimal-yet-effective indexing strategies, and optimized aggregation query execution.

---

## 2. Project Goals & Objectives
1. **Secure Authentication & Authorization**: Implement stateful-free JWT authentication with salted password hashing (bcrypt) and strict Role-Based Access Control (`User` and `Admin`).
2. **Data Isolation & Management**: Ensure standard users can only access their personal notes, while administrators have elevated privileges to oversee all notes and manage platform users.
3. **Database Performance & Indexing Optimization**:
   - Explicitly define indexes using Mongoose `schema.index()`.
   - Adhere strictly to the zero-redundancy constraint: **No unnecessary indexes**.
   - Support all read and paginated list operations with optimal compound/single-field indexes.
4. **Advanced MongoDB Aggregations**:
   - **Scenario 1 (Group by Interests)**: Group users by their multi-value `interests` array using a single `collection.aggregate()` pipeline.
   - **Scenario 2 (User Posts with `$lookup`)**: Retrieve posts belonging to a specific user joined from a separate collection using a single aggregation pipeline with a `$lookup` stage.
5. **Functional Frontend Integration**: Build a clean, responsive client interface to interact with all API capabilities without utilizing bloated third-party templates.

---

## 3. User Personas & Role Matrix

### 3.1 Personas
- **Regular User (`user`)**:
  - A registered user who logs in to create, read, update, and delete their own notes.
  - Maintains a profile with custom interests (e.g., `["chess", "reading"]`).
  - Can publish public posts and view their own aggregated post history.
- **Administrator (`admin`)**:
  - A privileged user responsible for platform governance.
  - Can view all notes created by all users across the system.
  - Can manage users (list all users, create new users, update user roles/details, remove users).
  - Retains all capabilities of a regular user.

### 3.2 Role-Based Access Control (RBAC) Matrix

| Feature / Action | Regular User (`user`) | Administrator (`admin`) |
| :--- | :---: | :---: |
| Register / Login / View Profile (`/me`) | ✅ | ✅ |
| Create Note | ✅ (Own notes only) | ✅ (Own notes) |
| Read / List Own Notes (Paginated) | ✅ | ✅ |
| Update / Delete Own Note | ✅ | ✅ |
| Read / List All System Notes (Paginated) | ❌ | ✅ |
| Update / Delete Any User's Note | ❌ | ✅ |
| List All Users (Paginated) | ❌ | ✅ |
| Create / Update / Delete Other Users | ❌ | ✅ |
| View Users Grouped by Interests (Aggregation) | ✅ | ✅ |
| Create Public Posts | ✅ | ✅ |
| View User Posts via Aggregation (`$lookup`) | ✅ | ✅ |

---

## 4. Functional Specifications

### 4.1 Authentication & Profile Module
- **Registration**: Allows new users to sign up with `name`, unique `email`, `password`, and optional `interests` list.
- **Password Hashing**: Passwords must be hashed using `bcrypt` (minimum 10 salt rounds) before persistence. Plaintext passwords must never be stored or returned.
- **Authentication**: Email + password login returning a signed JWT (with user `id` and `role` claims) with expiration.
- **Protected Session (`/me`)**: Validates token and returns current user profile (excluding password).

### 4.2 Notes Management Module
- **Note Fields**: `title` (string, required), `content` (string, required), `user` (ObjectId reference to User, required), `createdAt`, `updatedAt`.
- **List Notes (Paginated)**:
  - Default User query: Notes where `user == req.user._id`, sorted by `createdAt: -1`.
  - Admin query option: All notes across all users, sorted by `createdAt: -1`.
  - Pagination parameters: `page` (default 1), `limit` (default 10). Response includes `total`, `page`, `limit`, and `totalPages`.
- **CRUD Operations**:
  - `GET /api/notes/:id`: Fetch specific note (User can only fetch own; Admin can fetch any).
  - `POST /api/notes`: Create new note assigned to logged-in user.
  - `PUT /api/notes/:id`: Update note content/title (ownership checked).
  - `DELETE /api/notes/:id`: Remove note (ownership checked; admin override).

### 4.3 Admin User Management Module
- **List Users (Paginated)**: `GET /api/users` with `page`, `limit`, sorted by `createdAt: -1`. Restricted to `admin`.
- **Create User**: `POST /api/users` allows admin to create users with specified role.
- **Update User**: `PUT /api/users/:id` to update user profile or role.
- **Delete User**: `DELETE /api/users/:id` to remove user and clean up orphaned resources.

### 4.4 Aggregation Pipeline Requirements

#### Scenario 1: Group by Interests
- **Requirement**: Specific view/endpoint returning users grouped by individual interests.
- **Input Data**: User profiles contain an array of interests (e.g., `interests: ['chess', 'reading']`).
- **Constraint**: Must execute in **exactly one `collection.aggregate()` call**.
- **Output Shape**:
  ```json
  [
    {
      "interest": "chess",
      "count": 2,
      "users": [
        { "_id": "...", "name": "Alice", "email": "alice@example.com" },
        { "_id": "...", "name": "Bob", "email": "bob@example.com" }
      ]
    }
  ]
  ```

#### Scenario 2: User Posts ($lookup)
- **Requirement**: Retrieve all posts belonging to a particular user, joining user and post data.
- **Collection**: Separate `Posts` collection containing `title`, `content`, `authorId`, `createdAt`.
- **Constraint**: Must use a **single aggregation pipeline containing a `$lookup` stage**.
- **Output Shape**: User details embedded with their complete array of published posts (or post enriched with author details).

---

## 5. Non-Functional & Technical Constraints

### 5.1 Critical Constraints (Interview Rubric)
1. **Explicit Index Declaration**: All indexes must be explicitly declared in code using Mongoose `schema.index(...)` so reviewers can verify them directly in the repository.
2. **Zero Unnecessary Indexes**:
   - Only create indexes that are strictly required to support the queries and aggregation pipelines described.
   - Evaluated on index efficiency (over-indexing penalizes write performance and RAM usage).
3. **No Templates**: Built cleanly from scratch; no pre-packaged dashboard themes or boilerplate generators.
4. **Backend-First Focus**: Frontend must be fully functional, integrated, and clean, but the primary assessment criteria is backend optimization and architecture.

### 5.2 Performance & Scalability
- Constant-time or logarithmic query lookups on high-cardinality keys.
- Compound indexes matching equality-sort-range patterns.
- Robust pagination preventing unbounded queries or memory exhaustion.

### 5.3 Security
- Sanitization of user input.
- Secure HTTP headers (Helmet), CORS configuration.
- JWT verification middleware with standard error formats.
