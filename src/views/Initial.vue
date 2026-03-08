<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
import { useRequest } from 'alova/client';
import WImgConfigItem from '@/components/WImgConfigItem.vue';
import { getInitDirs, createInitDirs, uploadDefautArt } from '@/apis/methods/manage';
import defaultTrack from '@/assets/imgs/track.jpg';
import defaultAlbum from '@/assets/imgs/album.jpg'
import defaultArtist from '@/assets/imgs/artist.png'
import defaultPlaylist from '@/assets/imgs/playlist.jpg';

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
  <h1 class=" font-bold text-xl">Create init directories</h1>
  <div class=" mt-2 p-2">
    <div class=" rounded-md bg-amber-50 p-2">
      <ul>
        <li v-for="f in folders" :key="f.name">{{ f.name }}: {{ f.path }}</li>
      </ul>
    </div>
    <button 
      class=" mt-2 p-2 w-36 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
      @click="createAll" 
      :disabled="!needInitDirs"
    >Create All</button>
  </div>
  <h1 class=" mt-4 font-bold text-xl">Set default artworks</h1>
  <!-- 全局保存按钮 (可选，如果需要一次性提交所有) -->
  <!-- 如果每个图片独立保存，则不需要此按钮 -->
  <div class=" mt-2 flex gap-4">
    <!-- 遍历 4 个图片配置 -->
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
</template>