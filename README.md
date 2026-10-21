
# Õppeainete tagasiside

Solid UI components customized to follow the Figma references: black background, charcoal panels, pill-shaped inputs, five white rating circles that fill when selected, and a saved confirmation. Required form fields have red asterisks; only the comment is optional. Name and class are read-only.

The navigation contains the student form, a teacher feedback overview with subject filtering, and a comparison of response counts and average ratings. The overview includes the student, class, subject, rating, comment, and submission date. Empty subjects display an em dash instead of a fabricated average.

## Run

With Docker running, execute `docker compose up --build` from this directory, then open [localhost:3000](http://localhost:3000). SQLite data persists in the `feedbackdata` Docker volume. The original PostgreSQL service is retained under the optional `legacy-postgres` Compose profile; this implementation uses SQLite.

For local development with Bun and Node.js, use two terminals:

```powershell
cd backend
bun install
bun run dev
```

```powershell
cd frontend
bun install
bun run dev
```

The frontend proxies `/api` to port 8080. Set `API_TARGET` to change that target. The backend accepts `PORT` and `DATABASE_PATH`; its default database is `backend/data/feedback.sqlite`.

## Demo identity

The starter has no authentication. `/api/student` supplies a server-owned demo profile (`John Student`, `TA-24A-2`); set `STUDENT_NAME` and `STUDENT_CLASS` to change it. The API ignores client-supplied identity when saving. All views are available in the local demo; a deployed school system would need authenticated student and staff sessions.

## UI components

The components in `frontend/src/components/ui` are copied from [Solid UI](https://www.solid-ui.com/), with its MIT license retained alongside them. Kobalte provides the select, radio-group, button, and text-field behavior. Styling follows the supplied Figma images rather than the default theme.

The frontend uses SolidJS 1.9 and `vite-plugin-solid` to match Solid UI/Kobalte. The previous SolidJS 2 prerelease runtime and its development diagnostics were replaced for compatibility. Use `solid-js/web` for renderer imports. The starter example routes remain as unused examples; the application renders the feedback screens from `App.tsx`.

## Verification

```powershell
cd frontend
bun run typecheck
bun run build
bun run lint
bun run test --run
```

```powershell
cd backend
bun test
```

The backend tests use isolated SQLite databases and cover missing/unknown subjects, missing/invalid ratings, invalid/long comments, optional comments, server-controlled identity, malformed JSON, database reopening, and response counts/averages. Frontend tests cover profile fields, validation, and API load failure/retry.

Browser verification covers submission with no comment, confirmation after a successful save, teacher details, filtering, averages, reload, mobile overflow, and a simulated save failure that preserves the input. Screens were checked at desktop and mobile sizes. Docker execution requires a running Docker daemon and was not verified in this environment.
