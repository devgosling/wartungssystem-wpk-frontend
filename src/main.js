import './assets/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { palette, updatePrimaryPalette } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import * as DE from './assets/de.json'
import { registerSW } from 'virtual:pwa-register'
import { setupOfflineJobProcessor, processJobs } from './lib/offlineJobProcessor'
import { preloadPDFTemplates } from './lib/cacheUtils'
import * as pdfjs from 'pdfjs-dist/build/pdf' // KEEP - Builder
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs' // KEEP - Worker COPY

import App from './App.vue'
import router from './router'
import { ConfirmationService, Ripple, Tooltip } from 'primevue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-darkmode',
    },
  },
  locale: DE.de,
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('ripple', Ripple)
app.directive('tooltip', Tooltip)

updatePrimaryPalette(palette('#5ebae6')) //OLD: #6bd0ff

app.mount('#app')

registerSW({
  onRegistered(r) {
    console.log('SW registered: ', r)
  },
  onRegisterError(error) {
    console.error('SW registration error: ', error)
  },
  onNeedRefresh() {
    console.log('SW needs refresh')
  },
  onOfflineReady() {
    console.log('SW offline ready')
  },
})

setupOfflineJobProcessor()

if (navigator.onLine) {
  processJobs()
  // Preload PDF templates for offline use
  preloadPDFTemplates()
}
