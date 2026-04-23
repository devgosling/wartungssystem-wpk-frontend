<template>
  <div class="bilderuploads">
    <div class="bilderuploads-header">
      <div class="bilderuploads-header-title">
        <Button
          v-if="currentFolderId"
          icon="fa-regular fa-arrow-left"
          severity="secondary"
          text
          rounded
          @click="goUp"
          aria-label="Zurück"
        />
        <h1>Bilderuploads</h1>
      </div>
      <div class="bilderuploads-header-actions">
        <input
          ref="captureInput"
          type="file"
          accept="image/*"
          capture="environment"
          style="display: none"
          @change="onFilesSelected($event)"
        />
        <input
          ref="uploadInput"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="onFilesSelected($event)"
        />
        <Button
          v-if="currentLevel < 4"
          :label="createButtonLabel"
          icon="fa-regular fa-folder-plus"
          :severity="currentLevel >= 3 ? 'secondary' : 'contrast'"
          :disabled="!currentUserId"
          @click="openCreateDialog"
        />
        <Button
          v-if="currentLevel >= 3"
          label="Foto aufnehmen"
          icon="fa-regular fa-camera"
          severity="secondary"
          :disabled="!currentUserId"
          @click="$refs.captureInput.click()"
        />
        <Button
          v-if="currentLevel >= 3"
          label="Hochladen"
          icon="fa-regular fa-upload"
          severity="contrast"
          :disabled="!currentUserId"
          @click="$refs.uploadInput.click()"
        />
      </div>
    </div>

    <nav v-if="breadcrumb.length > 0" class="bilderuploads-breadcrumb">
      <a class="bilderuploads-breadcrumb-crumb" href="#" @click.prevent="navigateTo(null)">
        <i class="fa-regular fa-folder-tree"></i>
        Ordner
      </a>
      <template v-for="(crumb, idx) in breadcrumb" :key="crumb.$id">
        <i class="fa-regular fa-chevron-right bilderuploads-breadcrumb-sep"></i>
        <a
          class="bilderuploads-breadcrumb-crumb"
          :class="{ 'bilderuploads-breadcrumb-crumb--last': idx === breadcrumb.length - 1 }"
          href="#"
          @click.prevent="navigateTo(crumb.$id)"
        >
          {{ folderDisplayName(crumb) }}
        </a>
      </template>
    </nav>

    <div v-if="loading" class="bilderuploads-loading">
      <ProgressSpinner />
    </div>

    <template v-else>
      <!-- Empty placeholder when nothing in this folder -->
      <div
        v-if="visibleChildren.length === 0 && currentFolderImages.length === 0"
        class="bilderuploads-empty"
      >
        <i class="fa-regular fa-folder-open"></i>
        <h3>{{ emptyFolderMessage }}</h3>
        <p>{{ emptyFolderHint }}</p>
      </div>

      <!-- Folder grid: L0, L1, L2, L3 (never at L4) -->
      <div v-if="currentLevel < 4 && visibleChildren.length > 0">
        <h3 v-if="currentLevel === 3" class="bilderuploads-section-title">Ordner</h3>
        <div class="bilderuploads-folders">
          <Card
            v-for="folder in visibleChildren"
            :key="folder.$id"
            class="bilderuploads-folders-card"
            v-ripple
            @click="navigateTo(folder.$id)"
          >
            <template #content>
              <div class="bilderuploads-folders-card-content">
                <div class="bilderuploads-folders-card-placeholder">
                  <i :class="folderIconClass(folder)"></i>
                  <i
                    v-if="folder.pendingCreate"
                    class="fa-regular fa-cloud-arrow-up bilderuploads-folders-card-pending"
                    v-tooltip.top="'Wird synchronisiert'"
                  ></i>
                </div>
                <div class="bilderuploads-folders-card-meta">
                  <span class="bilderuploads-folders-card-name">
                    {{ folderDisplayName(folder) }}
                  </span>
                  <span class="bilderuploads-folders-card-sub">
                    {{ folderSubtitle(folder) }}
                  </span>
                </div>
                <Button
                  v-if="canDeleteFolderLocal(folder)"
                  icon="fa-regular fa-trash"
                  severity="danger"
                  rounded
                  size="small"
                  class="bilderuploads-folders-card-delete"
                  @click.stop="confirmFolderDelete($event, folder)"
                  aria-label="Ordner löschen"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Image grid: L3 (alongside folders) and L4 -->
      <div
        v-if="currentLevel >= 3 && currentFolderImages.length > 0"
        class="bilderuploads-detail"
      >
        <h3 v-if="currentLevel === 3" class="bilderuploads-section-title">Bilder</h3>
        <div class="bilderuploads-detail-grid">
          <div
            v-for="img in currentFolderImages"
            :key="img.$id"
            class="bilderuploads-detail-grid-tile"
          >
            <img
              :src="thumbUrl(img)"
              alt=""
              draggable="false"
              :title="`${resolveOwnerName(img.owner)} • ${formatUploadDate(img.$createdAt)}`"
              @click="openImage(img)"
            />
            <div class="bilderuploads-detail-grid-tile-caption">
              <i class="fa-regular fa-user"></i>
              <span>{{ resolveOwnerName(img.owner) }}</span>
            </div>
            <Button
              v-if="canDeleteImageLocal(img)"
              icon="fa-regular fa-trash"
              severity="danger"
              rounded
              class="bilderuploads-detail-grid-tile-delete"
              @click="confirmImageDelete($event, img)"
              aria-label="Bild löschen"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Image detail dialog -->
    <Dialog
      v-model:visible="viewingImageOpen"
      maximizable
      modal
      style="width: min(70vw, 900px)"
      @hide="onImageDialogHide"
    >
      <template #header>
        <div v-if="viewingImage" class="bilderuploads-dialog-header">
          <div class="bilderuploads-dialog-header-line">
            <i class="fa-regular fa-calendar"></i>
            <span>{{ formatUploadDate(viewingImage.$createdAt) }}</span>
          </div>
          <div class="bilderuploads-dialog-header-line bilderuploads-dialog-header-sub">
            <i class="fa-regular fa-user"></i>
            <span>{{ resolveOwnerName(viewingImage.owner) }}</span>
          </div>
        </div>
      </template>
      <img
        v-if="viewingImage"
        :src="fullUrl(viewingImage)"
        alt=""
        class="bilderuploads-dialog-img"
      />
      <template #footer>
        <div v-if="viewingImage" class="bilderuploads-dialog-footer">
          <Button
            label="Herunterladen"
            icon="fa-regular fa-download"
            severity="contrast"
            :loading="downloadingImage"
            @click="downloadImage(viewingImage)"
          />
          <Button
            v-if="canDeleteImageLocal(viewingImage)"
            label="Löschen"
            icon="fa-regular fa-trash"
            severity="danger"
            :loading="deletingImage"
            @click="confirmImageDelete($event, viewingImage)"
          />
        </div>
      </template>
    </Dialog>

    <!-- L1/L3 create dialog (name only) -->
    <Dialog
      v-model:visible="createFolderDialog.open"
      modal
      :header="createFolderDialog.header"
      style="width: min(90vw, 420px)"
      @hide="resetCreateFolderDialog"
    >
      <div class="bilderuploads-form">
        <label for="folder-name">Name</label>
        <InputText
          id="folder-name"
          v-model="createFolderDialog.name"
          autofocus
          :placeholder="createFolderDialog.placeholder"
          @keyup.enter="submitCreateFolder"
        />
      </div>
      <template #footer>
        <Button
          label="Abbrechen"
          severity="secondary"
          text
          @click="createFolderDialog.open = false"
        />
        <Button
          label="Erstellen"
          icon="fa-regular fa-check"
          severity="contrast"
          :disabled="!createFolderDialog.name.trim()"
          @click="submitCreateFolder"
        />
      </template>
    </Dialog>

    <!-- L2 create dialog (customer picker) -->
    <Dialog
      v-model:visible="createCustomerFolderDialog.open"
      modal
      header="Kundenordner hinzufügen"
      :style="{ width: 'min(90vw, 520px)' }"
      :contentStyle="{ overflow: 'visible' }"
      @hide="resetCreateCustomerFolderDialog"
    >
      <div class="bilderuploads-form">
        <label for="customer-select">Kunde</label>
        <Select
          id="customer-select"
          v-model="createCustomerFolderDialog.customerId"
          :options="availableCustomersForCurrentFolder"
          optionLabel="name"
          optionValue="$id"
          placeholder="Kunde auswählen"
          filter
          :loading="customersLoading"
          class="bilderuploads-customer-select"
        />
        <small
          v-if="availableCustomersForCurrentFolder.length === 0 && customers.length > 0"
          class="bilderuploads-form-hint"
        >
          Für alle Kunden existiert in diesem Ordner bereits ein Kundenordner.
        </small>
      </div>
      <template #footer>
        <Button
          label="Abbrechen"
          severity="secondary"
          text
          @click="createCustomerFolderDialog.open = false"
        />
        <Button
          label="Hinzufügen"
          icon="fa-regular fa-check"
          severity="contrast"
          :disabled="!createCustomerFolderDialog.customerId"
          @click="submitCreateCustomerFolder"
        />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { Button, Card, Dialog, InputText, ProgressSpinner, Select } from 'primevue'
