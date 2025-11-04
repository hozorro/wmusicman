<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useForm } from 'alova/client';
import { login } from '@/apis/methods/manage'

const router = useRouter()
const { 
  form, 
  send: Login, 
  onSuccess
} = useForm(
  formData => login(formData.username, formData.password),
  {
    initialForm: {
      username: '',
      password: ''
    }
  }
);
onSuccess(() => {
  router.push('/')
})
</script>

<template>
  <div class=" w-full h-svh flex align-middle items-center">
    <div class="w-full h-full flex flex-col items-center justify-center">
      <div class="text-3xl my-3">登录</div>
      <div class="w-1/4 min-w-96 flex flex-col">
        <input type="text" v-model="form.username" class="w-full h-10 p-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500" placeholder="用户"/>
        <input type="password" v-model="form.password" class="w-full h-10 p-2 mt-4 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500" placeholder="密码"/>
      </div>
      <button class="w-1/4 min-w-96 h-10 mt-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none" @click="Login">登录</button>
    </div>
  </div>
</template>