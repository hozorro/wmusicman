<script setup lang="ts">
</script>

<template>
  <div class=" w-full flex p-2">
    <router-link to="/tool/color" class=" w-24 block text-center p-1">颜色工具</router-link>
    <router-link to="/tool/test" class=" w-24 block text-center p-1">测试页面</router-link>
  </div>
  <div class=" w-full mt-2">
    <router-view></router-view>
  </div>
</template>