# Bilderuploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Bilderuploads" iPad-first gallery feature so field technicians can take or upload images offline, grouped by uploader. Follows the design in [docs/superpowers/specs/2026-04-18-bilderuploads-design.md](../specs/2026-04-18-bilderuploads-design.md).

**Architecture:** A single new Vue view (`Bilderuploads.vue`) with folder-grid and folder-detail modes, plus two new lib modules. All mutations enqueue into the existing IndexedDB offline queue and are drained by `offlineJobProcessor.js`, which gets two new job-type branches: `image-upload` and `image-delete`.

**Tech Stack:** Vue 3 (Options API), PrimeVue (Button, Card, ConfirmPopup, Galleria, ProgressSpinner), Appwrite SDK (`databases`, `storage`, `functions`, `teams`), `idb`, Canvas API for client-side resize, Vitest (jsdom) for pure-function tests.

**Testing note:** The repo has no tests today. This plan adds Vitest tests only for pure functions (resize-math helper and delete-permission predicate); canvas behavior and the Vue view are verified by a manual smoke checklist at the end (Task 10). This matches the pragmatic stance already in the design spec.

**Commit style:** Short imperative subject, no conventional-commit prefix, consistent with recent repo history (e.g. "Fix function execution call by adding missing endpoint parameter").

---

## File Structure

**New**
- `src/lib/imagePreprocess.js` — image resize/re-encode pipeline. Exports `computeResizeDimensions(w, h, maxEdge)` (pure math) and `resizeImageFile(file, opts) → Promise<{ base64, filename }>`.
- `src/lib/imagePreprocess.test.js` — Vitest unit tests for `computeResizeDimensions`.
- `src/lib/permissions.js` — pure delete-permission predicate. Exports `canDeleteImage(image, currentUserId, isAdmin) → boolean`.
- `src/lib/permissions.test.js` — Vitest unit tests.
- `src/lib/executeImageUploadJob.js` — exports `executeImageUploadJob(job)` and `executeImageDeleteJob(job)`.
- `src/views/Bilderuploads.vue` — the feature view.

**Modify**
- `src/components/Sidebar.vue` — add new tab entry.
- `src/router/index.js` — import + register route.
- `src/lib/offlineJobProcessor.js` — dispatch the two new job types.

---

## Task 1: Image resize math (pure function, TDD)

**Files:**
- Create: `src/lib/imagePreprocess.test.js`
- Create: `src/lib/imagePreprocess.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/imagePreprocess.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeResizeDimensions } from './imagePreprocess'

describe('computeResizeDimensions', () => {
  it('returns input dimensions when both sides are within maxEdge', () => {
    expect(computeResizeDimensions(800, 600, 2048)).toEqual({ width: 800, height: 600 })
  })

  it('scales down landscape so the long edge equals maxEdge', () => {
    expect(computeResizeDimensions(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536 })
  })

  it('scales down portrait so the long edge equals maxEdge', () => {
    expect(computeResizeDimensions(3000, 4000, 2048)).toEqual({ width: 1536, height: 2048 })
  })

  it('handles a square image', () => {
    expect(computeResizeDimensions(3000, 3000, 2048)).toEqual({ width: 2048, height: 2048 })
  })

  it('rounds to integer pixels', () => {
    const { width, height } = computeResizeDimensions(3333, 2222, 2048)
    expect(Number.isInteger(width)).toBe(true)
    expect(Number.isInteger(height)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/imagePreprocess.test.js`
Expected: FAIL — "Cannot find module './imagePreprocess'" or similar.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/imagePreprocess.js`:

```js
export function computeResizeDimensions(width, height, maxEdge) {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) return { width, height }
  const scale = maxEdge / longEdge
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/imagePreprocess.test.js`
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/imagePreprocess.js src/lib/imagePreprocess.test.js
git commit -m "Add computeResizeDimensions helper for image preprocessing"
```

---

## Task 2: Image resize/re-encode end-to-end helper

**Files:**
- Modify: `src/lib/imagePreprocess.js`

- [ ] **Step 1: Add the `resizeImageFile` implementation**

