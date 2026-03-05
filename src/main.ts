import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { scanState, scanInfo, updateScanInfo, initScanState } from '@/composables/key'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.directive('default-src', (el: HTMLImageElement, binding) => {
  const defaultSrc = binding.value
  el.onerror =  () => {
    el.src = defaultSrc
    el.onerror = null
  }
})
app.provide(scanState, { scanInfo, updateScanInfo, initScanState })

const pinia = createPinia()
app.use(router).use(pinia).mount('#app')
