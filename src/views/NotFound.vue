<script setup lang="ts">
</script>

<template>
  <div class="login-view">
    <div class="state-box">
      <div class="ico">
        <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor" style="color: var(--color-ink-3)">
          <path d="M229.66,218.34,184,172.7a92.1,92.1,0,1,0-11.31,11.31l45.63,45.64a8,8,0,0,0,11.32-11.32ZM40,116a76,76,0,1,1,76,76A76.08,76.08,0,0,1,40,116Z"/>
        </svg>
      </div>
      <b>404 Not Found</b>
      <span>请求的页面不存在</span>
      <router-link to="/" class="btn btn-primary mt-3">返回首页</router-link>
    </div>
  </div>
</template>
