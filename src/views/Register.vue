<script setup lang="ts">
import { ref } from "vue";
import { register } from "@/apis/methods/manage";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref('');
const password = ref('');
const is_admin = ref(false);

function handleRegister() {
  register(username.value, password.value, is_admin.value).then(() => { 
    router.push('/login');
  });
}

</script>

<template>
  <div class=" w-full h-svh flex align-middle items-center">
    <div class="w-full h-full flex flex-col items-center justify-center">
      <div class="text-3xl my-3">注册</div>
      <div class="w-1/4 min-w-96">
        <input type="text" v-model="username" class="w-full h-10 p-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500" placeholder="用户"/>
        <input type="password" v-model="password" class="w-full h-10 p-2 mt-4 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500" placeholder="密码"/>
        <input type="checkbox" id="is_admin" v-model="is_admin" class="mt-4"/> <label for="is_admin">管理员</label>
      </div>
      <button class="w-1/4 min-w-96 h-10 mt-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none" @click="handleRegister">注册</button>
    </div>
  </div>
</template>