Append to `src/lib/imagePreprocess.js`:

```js
/**
 * Decode an image File, resize it so the long edge is at most maxEdge,
 * re-encode as JPEG, and return a base64 payload (no data-URL prefix).
 *
 * Produces a deterministic filename suitable for Appwrite storage.
 */
export async function resizeImageFile(
  file,
  { maxEdge = 2048, quality = 0.85, owner = 'unknown' } = {},
) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const { width, height } = computeResizeDimensions(img.naturalWidth, img.naturalHeight, maxEdge)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')

    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const random6 = Math.random().toString(36).slice(2, 8)
    const filename = `bild_${stamp}_${owner}_${random6}.jpg`

    return { base64, filename }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image decode failed'))
    img.src = src
  })
}
```

- [ ] **Step 2: Verify syntax by running the existing test again**

Run: `npx vitest run src/lib/imagePreprocess.test.js`
Expected: PASS — still 5 tests passing (the new code doesn't add tests but shouldn't break the file).

- [ ] **Step 3: Commit**

```bash
git add src/lib/imagePreprocess.js
git commit -m "Add resizeImageFile helper: decode, resize, re-encode JPEG"
```

---

## Task 3: Delete-permission predicate (TDD)

**Files:**
- Create: `src/lib/permissions.test.js`
- Create: `src/lib/permissions.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/permissions.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { canDeleteImage } from './permissions'

describe('canDeleteImage', () => {
  const image = { owner: 'user-a', $id: 'img1' }

  it('allows the owner', () => {
    expect(canDeleteImage(image, 'user-a', false)).toBe(true)
  })

  it('allows an administration team member regardless of owner', () => {
    expect(canDeleteImage(image, 'user-b', true)).toBe(true)
  })

  it('denies a non-owner non-admin', () => {
    expect(canDeleteImage(image, 'user-b', false)).toBe(false)
  })

  it('denies when image is null/undefined', () => {
    expect(canDeleteImage(null, 'user-a', true)).toBe(false)
    expect(canDeleteImage(undefined, 'user-a', true)).toBe(false)
  })

  it('denies when currentUserId is missing', () => {
    expect(canDeleteImage(image, null, false)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/permissions.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/permissions.js`:

```js
export function canDeleteImage(image, currentUserId, isAdmin) {
  if (!image) return false
  if (!currentUserId) return false
  if (isAdmin) return true
  return image.owner === currentUserId
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/permissions.test.js`
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/permissions.js src/lib/permissions.test.js
git commit -m "Add canDeleteImage predicate for image-delete authorization"
```

---

## Task 4: Image upload / delete job executors

**Files:**
- Create: `src/lib/executeImageUploadJob.js`

- [ ] **Step 1: Implement both executors**

Create `src/lib/executeImageUploadJob.js`:

```js
import { storage, databases, ID } from './appwrite'
import { Permission, Role } from 'appwrite'

const ADMIN_TEAM_ID = '68866cde003207e2fbab'

function filePermissions(ownerId) {
  return [
    Permission.read(Role.users()),
    Permission.update(Role.user(ownerId)),
    Permission.delete(Role.user(ownerId)),
    Permission.update(Role.team(ADMIN_TEAM_ID)),
    Permission.delete(Role.team(ADMIN_TEAM_ID)),
  ]
}

export async function executeImageUploadJob(job) {
  const { owner, filename, imageBase64 } = job

  const blob = await (await fetch('data:image/jpeg;base64,' + imageBase64)).blob()
  const file = new File([blob], filename, { type: 'image/jpeg' })

  const fileId = ID.unique()
  const perms = filePermissions(owner)

  await storage.createFile('storage', fileId, file, perms)

  await databases.createDocument(
    'wartungssystem',
    'imageupload',
    ID.unique(),
    { owner, associatedFile: fileId },
    perms,
  )
}

