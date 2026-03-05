<script setup lang="ts">
import  { onMounted } from 'vue'
import { useSystemStore } from './store/system';
import { useRouter } from 'vue-router';

const systemStore = useSystemStore();
const router = useRouter();

onMounted(async () => {
  await systemStore.checkInit()
  if (!systemStore.isInitialized) {
    router.push('/admin/register')
  }
})
</script>

<template>
  <div v-if="systemStore.isLoading" class=" mx-auto mt-20 text-xl w-1/2 text-center">
    Checking system status...
  </div>
  <div v-else-if="systemStore.checkError" class=" mx-auto mt-20 text-xl w-1/2 text-center text-red-500">
    Failed to check system status, try again later.
  </div>
  <div v-else class=" flex w-full relative">
    <router-view />
  </div>
</template>