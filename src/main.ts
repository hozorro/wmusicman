import { createApp } from 'vue'
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
app.use(router).mount('#app')