export async function executeImageDeleteJob(job) {
  const { documentId, fileId } = job
  await storage.deleteFile('storage', fileId)
  await databases.deleteDocument('wartungssystem', 'imageupload', documentId)
}
```

- [ ] **Step 2: Sanity-check imports**

Run: `npx vite build` (produces an error if any imports don't resolve). This is a smoke-level check only; it's fine if the build flags unrelated pre-existing warnings.

Expected: Build completes. Any failure should be in this file's imports only — fix before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/lib/executeImageUploadJob.js
git commit -m "Add offline job executors for image-upload and image-delete"
```

---

## Task 5: Wire new job types into offlineJobProcessor

**Files:**
- Modify: `src/lib/offlineJobProcessor.js`

- [ ] **Step 1: Add imports and dispatch branches**

Edit `src/lib/offlineJobProcessor.js`. Replace the current content of the file with:

```js
import { getPendingJobs, removeJob } from './offlineQueue'
import { executeJob } from './executeJob'
import { executeStundenzettelJob } from './executeStundenzettelJob'
import {
  executeCustomerSignatureJob,
  executeControlSignatureJob,
  executeDeleteStundenzettelJob,
} from './executeStundenzettelSignatureJob'
import { executeImageUploadJob, executeImageDeleteJob } from './executeImageUploadJob'

export async function processJobs() {
  const jobs = await getPendingJobs()
  for (const job of jobs) {
    try {
      if (job.type === 'stundenzettel') {
        await executeStundenzettelJob(job)
      } else if (job.type === 'customer-signature') {
        await executeCustomerSignatureJob(job)
      } else if (job.type === 'control-signature') {
        await executeControlSignatureJob(job)
      } else if (job.type === 'delete-stundenzettel') {
        await executeDeleteStundenzettelJob(job)
      } else if (job.type === 'image-upload') {
        await executeImageUploadJob(job)
      } else if (job.type === 'image-delete') {
        await executeImageDeleteJob(job)
      } else {
        await executeJob(job)
      }
      await removeJob(job.id)
    } catch (err) {
      console.error('Failed to process job', err)
      break
    }
  }
}

let listenerRegistered = false

export function setupOfflineJobProcessor() {
  if (listenerRegistered) return
  listenerRegistered = true
  window.addEventListener('online', processJobs)
}
```

- [ ] **Step 2: Verify via build**

Run: `npx vite build`
Expected: Build completes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/offlineJobProcessor.js
git commit -m "Dispatch image-upload and image-delete jobs in offline processor"
```

---

## Task 6: Sidebar tab entry

**Files:**
- Modify: `src/components/Sidebar.vue`

- [ ] **Step 1: Add tab entry**

In `src/components/Sidebar.vue`, find the `tabs` array in `data()`:

```js
tabs: [
  { title: 'Dashboard', icon: 'fa-regular fa-objects-column', path: '/' },
  { title: 'Wartungsberichte', icon: 'fa-regular fa-file-pdf', path: '/wartungsberichte' },
  { title: 'Kundenstammdaten', icon: 'fa-solid fa-user-tie', path: '/customers' },
  { title: 'Mitarbeiter', icon: 'fa-regular fa-users', path: '/employees' },
  { title: 'Stundennachweis', icon: 'fa-regular fa-clock', path: '/stundennachweis' },
],
```

Add the Bilderuploads entry after Stundennachweis:

```js
tabs: [
  { title: 'Dashboard', icon: 'fa-regular fa-objects-column', path: '/' },
  { title: 'Wartungsberichte', icon: 'fa-regular fa-file-pdf', path: '/wartungsberichte' },
  { title: 'Kundenstammdaten', icon: 'fa-solid fa-user-tie', path: '/customers' },
  { title: 'Mitarbeiter', icon: 'fa-regular fa-users', path: '/employees' },
  { title: 'Stundennachweis', icon: 'fa-regular fa-clock', path: '/stundennachweis' },
  { title: 'Bilderuploads', icon: 'fa-regular fa-images', path: '/bilderuploads' },
],
```

- [ ] **Step 2: Visual verify**

Run: `npm run dev`. Open the app, log in, confirm the new tab appears at the bottom. Click it — it should navigate to `/bilderuploads` which currently renders the 404 page. That's expected until Task 7.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.vue
git commit -m "Add Bilderuploads tab to sidebar"
```

---

