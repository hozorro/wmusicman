import { createApp, ref } from 'vue'
import { scanState } from '@/composables/key'
import './style.css'
import App from './App.vue'
import router from './router'

const scanned = ref(-1)
function updateScanned(value: number) {
  scanned.value = value
}

const app = createApp(App)

app.directive('default-src', (el: HTMLImageElement, binding) => {
  const defaultSrc = binding.value
  el.onerror =  () => {
    el.src = defaultSrc
    el.onerror = null
  }
})
app.provide(scanState, { scanned: scanned, updateScanned })
app.use(router).mount('#app')
