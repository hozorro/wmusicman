import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const userInfo = ref({})

  return { accessToken, userInfo }
})