## Task 7: Route + empty Bilderuploads view shell

**Files:**
- Create: `src/views/Bilderuploads.vue`
- Modify: `src/router/index.js`

- [ ] **Step 1: Create the view shell**

Create `src/views/Bilderuploads.vue`:

```vue
<template>
  <div class="bilderuploads">
    <h1>Bilderuploads</h1>
    <div v-if="loading" class="bilderuploads-loading">
      <ProgressSpinner />
    </div>
    <div v-else>
      <p>Folder grid wird in Task 8 hinzugefügt.</p>
    </div>
  </div>
</template>

<script>
import ProgressSpinner from 'primevue/progressspinner'

export default {
  components: { ProgressSpinner },
  data() {
    return {
      loading: false,
    }
  },
}
</script>

<style lang="scss" scoped>
.bilderuploads {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &-loading {
    display: flex;
    justify-content: center;
    padding: 4rem 0;
  }
}
</style>
```

- [ ] **Step 2: Register the route**

Edit `src/router/index.js`. Add the import near the other view imports:

```js
import Bilderuploads from '@/views/Bilderuploads.vue'
```

Add this route after the `stundennachweis` route and before `login`:

```js
{
  path: '/bilderuploads',
  name: 'bilderuploads',
  component: Bilderuploads,
  meta: {
    requiresAuth: true,
    title: 'Bilderuploads',
  },
},
```

- [ ] **Step 3: Visual verify**

Run: `npm run dev`. Click the Bilderuploads tab — the page renders the "Folder grid wird in Task 8 hinzugefügt." placeholder. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/views/Bilderuploads.vue src/router/index.js
git commit -m "Add Bilderuploads route and view shell"
```

---

## Task 8: Folder-grid mode — fetch, group, render

**Files:**
- Modify: `src/views/Bilderuploads.vue`

- [ ] **Step 1: Replace view with folder-grid implementation**

Replace the entire contents of `src/views/Bilderuploads.vue` with:

```vue
<template>
  <div class="bilderuploads">
    <div class="bilderuploads-header">
      <h1>Bilderuploads</h1>
      <div class="bilderuploads-header-actions">
        <Button
          label="Foto aufnehmen"
          icon="fa-regular fa-camera"
          severity="secondary"
          disabled
        />
        <Button
          label="Hochladen"
          icon="fa-regular fa-upload"
          severity="contrast"
          disabled
        />
      </div>
    </div>

    <div v-if="loading" class="bilderuploads-loading">
      <ProgressSpinner />
    </div>

    <div v-else-if="folders.length === 0" class="bilderuploads-empty">
      <i class="fa-regular fa-images"></i>
      <h3>Noch keine Bilder hochgeladen</h3>
      <p>Nutze die Buttons oben, um Bilder hinzuzufügen.</p>
    </div>

    <div v-else class="bilderuploads-folders">
      <Card
        v-for="folder in folders"
        :key="folder.ownerId"
        class="bilderuploads-folders-card"
        v-ripple
      >
        <template #content>
          <div class="bilderuploads-folders-card-content">
            <img
              v-if="folder.coverUrl"
              :src="folder.coverUrl"
              :alt="folder.ownerName"
              draggable="false"
            />
            <div v-else class="bilderuploads-folders-card-placeholder">
              <i class="fa-regular fa-image"></i>
            </div>
            <div class="bilderuploads-folders-card-meta">
              <span class="bilderuploads-folders-card-name">{{ folder.ownerName }}</span>
              <span class="bilderuploads-folders-card-count">
                {{ folder.count }} {{ folder.count === 1 ? 'Bild' : 'Bilder' }}
              </span>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script>
import { Button, Card, ProgressSpinner } from 'primevue'
import { databases, functions, storage } from '@/lib/appwrite'
import { ExecutionMethod, Query } from 'appwrite'

