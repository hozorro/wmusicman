import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { scanState, scanInfo, updateScanInfo, initScanState, artworkState, artworkInfo, updateArtworkInfo, initArtworkState } from '@/composables/key'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.directive('default-src', (el: HTMLImageElement, binding) => {
  const defaultSrc = binding.value
  if (!defaultSrc) return
  el.onerror =  () => {
    el.src = defaultSrc
    el.onerror = null
  }
})
app.provide(scanState, { scanInfo, updateScanInfo, initScanState })
app.provide(artworkState, { artworkInfo, updateArtworkInfo, initArtworkState })

const pinia = createPinia()
app.use(router).use(pinia).mount('#app')
