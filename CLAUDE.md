# CLAUDE.md — KMC Security Operations System

## Project Overview

**KMC SiteOps** is a bilingual (English/Chinese) Progressive Web App (PWA) for security operations management. It handles patrol task assignment, incident/SOS reporting, vendor inspections, and management reporting. The app is offline-first, mobile-first, and designed for field use by security patrol officers, supervisors, and administrators.

**Current Version:** V13.9 (Stable PWA)

## Repository Structure

```
kmc-Security/
├── index.html        # Monolithic SPA — all HTML, CSS, and JS (1,416 lines)
├── manifest.json     # PWA manifest (app name, icons, display mode)
├── sw.js             # Service Worker (caching strategy, offline support)
└── CLAUDE.md         # This file
```

This is a **single-file application** with no subdirectories for source code. All application logic, templates, and styles live in `index.html`.

## Tech Stack

| Technology | Version | Role | Loaded via |
|---|---|---|---|
| Vue.js | 3 (Global Build) | UI framework, reactivity, SPA routing | CDN (unpkg) |
| Tailwind CSS | Latest | Utility-first CSS | CDN |
| Supabase JS | 2.x | PostgreSQL backend, data persistence | CDN |
| Font Awesome | 6.4.0 | Icons | CDN |
| Chart.js | Latest | Dashboard charts | CDN |
| html2pdf.js | 0.10.1 | PDF export | CDN |
| SheetJS (XLSX) | 0.20.0 | Excel export | CDN |
| Google Fonts (Inter) | Latest | Typography | CDN |

**No build system.** No webpack, vite, or bundler. No `package.json`. All dependencies are loaded via CDN `<script>` tags.

## Architecture

### Single-File Vue 3 Composition API App

The entire app is a single Vue 3 `createApp()` call using the Composition API (`setup()`) inside `index.html`:

- **State management:** Vue `ref()` and `computed()` — no Vuex/Pinia
- **Routing:** String-based view switching via `currentView` ref (`v-if` conditionals in template)
- **Persistence:** Supabase PostgreSQL for remote data; `localStorage` for session, config, and offline queue
- **Styling:** Tailwind CSS utilities + custom CSS variables in a `<style>` block

### Key Vue State Variables

| Variable | Purpose |
|---|---|
| `currentUser` | Logged-in user session |
| `currentView` | Active SPA view (e.g., `'tasks'`, `'reports'`, `'admin'`) |
| `staffList`, `tasks`, `submissions` | Core data arrays from Supabase |
| `config` | App configuration (companies, points, SOS types) — persisted to localStorage |
| `offlineQueue` | Pending submissions stored locally when offline |
| `isOffline` | Network status flag |

### Database (Supabase)

Three primary tables:

| Table | Purpose |
|---|---|
| `kmc_staff` | User accounts (login_id, name, role, password) |
| `kmc_tasks` | Task definitions (routine and temporary) |
| `kmc_submissions` | All reports: patrol logs, SOS alerts, inspections, task executions |

Supabase credentials are embedded directly in `index.html` (lines 720-725). The anon key is used with row-level security expected on the Supabase side.

### Offline-First Strategy

1. **Service Worker** (`sw.js`): Caches core assets on install. Uses network-first with cache fallback for UI resources. Supabase API requests are never cached.
2. **Offline Queue**: When offline, submissions are stored in `offlineQueue` (backed by localStorage key `kmc_offline_records_v13`). Synced when connectivity resumes.
3. **Network Detection**: `isOffline` ref tracks `navigator.onLine` with event listeners.

## Application Modules

1. **Login** — Simple login_id + password authentication against `kmc_staff`
2. **Task Management** — Create/edit routine and temporary patrol tasks with priority, photo/signature requirements
3. **Task Execution** — Field officers execute assigned tasks, report violations, attach photos/signatures
4. **Patrol Duty Reports** — Log patrols at designated security points with evidence
5. **SOS/Incident Reporting** — Emergency alerts (car accident, fire, intruder, medical, snake) with photos
6. **Vendor Inspection** — Internal audits of contractor performance with findings and signatures
7. **Reports Dashboard** — KPI stats, Chart.js visualizations, PDF/Excel export, filtering
8. **Admin Console** — Staff management, company/point configuration, SOS type customization, honor board, factory reset