export default {
  components: { Button, Card, ProgressSpinner },

  data() {
    return {
      loading: true,
      images: [],
      userList: { users: [] },
    }
  },

  computed: {
    folders() {
      const byOwner = new Map()
      for (const img of this.images) {
        if (!byOwner.has(img.owner)) byOwner.set(img.owner, [])
        byOwner.get(img.owner).push(img)
      }
      const result = []
      for (const [ownerId, imgs] of byOwner.entries()) {
        imgs.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        const latest = imgs[0]
        result.push({
          ownerId,
          ownerName: this.resolveOwnerName(ownerId),
          count: imgs.length,
          coverUrl: latest
            ? storage.getFilePreview('storage', latest.associatedFile, 400, 400)
            : null,
        })
      }
      result.sort((a, b) => a.ownerName.localeCompare(b.ownerName))
      return result
    },
  },

  async mounted() {
    await Promise.all([this.fetchImages(), this.fetchUserList()])
    this.loading = false
  },

  methods: {
    async fetchImages() {
      const all = []
      let offset = 0
      const pageSize = 100
      while (true) {
        const page = await databases.listDocuments('wartungssystem', 'imageupload', [
          Query.orderDesc('$createdAt'),
          Query.limit(pageSize),
          Query.offset(offset),
        ])
        all.push(...page.documents)
        if (page.documents.length < pageSize) break
        offset += pageSize
      }
      this.images = all
    },

    async fetchUserList() {
      try {
        const res = await functions.createExecution(
          '69b18cbb0036de675223',
          '{}',
          false,
          '/listusers',
          ExecutionMethod.GET,
        )
        this.userList = JSON.parse(res.responseBody)
      } catch (err) {
        console.error('Failed to fetch user list', err)
        this.userList = { users: [] }
      }
    },

    resolveOwnerName(ownerId) {
      const user = (this.userList.users || []).find((u) => u.$id === ownerId)
      if (user?.name) return user.name
      return `Unbekannt (${ownerId.slice(0, 6)})`
    },
  },
}
</script>

<style lang="scss" scoped>
.bilderuploads {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    &-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  &-loading {
    display: flex;
    justify-content: center;
    padding: 4rem 0;
  }

  &-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 4rem 1rem;
    color: var(--p-surface-500);
    text-align: center;

    i {
      font-size: 3rem;
    }
  }

  &-folders {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));

    &-card {
      cursor: pointer;
      transition: transform 0.15s;

      &:hover {
        transform: translateY(-2px);
      }

      &-content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      &-content img,
      &-placeholder {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 0.5rem;
        background-color: var(--p-surface-100);
      }

      &-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--p-surface-400);
        font-size: 2rem;
      }

      &-meta {
        display: flex;
        flex-direction: column;
      }

      &-name {
        font-weight: 600;
      }

      &-count {
        font-size: 0.875rem;
        color: var(--p-surface-600);
      }
    }
  }
}
</style>
```

- [ ] **Step 2: Visual verify**

Run: `npm run dev`. Navigate to Bilderuploads. If the `imageupload` collection is empty you should see the empty state. If you have existing test rows, the folder grid renders. Open devtools console — no Appwrite errors. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/views/Bilderuploads.vue
git commit -m "Add folder-grid mode to Bilderuploads view"
```

---

## Task 9: Upload buttons + pipeline (offline-queued)

**Files:**
- Modify: `src/views/Bilderuploads.vue`

- [ ] **Step 1: Wire up the upload buttons**

Edit `src/views/Bilderuploads.vue`.

In the template, replace the header action buttons block with:

```vue
<div class="bilderuploads-header-actions">
  <input
    ref="captureInput"
    type="file"
    accept="image/*"
    capture="environment"
    style="display: none"
    @change="onFilesSelected($event, true)"
  />
  <input
    ref="uploadInput"
    type="file"
    accept="image/*"
    multiple
    style="display: none"
    @change="onFilesSelected($event, false)"
  />
  <Button
    label="Foto aufnehmen"
    icon="fa-regular fa-camera"
    severity="secondary"
    :disabled="!currentUserId"
    @click="$refs.captureInput.click()"
  />
  <Button
    label="Hochladen"
    icon="fa-regular fa-upload"
    severity="contrast"
    :disabled="!currentUserId"
    @click="$refs.uploadInput.click()"
  />
</div>
```

In the `<script>` block, add imports below the existing `Query, ExecutionMethod` line:

