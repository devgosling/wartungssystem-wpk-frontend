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