import { account, databases, functions, storage, teams } from '@/lib/appwrite'
import { AppwriteException, ExecutionMethod, Query } from 'appwrite'
import { resizeImageFile } from '@/lib/imagePreprocess'
import { enqueueJob, removeJob } from '@/lib/offlineQueue'
import { processJobs } from '@/lib/offlineJobProcessor'
import { canDeleteImage, canDeleteFolder } from '@/lib/permissions'
import {
  getAllFolders,
  putFolder,
  replaceAll as replaceAllCached,
  deleteFolder as removeCachedFolder,
} from '@/lib/imageFolderCache'

const ADMIN_TEAM_ID = '68866cde003207e2fbab'

export default {
  components: { Button, Card, Dialog, InputText, ProgressSpinner, Select },

  data() {
    return {
      loading: true,
      folders: [],
      images: [],
      customers: [],
      customersLoading: false,
      userList: { users: [] },
      currentUserId: null,
      isAdmin: false,

      currentFolderId: null,

      viewingImage: null,
      viewingImageOpen: false,
      deletingImage: false,
      downloadingImage: false,

      createFolderDialog: {
        open: false,
        header: '',
        placeholder: '',
        name: '',
        targetLevel: null,
      },

      createCustomerFolderDialog: {
        open: false,
        customerId: null,
      },
    }
  },

  computed: {
    currentFolder() {
      if (!this.currentFolderId) return null
      return this.folders.find((f) => f.$id === this.currentFolderId) ?? null
    },

    currentLevel() {
      return this.currentFolder?.level ?? 0
    },

    visibleChildren() {
      const parentId = this.currentFolderId
      const list = this.folders.filter((f) => {
        if (f.pendingDelete) return false
        return parentId == null ? f.parent == null : f.parent === parentId
      })
      return list.sort((a, b) => this.folderDisplayName(a).localeCompare(this.folderDisplayName(b)))
    },

    breadcrumb() {
      const trail = []
      let f = this.currentFolder
      while (f) {
        trail.unshift(f)
        f = f.parent ? this.folders.find((x) => x.$id === f.parent) : null
      }
      return trail
    },

    currentFolderImages() {
      if (this.currentLevel < 3) return []
      return this.images
        .filter((img) => img.folderId === this.currentFolderId)
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
    },

    createButtonLabel() {
      if (this.currentLevel === 0) return 'Neuer Ordner'
      if (this.currentLevel === 1) return 'Kundenordner hinzufügen'
      if (this.currentLevel === 2) return 'Unterordner'
      if (this.currentLevel === 3) return 'Unterordner'
      return ''
    },

    emptyFolderMessage() {
      if (this.currentLevel === 0) return 'Noch keine Ordner vorhanden'
      if (this.currentLevel === 1) return 'Noch keine Kundenordner in diesem Ordner'
      if (this.currentLevel === 2) return 'Noch keine Unterordner'
      if (this.currentLevel === 3) return 'Noch keine Unterordner oder Bilder'
      return 'Noch keine Bilder in diesem Ordner'
    },

    emptyFolderHint() {
      if (this.currentLevel === 3) {
        return 'Nutze die Buttons oben, um einen Unterordner anzulegen oder Bilder hochzuladen.'
      }
      if (this.currentLevel === 4) {
        return 'Nutze die Buttons oben, um Bilder hinzuzufügen.'
      }
      return 'Nutze den Button oben, um einen Ordner anzulegen.'
    },

    availableCustomersForCurrentFolder() {
      const takenCustomerIds = new Set(
        this.folders
          .filter((f) => f.level === 2 && f.parent === this.currentFolderId)
          .map((f) => f.customerId)
          .filter(Boolean),
      )
      return this.customers.filter((c) => !takenCustomerIds.has(c.$id))
    },
  },

  async mounted() {
    try {
      const user = await account.get()
      this.currentUserId = user.$id
      try {
        const memberships = await teams.listMemberships(ADMIN_TEAM_ID)
        this.isAdmin = memberships.memberships.some((m) => m.userId === user.$id)
      } catch {
        this.isAdmin = false
      }
    } catch (err) {
      console.error('Failed to load current user', err)
    }

    this.folders = await getAllFolders()

    await Promise.all([
      this.refreshFolders(),
      this.refreshImages(),
      this.fetchCustomers(),
      this.fetchUserList(),
    ])
    this.loading = false
  },

  methods: {
    async refreshFolders() {
      if (!navigator.onLine) return
      try {
        const all = []
        let offset = 0
        const pageSize = 100
        while (true) {
          const page = await databases.listDocuments('wartungssystem', 'imagefolder', [
            Query.limit(pageSize),
            Query.offset(offset),
          ])
          all.push(...page.documents)
          if (page.documents.length < pageSize) break
          offset += pageSize
        }
        await replaceAllCached(all)
        this.folders = await getAllFolders()
      } catch (err) {
        console.error('Failed to fetch folders', err)
      }
    },

    async refreshImages() {
      if (!navigator.onLine) return
      try {
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
      } catch (err) {
        console.error('Failed to fetch images', err)
      }
    },

    async fetchCustomers() {
      this.customersLoading = true
      try {
        const res = await databases.listDocuments('wartungssystem', 'customer', [
          Query.orderAsc('name'),
          Query.limit(200),
        ])
        this.customers = res.documents
      } catch (err) {
        console.error('Failed to fetch customers', err)
        this.customers = []
      } finally {
        this.customersLoading = false
      }
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
      if (!ownerId) return 'Unbekannt'
      const user = (this.userList.users || []).find((u) => u.$id === ownerId)
      if (user?.name) return user.name
      return `Unbekannt (${ownerId.slice(0, 6)})`
    },

    navigateTo(id) {
      this.currentFolderId = id
    },

    goUp() {
      const current = this.currentFolder
      this.currentFolderId = current?.parent ?? null
    },

    folderDisplayName(folder) {
      if (!folder) return ''
      if (folder.level === 2) {
        const customer = this.customers.find((c) => c.$id === folder.customerId)
        return customer?.name || folder.name || 'Unbekannter Kunde'
      }
      return folder.name || '(Ohne Namen)'
    },

    folderSubtitle(folder) {
      const childCount = this.folders.filter(
        (f) => f.parent === folder.$id && !f.pendingDelete,
      ).length
      const imageCount = this.images.filter((img) => img.folderId === folder.$id).length
      if (folder.level === 4) {
        return imageCount === 1 ? '1 Bild' : `${imageCount} Bilder`
      }
      if (folder.level === 3) {
        const parts = []
        if (childCount > 0) parts.push(childCount === 1 ? '1 Ordner' : `${childCount} Ordner`)
        if (imageCount > 0) parts.push(imageCount === 1 ? '1 Bild' : `${imageCount} Bilder`)
        return parts.length > 0 ? parts.join(' · ') : 'Leer'
      }
      return childCount === 1 ? '1 Eintrag' : `${childCount} Einträge`
    },

    folderIconClass(folder) {
      if (folder.level === 1) return 'fa-regular fa-folder'
      if (folder.level === 2) return 'fa-regular fa-user'
      if (folder.level === 3) return 'fa-regular fa-folder-tree'
      return 'fa-regular fa-folder-image'
    },

    openCreateDialog() {
      if (this.currentLevel === 1) {
        this.createCustomerFolderDialog.open = true
        return
      }
      if (this.currentLevel === 0) {
        this.createFolderDialog.header = 'Neuer Ordner'
        this.createFolderDialog.placeholder = 'z. B. 2026 oder Archiv'
        this.createFolderDialog.targetLevel = 1
      } else if (this.currentLevel === 2) {
        this.createFolderDialog.header = 'Neuer Unterordner'
        this.createFolderDialog.placeholder = 'z. B. Anlage 1'
        this.createFolderDialog.targetLevel = 3
      } else if (this.currentLevel === 3) {
        this.createFolderDialog.header = 'Neuer Unterordner'
        this.createFolderDialog.placeholder = 'z. B. Wartung Januar'
        this.createFolderDialog.targetLevel = 4
      } else {
        return
      }
      this.createFolderDialog.name = ''
      this.createFolderDialog.open = true
    },

    async submitCreateFolder() {
      const name = this.createFolderDialog.name.trim()
      if (!name) return
      const level = this.createFolderDialog.targetLevel
      const parent = level === 1 ? null : this.currentFolderId
      await this.createFolder({ name, level, parent, customerId: null })
      this.createFolderDialog.open = false
    },

    async submitCreateCustomerFolder() {
      const customerId = this.createCustomerFolderDialog.customerId
      if (!customerId) return
      const customer = this.customers.find((c) => c.$id === customerId)
      const name = customer?.name || 'Kunde'
      await this.createFolder({ name, level: 2, parent: this.currentFolderId, customerId })
      this.createCustomerFolderDialog.open = false
    },

    async createFolder({ name, level, parent, customerId }) {
      const $id = crypto.randomUUID()
      const folder = {
        $id,
        name,
        level,
        parent: parent ?? null,
        customerId: customerId ?? null,
        createdBy: this.currentUserId,
        pendingCreate: true,
      }

      this.folders = [...this.folders, folder]
      await putFolder(folder)

      await enqueueJob({
        id: `folder-create-${$id}`,
        type: 'folder-create',
        $id,
        name,
        level,
        parent: parent ?? null,
        customerId: customerId ?? null,
        createdBy: this.currentUserId,
      })

      if (navigator.onLine) {
        try {
          await processJobs()
          const idx = this.folders.findIndex((f) => f.$id === $id)
          if (idx >= 0) {
            const updated = { ...this.folders[idx] }
            delete updated.pendingCreate
            this.folders.splice(idx, 1, updated)
          }
        } catch (err) {
          console.error('Folder create sync failed', err)
        }
      } else {
        this.$toast?.add({
          severity: 'info',
          summary: 'Offline',
          detail: 'Ordner wird erstellt, sobald wieder eine Verbindung besteht.',
          life: 3500,
        })
      }
    },

    resetCreateFolderDialog() {
      this.createFolderDialog.name = ''
      this.createFolderDialog.targetLevel = null
    },

    resetCreateCustomerFolderDialog() {
      this.createCustomerFolderDialog.customerId = null
    },

    canDeleteFolderLocal(folder) {
      return canDeleteFolder(folder, this.currentUserId, this.isAdmin)
    },

    canDeleteImageLocal(img) {
      return canDeleteImage(img, this.currentUserId, this.isAdmin)
    },

    confirmFolderDelete(event, folder) {
      const hasChildren = this.folders.some(
        (f) => f.parent === folder.$id && !f.pendingDelete,
      )
      const hasImages =
        folder.level >= 3 && this.images.some((img) => img.folderId === folder.$id)
      if (hasChildren || hasImages) {
        this.$toast?.add({
          severity: 'warn',
          summary: 'Ordner nicht leer',
          detail: 'Bitte erst den Inhalt des Ordners entfernen.',
          life: 4000,
        })
        return
      }

      this.$confirm.require({
        target: event.currentTarget,
        message: 'Ordner wirklich löschen?',
        icon: 'fa-regular fa-exclamation-triangle',
        rejectProps: { label: 'Abbrechen', severity: 'secondary', outlined: true },
        acceptProps: { label: 'Löschen', severity: 'danger' },
        accept: () => this.deleteFolder(folder),
      })
    },

    async deleteFolder(folder) {
      if (folder.pendingCreate) {
        // Never synced — drop the create job and remove locally.
        try {
          await removeJob(`folder-create-${folder.$id}`)
        } catch {
          // ignore
        }
        await removeCachedFolder(folder.$id)
        this.folders = this.folders.filter((f) => f.$id !== folder.$id)
        return
      }

      const idx = this.folders.findIndex((f) => f.$id === folder.$id)
      if (idx >= 0) {
        const updated = { ...this.folders[idx], pendingDelete: true }
        this.folders.splice(idx, 1, updated)
        await putFolder(updated)
      }

      await enqueueJob({
        id: `folder-delete-${folder.$id}`,
        type: 'folder-delete',
        $id: folder.$id,
      })

      if (navigator.onLine) {
        try {
          await processJobs()
          this.folders = this.folders.filter((f) => f.$id !== folder.$id)
        } catch (err) {
          console.error('Folder delete sync failed', err)
          this.$toast?.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Der Ordner konnte nicht gelöscht werden.',
            life: 4000,
          })
          const i = this.folders.findIndex((f) => f.$id === folder.$id)
          if (i >= 0) {
            const reverted = { ...this.folders[i] }
            delete reverted.pendingDelete
            this.folders.splice(i, 1, reverted)
            await putFolder(reverted)
          }
        }
      } else {
        this.$toast?.add({
          severity: 'info',
          summary: 'Offline',
          detail: 'Ordner wird gelöscht, sobald wieder eine Verbindung besteht.',
          life: 3500,
        })
      }
    },

    async onFilesSelected(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (files.length === 0) return
      if (!this.currentUserId) return
      if (this.currentLevel < 3) return

      const folderId = this.currentFolderId

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          this.$toast?.add({
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
            folderId,
            filename,
            imageBase64: base64,
          })
        } catch (err) {
          console.error('Image preprocess failed', err)
          this.$toast?.add({
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
      await this.refreshImages()
    },

    thumbUrl(img) {
      return storage.getFileView('storage', img.associatedFile)
    },

    fullUrl(img) {
      return storage.getFileView('storage', img.associatedFile)
    },

    formatUploadDate(iso) {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    openImage(img) {
      this.viewingImage = img
      this.viewingImageOpen = true
    },

    onImageDialogHide() {
      this.viewingImage = null
    },

    async downloadImage(img) {
      this.downloadingImage = true
      try {
        const url = storage.getFileDownload('storage', img.associatedFile)
        const fileMeta = await storage.getFile('storage', img.associatedFile)
        const jwt = (await account.createJWT()).jwt
        const res = await fetch(url, { headers: { 'x-appwrite-jwt': jwt } })
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileMeta.name
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(blobUrl)
      } catch (err) {
        console.error('Download failed', err)
        this.$toast?.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Das Bild konnte nicht heruntergeladen werden.',
          life: 5000,
        })
      } finally {
        this.downloadingImage = false
      }
    },

    confirmImageDelete(event, img) {
      this.$confirm.require({
        target: event.currentTarget,
        message: 'Bild wirklich löschen?',
        icon: 'fa-regular fa-exclamation-triangle',
        rejectProps: { label: 'Abbrechen', severity: 'secondary', outlined: true },
        acceptProps: { label: 'Löschen', severity: 'danger' },
        accept: async () => {
          this.deletingImage = true
          try {
            if (navigator.onLine) {
              await storage.deleteFile('storage', img.associatedFile)
              await databases.deleteDocument('wartungssystem', 'imageupload', img.$id)
            } else {
              await enqueueJob({
                id: crypto.randomUUID(),
                type: 'image-delete',
                documentId: img.$id,
                fileId: img.associatedFile,
              })
              this.$toast?.add({
                severity: 'info',
                summary: 'Offline',
                detail: 'Das Bild wird gelöscht, sobald wieder eine Verbindung besteht.',
                life: 4000,
              })
            }
            this.viewingImageOpen = false
          } catch (err) {
            console.error('Delete failed', err)
            if (err instanceof AppwriteException && err.code === 401) {
              this.$toast?.add({
                severity: 'error',
                summary: 'Keine Berechtigungen',
                detail: 'Du bist nicht dazu berechtigt, dieses Bild zu löschen.',
                life: 5000,
              })
            } else if (err instanceof AppwriteException && err.code === 404) {
              this.$toast?.add({
                severity: 'error',
                summary: 'Nicht gefunden',
                detail: 'Das Bild wurde nicht gefunden.',
                life: 5000,
              })
            } else {
              this.$toast?.add({
                severity: 'error',
                summary: 'Fehler',
                detail: 'Das Bild konnte nicht gelöscht werden.',
                life: 5000,
              })
            }
          } finally {
            this.deletingImage = false
            await this.refreshImages()
          }
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.bilderuploads {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    &-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      h1 {
        margin: 0;
      }
    }

    &-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  }

  &-breadcrumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--p-surface-50, #f8fafc);
    font-size: 0.9rem;

    &-crumb {
      color: var(--p-primary-600, #2563eb);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;

      &:hover {
        text-decoration: underline;
      }

      &--last {
        color: var(--p-text-color, #0f172a);
        font-weight: 600;
        pointer-events: none;

        &:hover {
          text-decoration: none;
        }
      }
    }

    &-sep {
      color: var(--p-surface-400, #94a3b8);
      font-size: 0.75rem;
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
    color: var(--p-surface-500, #64748b);
    text-align: center;

    i {
      font-size: 3rem;
    }

    h3 {
      margin: 0.5rem 0 0;
    }
  }

  &-folders {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));

    &-card {
      cursor: pointer;
      transition: transform 0.15s;
      position: relative;

      &:hover {
        transform: translateY(-2px);
      }

      &-content {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        position: relative;
      }

      &-placeholder {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: var(--p-surface-400, #94a3b8);
        background-color: var(--p-surface-100, #f1f5f9);
        border-radius: 0.5rem;
      }

      &-pending {
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        font-size: 1rem;
        color: var(--p-primary-500, #3b82f6);
        background: #fff;
        border-radius: 999px;
        padding: 0.3rem;
      }

      &-meta {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }

      &-name {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &-sub {
        font-size: 0.825rem;
        color: var(--p-surface-600, #475569);
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

.bilderuploads-section-title {
  margin: 1rem 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--p-surface-600, #475569);
  text-transform: uppercase;
  letter-spacing: 0.03em;
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
      background-color: var(--p-surface-100, #f1f5f9);

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

      &-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.5rem;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
        color: #fff;
        font-size: 0.75rem;
        pointer-events: none;

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}

.bilderuploads-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;

  label {
    font-weight: 600;
    font-size: 0.875rem;
  }
}

.bilderuploads-customer-select {
  width: 100%;
}

.bilderuploads-form-hint {
  color: var(--p-surface-500, #64748b);
  font-size: 0.8rem;
}

.bilderuploads-dialog-header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 1rem;
  font-weight: 500;

  &-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &-sub {
    color: var(--p-surface-600, #475569);
    font-weight: 400;
    font-size: 0.875rem;
  }
}

.bilderuploads-dialog-img {
  width: 100%;
  max-height: 75vh;
  object-fit: contain;
  display: block;
}

.bilderuploads-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
