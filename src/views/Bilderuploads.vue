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
