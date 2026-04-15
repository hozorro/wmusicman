<script setup lang="ts">
const menuItems = [
  { title: '颜色工具', path: '/tool/color', exact: true },
  { title: '艺术家封面', path: '/tool/art' },
  { title: '播放列表', path: '/tool/getplaylist' },
  { title: '测试页面', path: '/tool/test' },
]
</script>

<template>
  <div class=" w-full flex p-2">
    <ul class=" w-full border-b border-gray-200">
      <li v-for="item in menuItems" :key="item.title" class=" inline-block mr-2">
        <router-link 
          :to="item.path" 
          class=" w-24 block text-center p-1"
          active-class="active"
          :exact-active-class=" item.exact ? 'active' : ''"
        >{{ item.title }}</router-link>
      </li>
    </ul>
  </div>
  <div class=" w-full mt-2">
    <router-view></router-view>
  </div>
</template>

<style scoped>
.active {
  border-bottom: 2px solid #000;
}
</style>