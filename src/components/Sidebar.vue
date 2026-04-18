<template>
  <div>
    <!-- Mobile Menu Button -->
    <button 
      v-if="isMobile" 
      class="mobile-menu-btn" 
      @click="toggleSidebar"
      :class="{ 'menu-open': sidebarOpen }"
    >
      <i :class="sidebarOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
    </button>

    <!-- Overlay for mobile -->
    <div 
      v-if="isMobile && sidebarOpen" 
      class="sidebar-overlay" 
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <div 
      class="sidebar" 
      :class="{ 
        'mobile-closed': isMobile && !sidebarOpen,
        'mobile-open': isMobile && sidebarOpen 
      }"
    >
      <div class="sidebar-uppr">
        <img src="../assets/Wassertechnik_Schrift.png" alt="" draggable="false" />

        <button
          v-for="(tab, index) in tabs"
          :key="index"
          class="sidebar-tab"
          :data-active="vrouter.currentRoute.path == tab.path ? true : false"
          @click="navigate($event, tab.path)"
        >
          <i :class="tab.icon"></i> 
          <span class="tab-title">{{ tab.title }}</span>
        </button>
      </div>

      <div class="sidebar-lwr">
        <div class="divider-wrapper">
          <div class="divider"></div>
        </div>
        <div class="user-info-card">
          <span class="user-label">Angemeldet als</span>
          <div class="user-details">
            <Avatar
              v-if="username"
              :label="
                username
                  .toString()
                  .split(' ')
                  .map((v, i) => v.split('')[0])
                  .join('')
              "
              style="background-color: var(--p-primary-300);"
              shape="circle"
            />
            <span class="username">{{ username }}</span>
          </div>
          <Button 
            @click="logout" 
            icon="fa-solid fa-arrow-right-from-bracket" 
            size="small" 
            severity="secondary" 
            label="Abmelden"
          ></Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { account } from '@/lib/appwrite'
import router from '@/router'
import { useInputStore } from '@/stores/inputStore'
import { Avatar, Button } from 'primevue'

export default {
  components: {
    Button,
    Avatar,
  },

  data() {
    return {
      vrouter: router,
      tabs: [
        { title: 'Dashboard', icon: 'fa-regular fa-objects-column', path: '/' },
        { title: 'Wartungsberichte', icon: 'fa-regular fa-file-pdf', path: '/wartungsberichte' },
        { title: 'Kundenstammdaten', icon: 'fa-solid fa-user-tie', path: '/customers' },
        { title: 'Mitarbeiter', icon: 'fa-regular fa-users', path: '/employees' },
        { title: 'Stundennachweis', icon: 'fa-regular fa-clock', path: '/stundennachweis' },
        { title: 'Bilderuploads', icon: 'fa-regular fa-images', path: '/bilderuploads' },
      ],
      username: null,
      sidebarOpen: false,
      isMobile: false,
    }
  },

  async mounted() {
    let userAccount = await account.get()
    this.username = userAccount.name
    this.checkMobile()
    window.addEventListener('resize', this.checkMobile)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile)
  },

  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth <= 768
      if (!this.isMobile) {
        this.sidebarOpen = false
      }
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    closeSidebar() {
      this.sidebarOpen = false
    },
    async logout() {
      await account.deleteSession('current')
      this.closeSidebar()
      router.push('/login')
    },
    async navigate(event, path) {
      if (useInputStore().isEditingSomething) {
        this.$confirm.require({
          target: event.currentTarget,
          message:
            'Du erstellt gerade einen Wartungsbericht. Bist du dir sicher, dass du hierin Navigieren möchtest? Dein Fortschritt wird nicht gespeichert.',
          icon: 'fa-regular fa-exclamation-triangle',
          rejectProps: {
            label: 'Abbrechen',
            severity: 'secondary',
            outlined: true,
          },
          acceptProps: {
            label: 'Navigieren',
            severity: 'danger',
          },
          accept: async () => {
            this.closeSidebar()
            router.push(path)
          },
        })
      } else {
        this.closeSidebar()
        router.push(path)
      }
    },
  },
}
</script>

<style lang="scss">
/* Mobile Menu Button */
.mobile-menu-btn {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1001;
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background-color: rgba(14, 102, 255, 0.9);
  color: white;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    background-color: rgba(14, 102, 255, 1);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidebar {
  height: 100dvh;
  width: 100%;
  padding: 2rem 1rem;
  background-color: rgb(221, 240, 255);
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* Desktop Animation */
  @media (min-width: 769px) {
    animation: sidebarPopup 500ms 100ms forwards;
    transform: translateX(-100%);
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    width: 280px;
    max-width: 85vw;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease-in-out;

    &.mobile-closed {
      transform: translateX(-100%);
    }

    &.mobile-open {
      transform: translateX(0);
    }
  }

  &-tab {
    transition: all 0.3s;
    width: 100%;
    font-size: 1rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    background-color: transparent;
    color: rgb(97, 97, 97);
    border: none;
    text-align: left;
    padding: 0.8rem 0.8rem;
    border-radius: 0.6rem;
    display: flex;
    gap: 0.6rem;
    align-items: center;
    cursor: pointer;

    /* Mobile tap target size */
    @media (max-width: 768px) {
      padding: 1rem 0.8rem;
      font-size: 0.95rem;
    }

    i {
      min-width: 1.25rem;
      text-align: center;
    }

    .tab-title {
      flex: 1;
    }
  }

  &-tab.danger {
    background-color: #ef4444;
    color: white;

    &:hover {
      background-color: #c73838;
    }
  }

  &-tab[data-active='false']:hover {
    background-color: rgba(14, 102, 255, 0.079);
  }

  &-tab[data-active='true'] {
    color: white;
    background-color: rgba(14, 102, 255, 0.716);
  }

  img {
    width: 100%;
    margin-bottom: 1rem;

    @media (max-width: 768px) {
      margin-bottom: 0.75rem;
    }
  }

  .p-button {
    width: 100%;
  }

  &-uppr {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    flex: 1;
    padding-bottom: 1rem;

    /* Custom scrollbar for mobile */
    @media (max-width: 768px) {
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background-color: rgba(14, 102, 255, 0.3);
        border-radius: 2px;
      }
    }
  }

  &-lwr {
    display: flex;
    flex-direction: column;

    .divider-wrapper {
      padding: 0.5rem;

      .divider {
        width: 100%;
        background-color: var(--p-surface-300);
        height: 1px;
      }
    }

    .user-info-card {
      background-color: var(--p-surface-200);
      padding: 0.5rem;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;

      .user-label {
        font-size: 0.875rem;
        color: var(--p-surface-600);
      }

      .user-details {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .username {
          font-weight: 500;
          font-size: 1rem;
          color: var(--p-surface-700);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          @media (max-width: 768px) {
            font-size: 0.9rem;
          }
        }
      }
    }
  }
}

@keyframes sidebarPopup {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0%);
  }
}

/* Prevent body scroll when sidebar is open on mobile */
@media (max-width: 768px) {
  body.sidebar-open {
    overflow: hidden;
  }
}
</style>