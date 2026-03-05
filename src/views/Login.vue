<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth';

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  const result = await authStore.login(username.value, password.value)

  if (result.success) {
    const redirect = route.query.redirect as string
    const targetPath = redirect || '/'
    router.push(targetPath)
  } else {
    errorMsg.value = result.message
  }
}
</script>

<template>
  <div class=" w-full h-svh flex align-middle items-center">
    <div class="w-full h-full flex flex-col items-center justify-center">
      <div class="text-3xl my-3">登录</div>
      <div class="w-1/4 min-w-96 flex flex-col">
        <input type="text" v-model="username" class="w-full h-10 p-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500" placeholder="用户"/>
        <input type="password" v-model="password" class="w-full h-10 p-2 mt-4 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500" placeholder="密码"/>
      </div>
      <button class="w-1/4 min-w-96 h-10 mt-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none" @click="handleLogin" @keypress.enter.prevent="handleLogin">登录</button>
      <p v-if="errorMsg" class=" mt-2 text-sm text-red-400">{{ errorMsg }} </p>
    </div>
  </div>
</template>