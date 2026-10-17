# UI/UX Design System & Frontend Architecture

## 1. Design Philosophy & Guidelines

### 1.1 Objective
The frontend serves as an intuitive, high-performance interface to validate all backend REST endpoints, authentication flows, role-based capabilities, and complex MongoDB aggregations. 

In strict alignment with the technical interview criteria:
- **No Templates / No Boilerplate Themes**: Built 100% custom from scratch using modern semantic HTML5 and a tailored Vanilla CSS design token system.
- **Functionality-First with Visual Polish**: Clean, elegant, readable, and responsive without unnecessary component library overhead.
- **Fast & Interactive**: Sub-millisecond UI state transitions, responsive pagination, real-time validation feedback, and clear role distinctions.

---

## 2. Color Palette & Theming Tokens

A modern, balanced dark/light slate palette crafted for developer ergonomics and readability.

### 2.1 CSS Variables / Color Tokens

```css
:root {
  /* Brand / Primary */
  --color-primary: #4f46e5;         /* Indigo 600 */
  --color-primary-hover: #4338ca;   /* Indigo 700 */
  --color-primary-light: #e0e7ff;   /* Indigo 100 */
  --color-primary-glow: rgba(79, 70, 229, 0.15);

  /* Neutrals & Surfaces */
  --bg-app: #0f172a;                /* Slate 900 (Deep modern background) */
  --bg-surface: #1e293b;            /* Slate 800 (Card / Container background) */
  --bg-surface-elevated: #334155;   /* Slate 700 (Modals / Dropdowns) */
  --bg-input: #0f172a;              /* Slate 900 */
  
  /* Borders & Dividers */
  --border-subtle: #334155;         /* Slate 700 */
  --border-focus: #6366f1;          /* Indigo 500 */
  
  /* Text & Typography */
  --text-primary: #f8fafc;          /* Slate 50 (High contrast headers/body) */
  --text-secondary: #94a3b8;        /* Slate 400 (Metadata, subtitles) */
  --text-muted: #64748b;            /* Slate 500 (Placeholders, inactive) */
  
  /* Accents & Status Indicators */
  --color-success: #10b981;         /* Emerald 500 */
  --color-success-bg: rgba(16, 185, 129, 0.12);
  --color-warning: #f59e0b;         /* Amber 500 */
  --color-warning-bg: rgba(245, 158, 11, 0.12);
  --color-danger: #ef4444;          /* Rose 500 */
  --color-danger-bg: rgba(239, 68, 68, 0.12);
  --color-info: #0ea5e9;            /* Sky 500 */
  --color-info-bg: rgba(14, 165, 233, 0.12);

  /* Shadows & Elevations */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3);

  /* Radius & Transitions */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 3. Typography & Hierarchy

### 3.1 Font Stack
- **Primary Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Code & Query Font**: `'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace`

### 3.2 Type Scale

| Element / Class | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `h1`, `.title-xl` | `2rem` (32px) | `1.25` | 700 (Bold) | Main page titles, dashboard headers |
| `h2`, `.title-lg` | `1.5rem` (24px) | `1.3` | 600 (Semi-bold) | Section headers, modal titles |
| `h3`, `.title-md` | `1.25rem` (20px) | `1.4` | 600 (Semi-bold) | Note titles, card headers |
| `body-base` | `1rem` (16px) | `1.5` | 400 (Regular) | Primary text, note contents |
| `body-sm` | `0.875rem` (14px) | `1.4` | 400 / 500 | Form labels, table cells, metadata |
| `caption`, `meta` | `0.75rem` (12px) | `1.4` | 500 | Badges, timestamps, helper text |

---

## 4. Layout Architecture & Component Patterns

### 4.1 Master App Layout
- **Top Navigation Bar (`Navbar`)**:
  - Left: Brand Logo ("SecureNotes") + Environment / Connection status badge.
  - Middle: Navigation links (`My Notes`, `Interest Groups [Aggregation 1]`, `User Posts [Aggregation 2]`).
  - Right: Role indicator badge (`User` or `Admin`), Current User Name, Logout action.
- **Admin View Toggle / Admin Banner**:
  - When logged in as `Admin`, an elevated contextual banner or tab switcher allows switching between **Personal Notes** and **Admin Mode** (User Management & All-Notes Oversight).
- **Main Container**:
  - Centered responsive viewport (max-width `1200px`) with padding (`24px`).

### 4.2 Key Screen Designs

#### 1. Authentication Screens (`/login` & `/register`)
- Compact, centered auth card.
- Clear error banner on credential failure.
- Registration includes an interactive multi-input tag selector for adding **Interests** (e.g. `chess`, `coding`, `music`) to populate data for Scenario 1 Aggregation.
- Quick demo role switcher / credentials hint (`user@example.com` vs `admin@example.com`) for effortless interview reviewer testing.

#### 2. Personal Notes Dashboard (`/notes` or `/`)
- **Top Action Bar**: Search filter, Create Note button (`+ New Note`), and Note count summary.
- **Notes Grid**: Responsive auto-fitting cards (`grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`).
- **Note Card**:
  - Title with hover glow.
  - Formatted relative timestamp (`2 hours ago`).
  - Scrollable content body with max-height truncation.
  - Action footer: Edit (`Edit`), Delete (`Trash`) with confirmation modal.
- **Pagination Bar**:
  - Page indicator (`Page 1 of 4 | Total 36 notes`).
  - Previous / Next buttons with disabled states.
  - Page size selector (`10`, `25`, `50`).

#### 3. Admin Oversight & User Management (`/admin`)
- **Tab 1: All System Notes**:
  - Global listing showing notes from all users across the platform.
  - Displays author email and ID for each note.
  - Admin delete / edit capabilities.
- **Tab 2: User Directory**:
  - Clean data table: Name, Email, Role badge (`ADMIN` / `USER`), Interests tags, Registration Date, Actions.
  - Admin can update role (`User <-> Admin`) or delete a user.
  - Add User modal for direct administrator provisioning.

#### 4. Aggregation 1: Group by Interests (`/interests`)
- Visual display of Scenario 1 MongoDB aggregation results.
- Card per Interest tag:
  - Header: Interest name badge + User Count pill (`e.g., Chess (4 users)`).
  - Body: Avatar chips and names of members who share this interest.
- Inspect Pipeline Query modal/drawer: Allows the interviewer to view the exact MongoDB `$unwind` + `$group` query running on the server.

#### 5. Aggregation 2: User Posts ($lookup) (`/posts`)
- Visual display of Scenario 2 MongoDB aggregation results.
- User selector dropdown or profile feed view.
- Feed items showing posts joined with author profile metadata using the `$lookup` pipeline.
- Create Post modal to easily add new test data and verify real-time aggregation updates.

---

## 5. UI Micro-Interactions & Accessibility

- **Focus Rings**: High-contrast 2px indigo focus ring on all interactive elements (`:focus-visible`).
- **Loading States**: Shimmer skeleton blocks for note cards and data tables while requests are in flight.
- **Empty States**: Friendly empty illustration/icon when zero notes or posts exist with a direct call-to-action button.
- **Toast Notifications**: Non-blocking floating notifications for successful mutations (Note saved, User deleted, Post published).