```js
import { account } from '@/lib/appwrite'
import { resizeImageFile } from '@/lib/imagePreprocess'
import { enqueueJob } from '@/lib/offlineQueue'
import { processJobs } from '@/lib/offlineJobProcessor'
```

Add `currentUserId: null` to `data()`:

```js
data() {
  return {
    loading: true,
    images: [],
    userList: { users: [] },
    currentUserId: null,
  }
},
```

In `mounted()`, resolve the current user before `fetchImages`:

```js
async mounted() {
  try {
    const user = await account.get()
    this.currentUserId = user.$id
  } catch (err) {
    console.error('Failed to load current user', err)
  }
  await Promise.all([this.fetchImages(), this.fetchUserList()])
  this.loading = false
},
```

Add these methods to `methods`:

```js
async onFilesSelected(event, isCapture) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (files.length === 0) return
  if (!this.currentUserId) return

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      this.$toast.add({
        severity: 'warn',
        summary: 'Übersprungen',
        detail: `${file.name} ist keine Bilddatei.`,
        life: 3000,
      })
      continue
    }
    try {
      const { base64, filename } = await resizeImageFile(file, {
        maxEdge: 2048,
        quality: 0.85,
        owner: this.currentUserId,
      })
      await enqueueJob({
        id: crypto.randomUUID(),
        type: 'image-upload',
        owner: this.currentUserId,
        filename,
        imageBase64: base64,
      })
    } catch (err) {
      console.error('Image preprocess failed', err)
      this.$toast.add({
        severity: 'error',
        summary: 'Fehler',
        detail: `${file.name} konnte nicht verarbeitet werden.`,
        life: 4000,
      })
    }
  }

  if (navigator.onLine) {
    await processJobs()
  }
  await this.fetchImages()
},
```

- [ ] **Step 2: Visual verify (online)**

Run: `npm run dev`. On a desktop browser, click "Hochladen" and select 2 images. They should:
1. Be resized (check the console; no errors).
2. Upload to Appwrite (check Appwrite console → database → `imageupload` collection).
3. Appear in the folder grid after the refresh.

