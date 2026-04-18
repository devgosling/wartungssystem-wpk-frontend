# Bilderuploads — Design

**Date:** 2026-04-18
**Status:** Approved (design phase) — ready for implementation plan

## Summary

Add an image upload / gallery feature to the wartungssystem-frontend PWA. Field technicians on iPad can take a photo (camera) or upload existing files. Images land in a shared gallery grouped by uploader ("folder per user"). Everyone can view everyone's images; only the uploader or an `administration` team member can delete. All mutations queue through the existing offline IndexedDB job pipeline so photos taken without signal replay on reconnect.

## Non-goals

- No captions, tags, annotations, albums, sharing links, favoriting, or search.
- No EXIF/GPS preservation or display.
- No per-image permissions in the UI (beyond the delete rule); any authenticated user sees all images.
- No attachment of images to specific Wartungsberichte / Stundenzettel (the `associatedFile` column is strictly the storage-file FK; see Data Model).
- No server-side processing — resizing is client-side only.

## User-facing behavior

### Sidebar

New entry in [src/components/Sidebar.vue](src/components/Sidebar.vue) `tabs` array, placed after `Stundennachweis`:

```js
{ title: 'Bilderuploads', icon: 'fa-regular fa-images', path: '/bilderuploads' }
```

### Route

In [src/router/index.js](src/router/index.js):

```js
{
  path: '/bilderuploads',
  name: 'bilderuploads',
  component: BilderuploadsView,
  meta: { requiresAuth: true, title: 'Bilderuploads' },
}
```

No team gate — every authenticated user can see and upload.

### View: folder grid (default mode)

On mount, fetch all `imageupload` documents (paginated if >100) sorted `orderDesc('$createdAt')`. Group client-side by `owner`. Also fetch the user directory via the existing `/listusers` endpoint on function `69b18cbb0036de675223` (same call already used in [src/views/HomeView.vue](src/views/HomeView.vue) `getUserList()`) to resolve owner `$id` → display name. Cache the user list in a component-scoped ref for the session.

Render a responsive card grid (1-col mobile, 2-col tablet, 3–4-col desktop — follows patterns seen in [src/views/HomeView.vue](src/views/HomeView.vue)). Each card:

- Cover thumb: `storage.getFilePreview('storage', latestFileId, 400, 400)` of the owner's most recent image.
- Owner display name (from user list; fall back to "Unbekannt" if the owner no longer exists in the users API).
- Count badge: "N Bilder" / "1 Bild".
- Tap → sets `selectedOwnerId` (reactive local state) to enter the folder detail mode. No route change — back button inside the view returns to grid.

An always-visible upload bar sits above the grid with two buttons (see Upload). The current user's own folder appears at the top if they have any images.

Empty state: friendly placeholder ("Noch keine Bilder hochgeladen") with the upload buttons as the primary CTA.

### View: folder detail mode

When `selectedOwnerId` is set:

- Breadcrumb / back button: "← Alle Bilderuploads" / owner name.
- Grid of thumbs for that owner's images, sorted `$createdAt` desc. Thumbs use `getFilePreview(..., 400, 400)`.
- Tap → PrimeVue `Galleria` in full-screen preview mode with swipe navigation; full image uses `getFileView(...)`.
- Trash icon overlay on each thumb, rendered only when:
  - `image.owner === currentUser.$id`, OR
  - `currentUser` is a member of the `administration` team (ID `68866cde003207e2fbab`, already known by the router guard — fetch once on view mount and keep in local state).
- Delete flow: PrimeVue `ConfirmPopup` (app-wide `$confirm.require`) → enqueue an `image-delete` job.

### Upload (two buttons)

Rendered in the folder-grid header and the folder-detail header.

- **"Foto aufnehmen"** — `<input type="file" accept="image/*" capture="environment">` (single shot, hidden, triggered by button).
- **"Hochladen"** — `<input type="file" accept="image/*" multiple>` (multi-select from library/files).

