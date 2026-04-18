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
          <img :src="fullUrl(slotProps.item)" alt="" style="max-width: 100%; max-height: 100vh" />
        </template>
      </Galleria>
    </div>
  </div>
</template>

<script>
import { Button, Card, Galleria, ProgressSpinner } from 'primevue'
import { account, databases, functions, storage, teams } from '@/lib/appwrite'
import { ExecutionMethod, Query } from 'appwrite'
import { resizeImageFile } from '@/lib/imagePreprocess'
import { enqueueJob } from '@/lib/offlineQueue'
import { processJobs } from '@/lib/offlineJobProcessor'
import { canDeleteImage } from '@/lib/permissions'

export default {
  components: { Button, Card, Galleria, ProgressSpinner },

  data() {
    return {
      loading: true,
      images: [],
      userList: { users: [] },
      currentUserId: null,
      selectedOwnerId: null,
      isAdmin: false,
      lightboxVisible: false,
      lightboxIndex: 0,
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
  },

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

    resolveOwnerName(ownerId) {
      const user = (this.userList.users || []).find((u) => u.$id === ownerId)
      if (user?.name) return user.name
      return `Unbekannt (${ownerId.slice(0, 6)})`
    },

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
</style>
