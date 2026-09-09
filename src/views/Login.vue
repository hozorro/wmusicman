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

  if (result) {
    const redirect = route.query.redirect as string
    const targetPath = redirect || '/'
    router.push(targetPath)
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <div class="login-logo">
        <div class="mark">
          <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
            <path d="M216.76,38.52a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,76.67V155.1A36,36,0,1,0,88,184V84.1l112-28v71A36,36,0,1,0,216,152V44A8,8,0,0,0,216.76,38.52Z"/>
          </svg>
        </div>
        <div>
          <div class="name">WMusic Manager</div>
          <div class="ver">音乐库管理系统</div>
        </div>
      </div>
      <h1>欢迎回来</h1>
      <p class="lead">登录以管理你的音乐库</p>
      <div class="login-form">
        <div class="input-group">
          <label>用户名</label>
          <input class="input" type="text" v-model="username" placeholder="请输入用户名" @keypress.enter.prevent="handleLogin"/>
        </div>
        <div class="input-group">
          <label>密码</label>
          <input class="input" type="password" v-model="password" placeholder="请输入密码" @keypress.enter.prevent="handleLogin"/>
        </div>
        <p v-if="authStore.loginErrors?.form" class="text-bad text-[12.5px]">{{ authStore.loginErrors.form }}</p>
        <button class="btn btn-primary login-btn" @click="handleLogin">登 录</button>
      </div>
      <div class="login-foot">
        首次使用？<router-link to="/register">初始化系统</router-link>
      </div>
    </div>
  </div>
</template>