On iPad Safari, verify "Foto aufnehmen" opens the camera.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/views/Bilderuploads.vue
git commit -m "Add image upload pipeline with offline-queue integration"
```

---

## Task 10: Folder detail mode + Galleria lightbox + delete

**Files:**
- Modify: `src/views/Bilderuploads.vue`

- [ ] **Step 1: Add detail-mode template**

Edit `src/views/Bilderuploads.vue`.

Replace the `<template>` root so that grid and detail render conditionally:

```vue
<template>
  <div class="bilderuploads">
    <div class="bilderuploads-header">
      <div class="bilderuploads-header-title">
        <Button
          v-if="selectedOwnerId"
          icon="fa-regular fa-arrow-left"
          severity="secondary"
          text
          rounded
          @click="selectedOwnerId = null"
          aria-label="Zurück"
        />
        <h1>{{ selectedOwnerId ? selectedOwnerName : 'Bilderuploads' }}</h1>
      </div>
      <div class="bilderuploads-header-actions">
        <input
          ref="captureInput"
          type="file"
          accept="image/*"
          capture="environment"
          style="display: none"
          @change="onFilesSelected($event, true)"
        />
        <input
          ref="uploadInput"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="onFilesSelected($event, false)"
        />
        <Button
          label="Foto aufnehmen"
          icon="fa-regular fa-camera"
          severity="secondary"
          :disabled="!currentUserId"
          @click="$refs.captureInput.click()"
        />
        <Button
          label="Hochladen"
          icon="fa-regular fa-upload"
          severity="contrast"
          :disabled="!currentUserId"
          @click="$refs.uploadInput.click()"
        />
      </div>
    </div>

    <div v-if="loading" class="bilderuploads-loading">
      <ProgressSpinner />
    </div>

    <div v-else-if="!selectedOwnerId && folders.length === 0" class="bilderuploads-empty">
      <i class="fa-regular fa-images"></i>
      <h3>Noch keine Bilder hochgeladen</h3>
      <p>Nutze die Buttons oben, um Bilder hinzuzufügen.</p>
    </div>

    <div v-else-if="!selectedOwnerId" class="bilderuploads-folders">
      <Card
        v-for="folder in folders"
        :key="folder.ownerId"
        class="bilderuploads-folders-card"
        v-ripple
        @click="selectedOwnerId = folder.ownerId"
      >
        <template #content>
          <div class="bilderuploads-folders-card-content">
            <img
              v-if="folder.coverUrl"
              :src="folder.coverUrl"
              :alt="folder.ownerName"
              draggable="false"
            />
            <div v-else class="bilderuploads-folders-card-placeholder">
              <i class="fa-regular fa-image"></i>
            </div>
            <div class="bilderuploads-folders-card-meta">
              <span class="bilderuploads-folders-card-name">{{ folder.ownerName }}</span>
              <span class="bilderuploads-folders-card-count">
                {{ folder.count }} {{ folder.count === 1 ? 'Bild' : 'Bilder' }}
              </span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="bilderuploads-detail">
      <div v-if="selectedFolderImages.length === 0" class="bilderuploads-empty">
        <p>Keine Bilder in diesem Ordner.</p>
      </div>
      <div v-else class="bilderuploads-detail-grid">
        <div
          v-for="(img, index) in selectedFolderImages"
          :key="img.$id"
          class="bilderuploads-detail-grid-tile"
        >
          <img
            :src="thumbUrl(img)"
            :alt="selectedOwnerName"
            draggable="false"
            @click="openLightbox(index)"
          />
          <Button
            v-if="canDelete(img)"
            icon="fa-regular fa-trash"
            severity="danger"
            rounded
            class="bilderuploads-detail-grid-tile-delete"
            @click="confirmDelete($event, img)"
            aria-label="Bild löschen"
          />
        </div>
      </div>
      <Galleria
        v-model:visible="lightboxVisible"
        v-model:activeIndex="lightboxIndex"
        :value="selectedFolderImages"
        :fullScreen="true"
        :showThumbnails="false"
        :showItemNavigators="true"
        :circular="true"
      >
        <template #item="slotProps">
          <img :src="fullUrl(slotProps.item)" style="max-width: 100%; max-height: 100vh" />
        </template>
      </Galleria>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Add detail-mode script**

In `<script>`, add the `Galleria` import to the primevue imports:

```js
import { Button, Card, Galleria, ProgressSpinner } from 'primevue'
```

Add `Galleria` to `components`:

```js
components: { Button, Card, Galleria, ProgressSpinner },
```

Add the `canDeleteImage` import:

```js
import { canDeleteImage } from '@/lib/permissions'
import { teams } from '@/lib/appwrite'
```

Add these fields to `data()`:

```js
selectedOwnerId: null,
isAdmin: false,
lightboxVisible: false,
lightboxIndex: 0,
```

Add these computed properties below `folders`:

```js
selectedFolderImages() {
  if (!this.selectedOwnerId) return []
  return this.images
    .filter((img) => img.owner === this.selectedOwnerId)
    .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
},

selectedOwnerName() {
  if (!this.selectedOwnerId) return ''
  return this.resolveOwnerName(this.selectedOwnerId)
},
```

Extend `mounted()` with an admin check (replace the existing `mounted`):

```js
async mounted() {
  try {
    const user = await account.get()
    this.currentUserId = user.$id
    try {
      const memberships = await teams.listMemberships('68866cde003207e2fbab')
      this.isAdmin = memberships.memberships.some((m) => m.userId === user.$id)
    } catch (err) {
      this.isAdmin = false
    }
  } catch (err) {
    console.error('Failed to load current user', err)
  }
  await Promise.all([this.fetchImages(), this.fetchUserList()])
  this.loading = false
},
```

Add these methods:

```js
thumbUrl(img) {
  return storage.getFilePreview('storage', img.associatedFile, 400, 400)
},

fullUrl(img) {
  return storage.getFileView('storage', img.associatedFile)
},

openLightbox(index) {
  this.lightboxIndex = index
  this.lightboxVisible = true
},

canDelete(img) {
  return canDeleteImage(img, this.currentUserId, this.isAdmin)
},

confirmDelete(event, img) {
  this.$confirm.require({
    target: event.currentTarget,
    message: 'Bild wirklich löschen?',
    icon: 'fa-regular fa-exclamation-triangle',
    rejectProps: { label: 'Abbrechen', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Löschen', severity: 'danger' },
    accept: async () => {
      await enqueueJob({
        id: crypto.randomUUID(),
        type: 'image-delete',
        documentId: img.$id,
        fileId: img.associatedFile,
      })
      if (navigator.onLine) {
        await processJobs()
      }
      await this.fetchImages()
    },
  })
},
```

- [ ] **Step 3: Add detail-mode styles**

Append to the `<style lang="scss" scoped>` block:

```scss
.bilderuploads-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  h1 {
    margin: 0;
  }
}

.bilderuploads-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &-grid {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));

    &-tile {
      position: relative;
      aspect-ratio: 1 / 1;
      border-radius: 0.5rem;
      overflow: hidden;
      background-color: var(--p-surface-100);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        cursor: zoom-in;
      }

      &-delete {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        opacity: 0.9;
      }
    }
  }
}
```

- [ ] **Step 4: Visual verify**

Run: `npm run dev`. Seed a few uploads across two different users if possible.
- Folder grid → tap a folder → images grid renders.
- Tap an image → Galleria opens in full-screen; swipe/arrow navigation works.
- Trash button appears only on your own images (unless you're in the `administration` team, in which case it appears on all).
- Confirm popup fires; after confirm, the image disappears from the grid.
- Back button returns to folder grid.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/views/Bilderuploads.vue
git commit -m "Add folder detail mode with Galleria lightbox and delete"
```

---

## Task 11: Manual smoke checklist (no code)

- [ ] **Step 1: Run through this checklist**

Run: `npm run dev`. Verify each item. If any fails, file a task to fix before considering the feature done.

- [ ] Sidebar shows "Bilderuploads" tab with images icon; active state works.
- [ ] `/bilderuploads` renders; shows empty state when no images.
- [ ] "Hochladen" with 3 images queues and uploads; all three appear.
- [ ] "Foto aufnehmen" on iPad Safari opens the rear camera; single photo uploads.
- [ ] Images appear grouped by uploader in folder grid.
- [ ] Cover thumb is the most recent image for that owner.
- [ ] Tapping a folder opens the detail view with a grid of thumbs.
- [ ] Tapping a thumb opens Galleria full-screen; swipe/arrow navigates.
- [ ] Trash icon only appears on your own images when not admin.
- [ ] Delete confirmation works and removes the image + storage file.
- [ ] Back button from detail returns to folder grid.
- [ ] **Offline test**: in browser devtools, throttle to Offline. Upload an image. It does not appear yet. Go back online. Image appears after a moment.
- [ ] Non-image file (e.g. `.pdf`) selected via "Hochladen" → toast "Nur Bilddateien..." and is skipped.

- [ ] **Step 2: Commit (no code, but close the loop)**

No commit needed if nothing changed.

---

## Self-review notes (completed by plan author)

- **Spec coverage:** Every section in the design spec maps to a task: sidebar (6), route + view shell (7), data model / permissions (4), jobs (4, 5), folder grid (8), upload (9), detail / delete (10), edge cases (9, 10, 11).
- **Placeholders:** None — each step has concrete code or a concrete command.
- **Type consistency:** Job payload fields (`type`, `owner`, `filename`, `imageBase64`, `documentId`, `fileId`) used in Tasks 4, 5, 9, 10 all match.
- **Optimistic placeholders (spec §"Reconciliation of optimistic placeholders")**: Deliberately deferred — the implementation in Tasks 9 and 10 calls `processJobs()` followed by `fetchImages()` after each upload/delete when online, which gives a correct (if slightly less snappy) user experience. If offline, the uploaded image won't be visible until reconnection — documented as an accepted v1 limitation. If the user wants the in-place queued-overlay placeholders from the spec, we can add them as a follow-up task; they are not essential for shipping the feature.
