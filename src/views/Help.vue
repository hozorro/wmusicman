<script setup lang="ts">
import { ref, computed } from 'vue'

// Static FAQ content (display only)
const faqs = [
  {
    q: '0. 部署设置',
    a: '在 .env 设置 baseUrl，staticUrl 和 apiUrl。'
  },
  {
    q: '1. Edit（编辑）概述',
    a: '音乐库的文件层次结构是：root->country->startchar->artist->album->track。音乐文件的编辑修改涉及到文件的重命名、移动、删除、编辑tag等。其中编辑tag又基于上述文件层次结构涉及文件的移动方式。另外watcher原始的onmove只针对文件重命名。因此，基于上述条件和要求，各种修改所对应的操作方法和效果说明如下。'
  },
  {
    q: '1.1 文件重命名',
    a: '前端无直接修改文件名的功能（实际也无必要），如要修改，可直接在后台操作系统中修改文件名，此时，watcher会监测到onmove，并自动scan，Track记录的path发生变化。不会删除原纪录添加新纪录。'
  },
  {
    q: '1.2 文件移动',
    a: '前端无直接移动文件的功能（实际也无必要），如要移动，如果先删除，后添加，则watcher会会先监测ondelete，由scanner执行remove_file，再监测oncreate，由scanner执行scan_file，此时添加的是新的记录，这个track的id会发生变化。\n为了保证文件id不变，需要以真正的移动模式，方法是在前端打开move_mode,解除对delete的触发，只记录文件名，当触发oncreate时，判断是否有这个文件名，如有则为move【本来想用hash标识文件的，但delete触发后文件已不存在，无法hash，只有文件路径信息还在】，同时还解除对modified的触发，这样可避免多次scan，只在oncreate时一次性scan。'
  },
  {
    q: '1.3 文件删除',
    a: '前端无直接删除文件功能（实际也无必要），如要删除，可直接在操作系统中删除文件，此时watcher会监测到ondelete，由scanner执行remove_file。'
  },
  {
    q: '1.4 文件添加',
    a: '前端通过upload页面上传，然后在transfer页面先进行扫描，然后编辑标签，最后按国别进行转移，国别下层对应目录会自动创建或分配。'
  },
  {
    q: '1.5 文件 tag 编辑',
    a: '前端通过edit页面进行tag编辑，这有两种情况：\n1）一种是title、genre、year等tag，不涉及文件目录的改变，直接修改文件，watcher会监测到onmodify，由scanner执行scan_file。\n2）另一种artist、album这两个tag的修改，涉及文件目录变化，需要现在前端开启move_mode，然后再进行修改，如果后台确定执行文件移动，watcher监测和scanner操作机制同上所属文件移动。'
  },
  {
    q: '1.6 上传或修改 cover',
    a: '包括对artist的face和portrait的修改或上传，对album的cover的修改或上传。\n1）album的cover会直接上传到album所在目录，collection专辑会的目录会直接在artist的根目录下。\n2）由于对于多artist的track，只会根据第一个artist创建artist目录，因此有些只参与合唱但又不是artist标签中第一个artist的，将没有对应的artist根目录，也就是没有artist.path字段。\n因此，对于artist的face和portrait上传，会先判断artist.path字段，如果不为空，则上传至artist根目录，如果为空，则上传至static/photo/artist目录的face或portrait子目录，以artist.name（字符合法化后）名+artist.id命名。'
  }
]

const keyword = ref('')
const openIdx = ref<number>(-1)

// Read-only derived list filtered by keyword
const filteredFaqs = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return faqs
  return faqs.filter(f => f.q.toLowerCase().includes(kw) || f.a.toLowerCase().includes(kw))
})

function toggle(idx: number) {
  openIdx.value = openIdx.value === idx ? -1 : idx
}

const quickLinks = [
  { label: 'Edit — 歌手 / 专辑 / 曲目元数据编辑', to: '/edit' },
  { label: 'Upload — 上传新曲目文件', to: '/upload' },
  { label: 'Transfer — 扫描、标签编辑与转移存档', to: '/transfer' },
  { label: 'Scan — 音乐库扫描', to: '/scan' }
]
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Help</h1>
        <p>系统使用说明与常见问题</p>
      </div>
    </div>

    <div class="two-col items-start">
      <div class="flex flex-col gap-2 min-w-0">
        <!-- 搜索 -->
        <div class="help-search !mb-0">
          <svg width="17" height="17" viewBox="0 0 256 256" fill="currentColor" class="text-ink-3 flex-none">
            <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
          </svg>
          <input type="text" v-model="keyword" placeholder="搜索帮助内容..." />
        </div>

        <!-- FAQ 折叠 -->
        <template v-for="(f, i) in filteredFaqs" :key="f.q">
          <div class="faq-item" :class="{ 'open': openIdx === i }">
            <div class="faq-q" @click="toggle(i)">
              <span>{{ f.q }}</span>
              <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor" class="arrow">
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
            <div class="faq-a whitespace-pre-line">{{ f.a }}</div>
          </div>
        </template>
        <div v-if="!filteredFaqs.length" class="card"><div class="state-box !py-10"><b>没有匹配的内容</b><span>换个关键词试试</span></div></div>
      </div>

      <!-- 快速入门 -->
      <div class="card">
        <div class="card-header"><h2>快速入门</h2></div>
        <div class="card-pad !py-2">
          <router-link v-for="link in quickLinks" :key="link.to" :to="link.to"
            class="setting-row !py-3 no-underline group cursor-pointer !block">
            <div class="flex items-center gap-2.5">
              <span class="w-1.5 h-1.5 rounded-full bg-accent flex-none"></span>
              <span class="text-[13.5px] text-ink-2 group-hover:text-accent transition-colors">{{ link.label }}</span>
              <span class="sp"></span>
              <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" class="text-ink-3 group-hover:text-accent transition-colors">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L156.69,136,90.34,69.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
