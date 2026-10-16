<script setup lang="ts">
const menuItems = [
  { title: '检测歌曲', path: '/tool/checktrack', exact: true },
  { title: '颜色工具', path: '/tool/color' },
  { title: '艺术家封面', path: '/tool/art' },
  { title: '播放列表', path: '/tool/getplaylist' },
  { title: '测试页面', path: '/tool/test' },
  
]
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in h-full">
    <div class="flex flex-none flex-wrap gap-2">
      <router-link
        v-for="item in menuItems"
        :key="item.title"
        :to="item.path"
        class="chip !text-[13px] no-underline"
        active-class="chip-on"
        :exact-active-class="item.exact ? 'chip-on' : ''"
      >{{ item.title }}</router-link>
    </div>
    <router-view></router-view>
  </div>
</template>
