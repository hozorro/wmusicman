<script setup lang="ts">
import { ref, computed } from 'vue'

// Static FAQ content (display only)
const faqs = [
  {
    q: '0. 部署设置',
    a: '在 .env 设置 VITE_APP_NAME=WMusic Manager, VITE_CLIENT_TYPE=admin, VITE_TOKEN_PREFIX=admin_\n在开发模式下还需设置VITE_API_BASE和VITE_BASE_URL。'
  },
  {
    q: '1. 文件上传、整理和归档',
    a: '在Upload页面中上传，文件会上传至临时目录。\n在Transfer页面进行标签编辑和转移。首先需要创建一个会话，然后添加文件，临时目录中的所有文件都会添加进来。\n可在Transfer页面中编辑音乐文件的标签数据和封面，还可生成指纹匹配MusicBrainZ数据。\n转移（存档）音乐文件时，会自动根据音乐文件创建或使用歌手和专辑目录。\n音乐文件转移至音乐库后，后台watcher会自动进行扫描并添加到数据库中。\n音乐库的文件层次结构是：root->country->startchar->artist->album->track。\nTransfer页面主要用于元数据预览和简单编辑，批量编辑和匹配请使在文件上传前用Picard。'
  },
  {
    q: '2. 已入库音乐数据编辑',
    a: '在Edit页面中进行编辑。可编辑歌手face和portrait，专辑cover，以及音乐文件的tag数据。\n音乐文件tag数据编辑涉及文件移动，需慎重。'
  },
  {
    q: '3. 音乐库扫描',
    a: '在Scan页面可一键扫描整个音乐库，或增量扫描。'
  },
  {
    q: '4. 重建Artwork缓存',
    a: '在Artwork页面可一次性重建所有artist, album和track的Artwork缓存，以供nginx静态提供。'
  },
  {
    q: '5. 备份与恢复',
    a: '在Backup页面可进行播放数据的备份与恢复。\n当重新全量扫描整个音乐库时，每个artist, album, genre, folder和track的id会变化，导致playlist等播放数据中的关联数据混乱失效，因此采用基于track.path的数据备份与恢复。\n可备份与恢复指定用户的所有歌单、歌曲播放和收藏数据。有选择地备份与恢复单个歌单请至Playlist页面。'
  },
  {
    q: '6. 日志',
    a: '在Log页面可查看后端运行日志。'
  },
  {
    q: '7. 其他',
    a: 'Setting页面仅用于简单的元数据编辑设置。\nTool页面仅用于开发测试。\nInitialize页面可查看media目录结构及就绪情况，设置默认artwork功能已废弃，请不要使用。'
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
