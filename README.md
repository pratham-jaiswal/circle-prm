# Circle - A Personal Relationship Manager

Circle PRM is a personal relationship manager designed for tracking people, notes, interactions, reminders, relationships, and events while keeping every record scoped to the authenticated user on the server.

## What It Does

- Manage detailed people profiles.
- Create and edit notes with a rich Markdown editor.
- Log interactions and associate them with people.
- Track relationships between people.
- Store reminders and important events.
- Explore a connection graph.
- Search globally with a keyboard-driven command palette.
- Import and export user-scoped data.
- Support light and dark themes.


## Tech Stack

- Next.js 16 App Router
- TypeScript
- MongoDB + Mongoose
- Better Auth
- Google OAuth
- Tailwind CSS 4
- next-themes
- React Hook Form
- Zod
- MDXEditor
- React Flow
- date-fns
- Lucide React

## Current Feature Set

### Core entities

- People
- Notes
- Interactions
- Events
- Reminders
- Relationships
- Saved views

### UX features

- Protected authenticated app shell
- Email allowlist for access control
- Global search with `Ctrl/Cmd + K`
- Floating theme toggle
- Dashboard with reminders, birthdays, outreach prompts, recent notes, and recent interactions
- Connection graph visualization

### Data portability

- Full JSON export
- ZIP backup export
- Scoped exports for people and notes
- Full import preview/commit flow
- Scoped import flows for people and notes
- Import issue analysis for unresolved and ambiguous references

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local environment file from [`.env.example`](.env.example).

Required variables:

```env
MONGODB_URI=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_EMAILS=you@example.com
```

Notes:

- `ALLOWED_EMAILS` is a comma-separated allowlist.
- `BETTER_AUTH_URL` should match the app origin.
- MongoDB credentials must remain server-only.

### 3. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Authentication Model

The app currently uses Google sign-in with an allowlisted email check.

High-level flow:

1. User authenticates with Google.
2. Better Auth creates or validates the session.
3. The app checks the email against `ALLOWED_EMAILS`.
4. Protected routes and server actions enforce access.
5. Data access is scoped to the current user in the DAL.

## Data Model Conventions

Each major entity has:

- MongoDB `_id`
- Stable `publicId`

Example prefixes used by the app:

- `PER_` for people
- `NOTE_` for notes
- `INT_` for interactions
- `EVT_` for events
- `REM_` for reminders
- `REL_` for relationships

These public IDs are used in the UI, imports, exports, and route addressing.

## Architecture Overview

### App structure

- [app](app) contains App Router pages and API routes.
- [src/actions](src/actions) contains server actions for mutations.
- [src/lib/dal](src/lib/dal) contains user-scoped data access logic.
- [src/models](src/models) contains Mongoose models.
- [src/lib/validation](src/lib/validation) contains Zod schemas.
- [src/components](src/components) contains client and shared UI components.

### Security rules

- Never trust client-supplied ownership.
- Scope user-owned queries by authenticated user server-side.
- Keep database access out of client components.
- Enforce ownership in DAL and mutation paths.

## Main Routes

- `/` dashboard
- `/people`
- `/notes`
- `/interactions`
- `/events`
- `/reminders`
- `/relationships`
- `/connections`
- `/saved-views`
- `/import`
- `/export`
- `/settings`
- `/sign-in`

## Import / Export

The import system supports preview-before-commit workflows and reference analysis.

Capabilities include:

- schema-aware import processing
- scoped people-only and notes-only imports
- unresolved and ambiguous person reference detection
- resolution mapping during import commit
- created/updated/skipped result summaries

Export supports:

- full backup JSON
- ZIP backup bundle
- scoped exports for selected entity types

## Development Notes

- This repo uses Next.js 16 App Router conventions.
- Theme switching is class-based and handled with `next-themes`.
- The command palette is intentionally disabled on the sign-in screen.
- The app is private-first and built to remain multi-user-ready.

## Verification

Recommended checks before shipping changes:

```bash
npm run lint
npm run build
```
