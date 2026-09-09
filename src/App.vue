<script setup lang="ts">
import  { onMounted } from 'vue'
import { useSystemStore } from './store/system';
import { useRouter } from 'vue-router';

const systemStore = useSystemStore();
const router = useRouter();

onMounted(async () => {
  await systemStore.checkInit()
  if (!systemStore.isInitialized && !systemStore.checkError) {
    // System not initialized and check succeeded → go to register
    router.push('/register')
  }
})
</script>

<template>
  <div v-if="systemStore.isLoading" class="login-view">
    <div class="state-box">
      <div class="ico animate-soft-pulse">
        <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor" style="color: var(--color-accent)">
          <path d="M216.76,38.52a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,76.67V155.1A36,36,0,1,0,88,184V84.1l112-28v71A36,36,0,1,0,216,152V44A8,8,0,0,0,216.76,38.52Z"/>
        </svg>
      </div>
      <b>Checking system status...</b>
    </div>
  </div>
  <div v-else-if="systemStore.checkError" class="login-view">
    <div class="state-box">
      <div class="ico">
        <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor" style="color: var(--color-bad)">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/>
        </svg>
      </div>
      <b>Failed to check system status</b>
      <span>Try again later.</span>
    </div>
  </div>
  <div v-else class=" flex w-full h-full relative">
    <router-view />
  </div>
</template>