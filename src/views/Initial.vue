<script setup lang="ts">
import { reactive, computed, onMounted, inject } from 'vue';
import { useRequest } from 'alova/client';
import { busyState, type BusyState } from '@/composables/busy'
import WImgConfigItem from '@/components/WImgConfigItem.vue';
import { getInitDirs, createInitDirs, uploadDefautArt } from '@/apis/methods/manage';
import defaultTrack from '@/assets/imgs/track.jpg';
import defaultAlbum from '@/assets/imgs/album.jpg'
import defaultArtist from '@/assets/imgs/artist.png'
import defaultPlaylist from '@/assets/imgs/playlist.jpg';

// While any global task is running, init entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

// 定义每个图片的配置数据
interface ImageConfig {
  label: string;
  art_type: string;
  currentUrl: string | null;
  initialUrl: string | null;
  defaultAsset?: string;
}

// 配置 4 个图片
const imageConfigs = reactive<ImageConfig[]>([
  {
    label: 'Track',
    art_type: 'track',
    currentUrl: null,
    initialUrl: null,
    defaultAsset: defaultTrack,
  },
  {
    label: 'Album',
    art_type: 'album',
    currentUrl: null,
    initialUrl: null,
    defaultAsset: defaultAlbum,
  },
  {
    label: 'Artist',
    art_type: 'artist',
    currentUrl: null,
    initialUrl: null,
    defaultAsset: defaultArtist,
  },
  {
    label: 'Playlist',
    art_type: 'playlist',
    currentUrl: null,
    initialUrl: null,
    defaultAsset: defaultPlaylist,
  },
]);



const handleSingleSaved = () => {
  console.log('单个图片保存成功');
  alert('保存成功')
};

const needInitDirs = computed(() => {
  if (!folders.value || folders.value.length == 0) return false;
  for (let folder of folders.value) {
    if (!folder.path) return true;
  }
  return false;
})
const { data:folders, send: refresh } = useRequest(getInitDirs)
async function createAll() {
  await createInitDirs()
  refresh()
}

// 初始化加载数据
onMounted(async () => {
  await Promise.all(imageConfigs.map(async (config) => {
    const baseURL = import.meta.env.VITE_BASE_URL;
    const url = baseURL + `artwork/default/${config.art_type}`
    config.initialUrl = url;
    config.currentUrl = url;
  }));
});
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Initial</h1>
        <p>创建初始目录并设置默认 Artwork</p>
      </div>
    </div>

    <div class="card max-w-3xl">
      <div class="card-header">
        <h2>Create Init Directories</h2>
        <span class="sp"></span>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="createAll"
          :disabled="!needInitDirs || busy"
        >Create All</button>
      </div>
      <div class="card-pad !py-2">
        <div v-for="f in folders" :key="f.name" class="setting-row">
          <div class="info">
            <b>{{ f.name }}</b>
            <span :class="{ '!text-warn-ink': !f.path }">{{ f.path || '尚未创建' }}</span>
          </div>
          <div class="control">
            <span class="tag" :class="f.path ? 'tag-ok' : 'tag-warn'">{{ f.path ? '就绪' : '待创建' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h2>Set Default Artworks</h2></div>
      <!-- 遍历 4 个图片配置 -->
      <div class="card-pad flex flex-wrap gap-4">
        <WImgConfigItem
          v-for="config in imageConfigs"
          v-model="config.currentUrl"
          :key="config.art_type"
          :label="config.label"
          :initial-url="config.initialUrl"
          :default-asset-url="config.defaultAsset"
          :upload-method="uploadDefautArt"
          :upload-params="{art_type: config.art_type}"
          @saved="handleSingleSaved"
        />
      </div>
    </div>
  </div>
</template>