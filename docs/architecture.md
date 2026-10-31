# Architecture Overview

This document describes the high-level architecture of the application: a web-based English learning platform with AI-powered grammar checking and pronunciation feedback. The system is built as a lightweight, serverless stack: a static frontend, a managed Backend-as-a-Service, and external AI providers.

## System Diagram

```text
+-----------+      HTTPS       +--------------------+      HTTPS / WebSocket      +------------------------+
|           | ---------------> |     Cloudflare     | --------------------------> |        Supabase        |
|  Browser  |                  |  (DNS, CDN, WAF,   |                             |  - Auth                |
|  (HTML /  | <--------------- |   Pages hosting)   | <-------------------------- |  - PostgreSQL + RLS    |
|  CSS / JS)|   Static assets  +--------------------+        JSON responses       |  - Storage             |
+-----------+                                                                     |  - Edge Functions      |
                                                                                  +-----------+------------+
                                                                                              |
                                                                                              | HTTPS (server-side only)
                                                                                              v
                                                                                  +------------------------+
                                                                                  |     AI Providers       |
                                                                                  |  - Grammar (LLM)       |
                                                                                  |  - Pronunciation (STT) |
                                                                                  +------------------------+
```

**Request flow:** Browser -> Cloudflare -> Supabase -> AI -> Supabase -> Browser.

## 1. Frontend

### Stack
- **HTML5** for semantic page structure.
- **CSS3** (custom properties, Flexbox/Grid) for responsive, mobile-first styling.
- **Vanilla JavaScript (ES Modules)** with no heavy framework, keeping the bundle small and load times fast.

### Routing
- Client-side routing via the **History API** (`pushState` / `popstate`) with a small hash-based fallback.
- Each route maps to a view module that renders into a single root container.
- Cloudflare Pages is configured with an SPA fallback (`/* -> /index.html`) so deep links work on refresh.

### State Management
- A lightweight **observable store** (publish/subscribe pattern) holds global state: current user, session, lesson progress, and UI flags.
- **Supabase Auth** manages the session; the access token is refreshed automatically by the Supabase client.
- Non-sensitive preferences (theme, language) are persisted in `localStorage`.
- Server data is fetched on demand and cached in memory for the current session.

### Project Structure (suggested)
```text
/
|-- index.html
|-- /css
|-- /js
|   |-- router.js
|   |-- store.js
|   |-- api.js
|   `-- /views
`-- /assets
```

## 2. Backend & Database

### Supabase
Supabase is the single backend platform, providing:
- **Auth** (email/password, OAuth providers, JWT-based sessions).
- **PostgreSQL** as the primary relational database.
- **Storage** for user audio recordings and static learning media.
- **Edge Functions** (Deno) for custom server-side logic.

### PostgreSQL
- Core tables: `profiles`, `lessons`, `progress`, `grammar_checks`, `pronunciation_attempts`.
- Foreign keys reference `auth.users(id)` to tie data to authenticated users.
- Indexes on frequently queried columns (`user_id`, `created_at`, `lesson_id`).
- Schema changes are managed through versioned **SQL migrations**.

### Row Level Security (RLS)
- RLS is **enabled on every table** in the `public` schema.
- Default policy is deny-all; access is granted explicitly.
- Typical policies:
  - Users can `SELECT`, `INSERT`, and `UPDATE` only rows where `user_id = auth.uid()`.
  - Lesson content is readable by all authenticated users but writable only by admins.
- The browser uses only the public **anon key**; RLS is the primary security boundary.

### Edge Functions
- Act as a secure proxy between the browser and third-party AI services.
- Verify the user's JWT, validate input, apply rate limits, and log usage.
- Keep API keys and business logic off the client.

## 3. AI Integration

### Grammar
- The browser sends the user's text to an Edge Function (`/functions/v1/grammar-check`).
- The function authenticates the user, sanitizes the input, and calls an LLM with a structured prompt.
- The model returns **JSON**: corrected text, a list of errors, explanations, and suggestions.
- Results are saved to `grammar_checks` for history and progress tracking.

### Pronunciation
- The browser records audio via the **MediaRecorder API** and uploads it to Supabase Storage (or sends it directly to the function).
- An Edge Function (`/functions/v1/pronunciation-score`) forwards the audio to a speech-to-text / pronunciation assessment service.
- The response contains an overall score, per-word accuracy, and feedback.
- Results are stored in `pronunciation_attempts`; raw audio is retained only as long as needed.

### Guidelines
- All AI calls happen **server-side only**; provider keys never reach the browser.
- Enforce per-user quotas and request size limits to control cost and abuse.
- Handle timeouts and provider errors gracefully with clear fallback messages in the UI.

## 4. Infrastructure & Security

### Hosting
- The static frontend is deployed on **Cloudflare Pages**, with automatic builds and preview deployments from Git.
- Supabase hosts the database, auth, storage, and edge functions as a managed service.

### Cloudflare
- **DNS** and **CDN** for global, low-latency delivery of static assets.
- **TLS** (HTTPS enforced, HSTS enabled).
- **WAF** and bot protection, plus **rate limiting** on sensitive routes.
- Security headers via `_headers`: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` (microphone allowed only for the app origin).

### Secrets Management
- Third-party API keys are stored as **Supabase secrets** and read only inside Edge Functions.
- The frontend contains only public values: the Supabase URL and the **anon key**.
- The `service_role` key is **never** exposed to the browser or committed to Git.
- `.env` files are listed in `.gitignore`; CI/CD variables are stored in the hosting dashboard.
- Rotate keys periodically and immediately after any suspected leak.

### Additional Security Practices
- Strict input validation and output escaping to prevent XSS.
- CORS restricted to the production and preview domains.
- Regular dependency and configuration reviews.

## 5. Future Scalability

### Mobile
- Convert the web app into a **Progressive Web App (PWA)** with a manifest and service worker for installability.
- Optionally wrap the app with **Capacitor** for App Store and Google Play distribution, or build native clients that reuse the same Supabase backend.

### Offline
- Use a **service worker** to cache the app shell and lesson content.
- Store progress locally in **IndexedDB** and sync with Supabase when the connection returns (queue and retry strategy with conflict resolution).
- Allow recording pronunciation attempts offline and upload them later.

### Internationalization (i18n)
- Extract all UI strings into locale files (`/locales/en.json`, `/locales/uz.json`, `/locales/ru.json`).
- Detect language from browser settings with a manual override saved in the user profile.
- Use `Intl` APIs for dates, numbers, and pluralization.
- Store translatable lesson content with a `locale` column, or in separate translation tables.

### Other Considerations
- Add database read replicas and caching as traffic grows.
- Move heavy AI workloads to queued background jobs.
- Introduce monitoring and analytics (error tracking, performance metrics, usage dashboards).
