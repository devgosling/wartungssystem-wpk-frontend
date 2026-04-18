# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server with hot reload.
- `npm run build` — Production build (outputs to `dist/`).
- `npm run preview` — Preview the production build locally.
- `npm run test:unit` — Run Vitest unit tests (jsdom env). Run a single test file with `npx vitest run path/to/file.spec.js`, or focus with `-t "test name"`.
- `npm run format` — Prettier over `src/` (`printWidth: 100`, no semicolons, single quotes).

No lint script is configured.

## Architecture

Vue 3 (Options API in most components) + Vite + PrimeVue (Aura theme) + Pinia + Vue Router + Appwrite. UI language is German.

### Backend: Appwrite

All backend access funnels through [src/lib/appwrite.js](src/lib/appwrite.js), which instantiates a single `Client` (project `wpk`, endpoint `fra.cloud.appwrite.io`) and exports `account`, `databases`, `storage`, `functions`, `teams`, and `ID`. Note: a `setDevKey(...)` is currently called at module load — treat this file as the sole place to touch Appwrite client config.

Data model (hardcoded IDs across the codebase — searching for them is the fastest way to find call sites):
- Database: `wartungssystem`
- Collections: `wartungsbericht`, `stundenzettel` (and customers/employees via other collections touched in views)
- Storage bucket: `storage`
- Team: `administration` = `68866cde003207e2fbab` (used by the router guard)
- Function: `69b18cbb0036de675223` endpoint `/sendbericht` (emails the generated PDF to the customer)

### Auth & routing

[src/router/index.js](src/router/index.js) defines a single `beforeEach` guard that:
1. Calls `isUserLoggedIn()` ([src/lib/utils.js](src/lib/utils.js)) — a `account.get()` probe.
2. Enforces `meta.requiresAuth` / `meta.requiresUnauth`.
3. For `meta.requiresTeam: 'administration'`, lists memberships of the admin team and redirects to `/401` on failure.
4. Sets `document.title` and clears `isEditingSomething` in the Pinia store on every navigation.

[src/App.vue](src/App.vue) shows a first-login password-change dialog when `account.prefs.initialized` is absent. Initial password convention is `12345{lowercased last name}`.

### PDF generation pipeline

Maintenance reports ("Wartungsberichte"), the softening-plant check report ("Überprüfungsbericht Enthärtungsanlage"), and the timesheet ("Stundenzettel") are all produced by filling AcroForm fields of PDF templates with [pdf-lib](https://pdf-lib.js.org).

- Templates live in [src/assets/wartungsberichte/](src/assets/wartungsberichte/) and are imported as URL assets.
- Field name maps (`textfields`, `radiogroups`, `checkboxes`) live in [src/assets/wartungsberichte/fillers/](src/assets/wartungsberichte/fillers/), one JSON per report type.
- [src/lib/pdf-lib.js](src/lib/pdf-lib.js) has one `fill{Type}PDF(inputValues, signatureBase64)` function per report type. They read transient form input from the Pinia `inputStore` ([src/stores/inputStore.js](src/stores/inputStore.js)), iterate the fillers JSON, and stamp the signature onto page 1 at hardcoded coordinates.
- `*_Filler.vue` components in [src/components/](src/components/) render the per-type input UI that populates `inputStore.inputData`.
- `addCustomerSignatureToPDF` / `addControlSignatureToPDF` in [src/lib/pdf-lib.js](src/lib/pdf-lib.js) mutate an already-uploaded timesheet PDF to add later signatures.

### Offline job queue (critical for field use)

This app is a PWA used on-site without reliable connectivity, so every mutation goes through an IndexedDB job queue instead of calling Appwrite directly from the view layer.

- [src/lib/offlineQueue.js](src/lib/offlineQueue.js) — IndexedDB store (`offline-queue` DB, `jobs` object store, `keyPath: 'id'`).
- [src/lib/offlineJobProcessor.js](src/lib/offlineJobProcessor.js) — `setupOfflineJobProcessor()` registers a `window 'online'` listener; `processJobs()` drains the queue and dispatches by `job.type`:
  - `stundenzettel` → [executeStundenzettelJob.js](src/lib/executeStundenzettelJob.js)
  - `customer-signature` / `control-signature` / `delete-stundenzettel` → [executeStundenzettelSignatureJob.js](src/lib/executeStundenzettelSignatureJob.js)
  - default → [executeJob.js](src/lib/executeJob.js) (Wartungsbericht: upload PDF → create `wartungsbericht` document → invoke send-email function)
- Both the initial drain and the listener setup happen in [src/main.js](src/main.js) after `registerSW`.
- Processing aborts on the first failure to avoid desyncing the queue while offline.

When adding a new mutation, prefer enqueuing a job with a new `type` and adding a branch to `processJobs`. Jobs typically carry a base64-encoded PDF plus the `inputValues` used to build it so they can be replayed fully offline.

### PWA & caching

[vite.config.js](vite.config.js) configures `vite-plugin-pwa` with three Workbox runtime caches:
- `appwrite-api-cache` (NetworkFirst) — all `*.cloud.appwrite.io` requests.
- `images` (CacheFirst).
- `pdf-templates` (CacheFirst, 90-day expiration) — the 9 report templates under `assets/wartungsberichte/*.pdf`.

[src/lib/cacheUtils.js](src/lib/cacheUtils.js) `preloadPDFTemplates()` fetches every template on startup (when online) so the `pdf-templates` cache is warm for offline use. `canCreateReport()` / `arePDFsCached()` gate report creation when offline — the threshold check is "at least 9 PDFs" so keep the count in sync if templates are added/removed.

### State

Pinia has a single store, [src/stores/inputStore.js](src/stores/inputStore.js), used as scratch space for the currently-open report form. It is not persisted and is cleared on route change. Server state is fetched ad hoc in views via the `databases`/`storage` clients — there is no query/cache layer.

### Path aliases

`@/` → `src/` (configured in both [vite.config.js](vite.config.js) and [jsconfig.json](jsconfig.json)).