### User Roles

| Role | Access |
|---|---|
| `patrol` | Task execution, SOS reporting, duty logs |
| `manager` | All patrol abilities + task creation, reports, inspections |
| `admin` | Full access including admin console, staff management, config |

## Code Conventions

### Naming

- **CSS classes:** kebab-case (`ind-card`, `log-card`, `nav-item`, `pdf-export-mode`)
- **JavaScript functions:** camelCase (`handleLogin`, `fetchData`, `submitExecution`)
- **Vue refs:** camelCase (`currentUser`, `isLoading`, `staffList`)
- **Database columns:** snake_case (`staff_name`, `staff_id`, `is_violation`)

### CSS Organization

CSS is in a single `<style>` block with numbered section comments:
1. CSS Variables & Root Settings
2. Global Reset
3. Component: Cards
4. (continuing numerically...)

CSS variables are defined on `:root` for the dark theme color palette:
- `--bg-body: #0f172a` (Slate 900)
- `--bg-card: #1e293b` (Slate 800)
- `--primary: #3b82f6` (Blue 500)
- `--success: #10b981` (Emerald 500)
- `--danger: #f43f5e` (Rose 500)

### Bilingual Pattern

All user-facing text is bilingual (English / Chinese). Labels follow the format:
```
Task Management / 任务管理
```

User input fields require translation before submission. The app uses the MyMemory Translation API (`api.mymemory.translated.net`) for inline translation.

### LocalStorage Keys

| Key | Purpose |
|---|---|
| `kmc_user_session_v13` | Current logged-in user object |
| `kmc_config_v13_9_manual` | Application configuration (companies, points, SOS types) |
| `kmc_offline_records_v13` | Offline submission queue |

## Development Workflow

### Running Locally

No build step required. Serve the files with any static HTTP server:

```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# Or simply open index.html in a browser (some PWA features require HTTPS/localhost)
```

### Making Changes

All code changes happen in `index.html`. The file is organized as:
- **Lines 1-27:** HTML head, CDN imports, PWA meta tags
- **Lines 28-716:** `<style>` block (CSS)
- **Lines 717-1410:** `<script>` block (Vue app)
- Template HTML is embedded within the Vue `createApp()` template

### No Build, Test, or Lint Commands

There is no `package.json`, no test framework, no linter, and no CI/CD pipeline. Changes are tested manually in-browser.

### Git Conventions

- **Default branch:** `master`
- **Commit style:** Short descriptive messages (no conventional commits enforced)
- Changes are typically uploaded directly via GitHub UI or simple commits

## Key Considerations for AI Assistants

1. **Single-file constraint:** All changes go into `index.html` (or `sw.js`/`manifest.json` for PWA config). Do not split into multiple files without explicit instruction.
2. **No build step:** There is no transpilation or bundling. Code must be valid ES2020+ that runs directly in modern browsers.
3. **CDN dependencies:** Libraries are loaded via `<script>` tags, not `import` statements. Vue, Supabase, Chart.js, etc. are available as globals.
4. **Bilingual requirement:** Any new user-facing text must include both English and Chinese (`English / 中文`).
5. **Offline awareness:** New features that submit data should respect the offline queue pattern — check `isOffline.value` and push to `offlineQueue` when offline.
6. **Supabase credentials are inline:** The Supabase URL and anon key are hardcoded at lines 720-721. Do not remove or alter these without instruction.
7. **Mobile-first design:** The app container is max 600px wide. All UI must be touch-friendly and responsive.
8. **Dark theme:** The app uses a dark color scheme (Slate palette). New UI elements should use the existing CSS variables (`--bg-card`, `--primary`, etc.).
9. **Vue 3 Composition API only:** All logic is in the `setup()` function. Use `ref()`, `computed()`, `watch()`, and `onMounted()` patterns consistent with the existing code.
10. **No TypeScript:** Plain JavaScript only. No type annotations.