Both dispatch to the same `handleFiles(fileList)` pipeline.

### Upload pipeline (client-side)

For each `File`:

1. Validate MIME starts with `image/`; skip and toast on others.
2. Decode into an `HTMLImageElement` (via `URL.createObjectURL` then `<img>`). This handles HEIC on Safari/iOS, which supports native decode; other browsers show a toast if decode fails.
3. Resize on an offscreen `<canvas>`: max long edge 2048 px, preserving aspect. Skip resize if both dimensions already ≤ 2048.
4. `canvas.toDataURL('image/jpeg', 0.85)` → strip the data-URL prefix → base64 payload.
5. Generate a filename: `bild_${yyyyMMdd-HHmmss}_${owner}_${random6}.jpg`.
6. Enqueue an `image-upload` job (see Jobs).
7. Optimistic UI: immediately insert a local-only image record with `{ localId, ownedBy: currentUser.$id, pendingBase64 }` so the thumb appears with a "⏳ Wird hochgeladen" overlay. Once the job completes, the next document refresh replaces the placeholder with the real record (match by `localId` → remove placeholder when a document with matching `localId`… see Jobs / reconciliation below).

### Reconciliation of optimistic placeholders

Placeholders live only in the view's local reactive state. The offline job processor doesn't currently emit events per job, so to avoid over-engineering, the simplest viable approach:

- After `processJobs()` is triggered (either by mount-time online or the `online` listener), the view re-runs its document fetch.
- A placeholder is removed if its `localId` is no longer in the queue (`offlineQueue.getPendingJobs()`).
- This means an uploaded image's placeholder disappears once the job has been drained; the real document then appears in the normal `listDocuments` result.

Trade-off: a ~1-second flicker is possible between placeholder removal and refresh. Acceptable for v1; a real event bus on the job processor can be added later if needed.

## Data model

### Collection: `imageupload` (already created in Appwrite console)

| Column          | Type   | Required | Purpose                                                     |
| --------------- | ------ | -------- | ----------------------------------------------------------- |
| `owner`         | text   | yes      | Uploader's Appwrite account `$id`                           |
| `associatedFile`| text   | yes      | Appwrite storage file `$id` (FK into the `storage` bucket)  |

`$id`, `$createdAt`, `$updatedAt` are provided by Appwrite. Row-level security is enabled. Table permissions: `users` role → Create+Read; `administration` team → full CRUD.

### Storage: existing `storage` bucket

Reuse, per user decision. Caveats to verify before implementation:

- Bucket must allow `jpg`/`jpeg` MIME/extension. (If it currently allows only `pdf`, the user must extend the allowed file types in the Appwrite console.)
- Bucket max file size must be ≥ ~3 MB to cover the worst-case resized image.
- Per-file permissions on upload:
  - `Permission.read(Role.users())` — any signed-in user can view.
  - `Permission.delete(Role.user(ownerId))` and `Permission.update(Role.user(ownerId))` — uploader can delete their own file.
  - `Permission.delete(Role.team('68866cde003207e2fbab'))` and `Permission.update(...)` — administration team can delete any.

## Jobs (offline queue integration)

Two new job types added to [src/lib/offlineJobProcessor.js](src/lib/offlineJobProcessor.js)'s dispatcher:

### `image-upload`

New file: [src/lib/executeImageUploadJob.js](src/lib/executeImageUploadJob.js).

Payload:

```js
{
  id: <uuid>,               // offlineQueue keyPath
  type: 'image-upload',
  localId: <uuid>,          // for optimistic-placeholder reconciliation
  owner: <userId>,
  filename: <string>,
  imageBase64: <string>,    // JPEG, no data-URL prefix
}
```

Steps:

1. Rehydrate blob from base64, wrap as `File(name=filename, type='image/jpeg')`.
2. `const fileId = ID.unique()`.
3. `storage.createFile('storage', fileId, file, [permissions])` with the per-file permissions listed above.
4. `databases.createDocument('wartungssystem', 'imageupload', ID.unique(), { owner, associatedFile: fileId }, [permissions])`.
   Per-row permissions (required because table permissions only grant `users` role Create+Read, and row security is enabled):
   - `Permission.read(Role.users())`
   - `Permission.update(Role.user(ownerId))` / `Permission.delete(Role.user(ownerId))`
   - `Permission.update(Role.team('68866cde003207e2fbab'))` / `Permission.delete(Role.team('68866cde003207e2fbab'))`

### `image-delete`

Added as additional exported function in the same file (or a new file — follow the pattern of `executeStundenzettelSignatureJob.js`, which bundles related ops).

Payload: `{ type: 'image-delete', documentId, fileId }`.

Steps:
1. `storage.deleteFile('storage', fileId)`.
2. `databases.deleteDocument('wartungssystem', 'imageupload', documentId)`.

Both register in the `processJobs()` type switch.

## Files to add / edit

**New**
- [src/views/Bilderuploads.vue](src/views/Bilderuploads.vue) — the view (folder + detail modes, upload buttons, delete handlers, optimistic state).
- [src/lib/executeImageUploadJob.js](src/lib/executeImageUploadJob.js) — exports `executeImageUploadJob` and `executeImageDeleteJob`.
- [src/lib/imagePreprocess.js](src/lib/imagePreprocess.js) — `resizeImageFile(file, { maxEdge: 2048, quality: 0.85 }) → { base64, filename }`. Pure, synchronous-feeling helper; unit-testable.

**Edit**
- [src/components/Sidebar.vue](src/components/Sidebar.vue) — add the tab entry.
- [src/router/index.js](src/router/index.js) — add the route + import.
- [src/lib/offlineJobProcessor.js](src/lib/offlineJobProcessor.js) — two new branches in the `type` switch; imports.

## Edge cases & error handling

- **Non-image selection** — MIME filter; toast "Nur Bilddateien werden unterstützt.".
- **Decode failure** (e.g., HEIC on non-Safari browsers) — toast "Diese Bilddatei kann nicht verarbeitet werden."; skip.
- **Resize oversize output** (unlikely after `maxEdge=2048, q=0.85`) — accept as-is.
- **Offline upload** — job sits in IndexedDB; placeholder stays visible with the "wird hochgeladen" overlay until `online` event drains the queue.
- **Missing owner in user list** — render the owner card with fallback name "Unbekannt" and the `$id` truncated to 6 chars in a muted subtitle, so admins can still identify.
- **Admin list fetch failure** — default `isAdmin = false`; uploader-only delete still works.
- **Partial job failure** (file uploaded, document create fails) — current queue semantics: the job throws, `processJobs()` breaks, the file stays in storage without a document. Acceptable trade-off for v1 — matches the existing pattern in [src/lib/executeJob.js](src/lib/executeJob.js) which has the same property. A reconciliation script is out of scope.

## Testing

- Unit: [src/lib/imagePreprocess.js](src/lib/imagePreprocess.js) — Vitest + jsdom. Feed a synthetic `File`, assert output dimensions ≤ 2048 and MIME `image/jpeg`. Use a mock `HTMLCanvasElement` if `toDataURL` isn't stubbed by jsdom; if too flaky in jsdom, skip and rely on manual verification.
- Unit: delete-permission predicate (pure function given `(image, currentUserId, isAdmin) → boolean`).
- Manual: on iPad Safari, verify "Foto aufnehmen" opens the camera and "Hochladen" opens the file picker with multi-select. Verify offline → take photo → come online → image uploads and appears in the folder.

## Open items for the user to confirm before implementation

1. Storage bucket `storage` currently allows image types and file size ≥ 3 MB (or will be updated accordingly in the Appwrite console).
2. The `/listusers` function endpoint returns every user who might upload images (not just a subset) — otherwise owner resolution falls back to "Unbekannt" more often than expected.
