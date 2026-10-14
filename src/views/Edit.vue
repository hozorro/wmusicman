<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useRequest, usePagination } from "alova/client";
import { invalidateCache } from "alova";
import { busyState, type BusyState } from '@/composables/busy'
import WTable from '@/components/WTable.vue'
import WColumn from '@/components/WColumn.vue';
import WImgUploader from "@/components/WImgUploader.vue";
import EditValue from "./dialogs/EditValue.vue";
import EditMulti from "./dialogs/EditMulti.vue";
import SelectArtistArt from './dialogs/SelectArtistArt.vue';
import EditTrackCover from './dialogs/EditTrackCover.vue';
import { openDialog } from "@/composables/wdialog";
import {
  transformArtwork, getArtistArtCandidates,
  getArtistChars, getArtists, getArtistsByPage, getArtist, getAlbum,
  uploadAlbumArt, updateTrackFieldTag, setArtistArt, updateTrackCover,
  getOrphanArtists, cleanupOrphanArtists
} from "@/apis/methods/manage";
import { getUniformFieldValueSingle, getUniformFieldValueArray, compareArray } from "@/utils/general";
import dayjs from 'dayjs';

// While any global task is running, art selection entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

// 歌手列表 tab 模式：'char' = 首字母导航，'latest' = 最新添加，'orphan' = 清理孤立
const artistTab = ref<'char' | 'latest' | 'orphan'>('char');

const artistChar = ref("");
const {data: artistChars, onSuccess} = useRequest(getArtistChars);
onSuccess(() => {
  let firstHasArtistChar = artistChars.value.find((charInfo) => charInfo.hasArtist)
  if (firstHasArtistChar) {
    artistChar.value = firstHasArtistChar.charName;
    getArtistList(artistChar.value);
  }
});
const {data: dataArtists, send: getArtistList} = useRequest((achar: string) => getArtists(achar),{
  initialData: [],
  immediate: false
});

// 最新歌手分页（usePagination，append 模式，最多4页）
const MAX_LATEST_PAGES = 4;
const {
  data: latestArtists,
  page: latestPage,
  fetching: latestFetching,
  isLastPage: latestIsLastPage,
  reload: reloadLatestArtists,
} = usePagination(
  (page, pageSize) => getArtistsByPage(page, pageSize),
  {
    append: true,
    initialPage: 1,
    initialPageSize: 50,
    total: (res) => res.total,
    data: (res) => res.list,
    immediate: false,
  }
);
const canLoadMore = computed(() => !latestIsLastPage.value && latestPage.value < MAX_LATEST_PAGES);
function loadMoreLatest() {
  if (canLoadMore.value && !latestFetching.value) {
    latestPage.value++;
  }
}
function switchArtistTab(tab: 'char' | 'latest' | 'orphan') {
  artistTab.value = tab;
  if (tab === 'latest' && latestArtists.value.length === 0) {
    reloadLatestArtists();
  }
  if (tab === 'orphan') {
    loadOrphanArtists();
  }
}

// 孤儿歌手
const orphanCleaning = ref(false);

const {data: orphanArtists, loading: orphanLoading, send: loadOrphanArtists} = useRequest(getOrphanArtists, {
  initialData: [],
  immediate: false
});

async function handleCleanupOrphan(id?: number) {
  const ids = id ? [id] : orphanArtists.value.map(a => a.id);
  if (ids.length === 0) return;
  if (!confirm(id ? `确定清除歌手「${orphanArtists.value.find(a => a.id === id)?.name}」吗？` : `确定清除全部 ${ids.length} 个孤立歌手吗？`)) return;
  orphanCleaning.value = true;
  try {
    const res = await cleanupOrphanArtists(ids);
    if (res.failed_ids.length > 0) {
      alert(`清除完成：成功 ${res.deleted_count} 个，失败 ${res.failed_ids.length} 个`);
    } else {
      alert(`成功清除 ${res.deleted_count} 个孤立歌手`);
    }
    invalidateCache([getOrphanArtists()])
    await loadOrphanArtists();
  } finally {
    orphanCleaning.value = false;
  }
}
const {data: artist, send: getArtistInfo} = useRequest((id: number) => getArtist(id),{
  initialData: {main_albums: [], track_albums: [], name: '[歌手]', face: '', portrait: ''},
  immediate: false
});
const {data: album, send: getAlbumInfo} = useRequest((id: number) => getAlbum(id),{
  initialData: {tracks: [], name: '[专辑]', cover: ''},
  immediate: false
});
function switchArtists(char: string){
  artist.value.main_albums = [];
  artist.value.track_albums = [];
  artist.value.name = '[歌手]';
  faceSrc.value = '';
  portraitSrc.value = '';
  album.value.title = '[专辑]'
  album.value.tracks = [];
  albumArtSrc.value = '';
  artistChar.value = char;
  rowSelected.value = []
  getArtistList(artistChar.value);
}
const parseMulti = (tag: string[]) => {
  return tag.join(',')
}
function handleArtist(id: number){
  album.value.tracks = [];
  album.value.title = '[专辑]'
  album.value.cover = '';
  rowSelected.value = []
  getArtistInfo(id).then((res) => { 
    faceSrc.value = res.face;
    portraitSrc.value = res.portrait;
    albumArtSrc.value = ''
  });
}
function handleAlbum(id: number){
  rowSelected.value = []
  getAlbumInfo(id).then((res) => {
    albumArtSrc.value = res.cover;
  })
}

// 修改图片face和portrait
const faceSrc = ref('')
const portraitSrc = ref('')

async function handleSelectArt(artType: 'face' | 'portrait') {
  if (busy.value) return
  const result = await openDialog<string>(SelectArtistArt, {
    title: `${artist.value.name} - 选择${artType === 'face' ? 'Face' : 'Portrait'}`,
    contentProps: {
      artistId: artist.value.id,
      artistName: artist.value.name,
      artType,
      currentUrl: artType === 'face' ? faceSrc.value : portraitSrc.value,
    }
  })
  if (result) {
    const res = await setArtistArt(artist.value.id, artType, result)
    if (res === 'ok') {
      if (artType === 'face') {
        faceSrc.value = transformArtwork('artist', artist.value.id, true, 'face')
      } else {
        portraitSrc.value = transformArtwork('artist', artist.value.id, true, 'portrait')
      }
      invalidateCache([getArtist(artist.value.id), getArtistArtCandidates(artist.value.id, artType)])
      alert(`修改${artType}成功`)
    }
  }
}

// handle album art edit
const albumArtSrc = ref('')
function handleAlbumArtUploaded(_:any) { 
  invalidateCache(getAlbum(album.value.id))
  alert('修改album art成功.')
}

// handle track tag edit
const rowSelected = ref<number[]>([])
const allSelected = computed(() => {
  if (album.value) {
    if (album.value.tracks?.length === 0) return false
    return rowSelected.value.length === album.value.tracks?.length
  }
  return false
})

function handleAllSelection() {
  if(allSelected.value){
    rowSelected.value = []
  }else{
    rowSelected.value = album.value.tracks.map(item => item.id)
  }
}
function updateCellValue<K extends ('year'|'title')>(payload: {id: number, field: K, value: TrackOfAlbum[K]}) {
  console.log('change in ' + payload.field + ' of ' + payload.id + ':' + payload.value)
  updateTrackFieldTag([payload.id], payload.field, payload.value ).then((res) => {
    if (res == 'ok'){
      album.value.tracks.filter(item => item.id === payload.id)[0][payload.field] = payload.value
      alert('修改成功')
    }
  })
}
async function handleEditColumn(field: keyof TrackOfAlbum) {
  if (rowSelected.value.length === 0) {
    alert('请选择要修改的文件')
    return
  }
  let result: string[] | string | number | null
  if (field === 'genres' || field === 'artists'){
    let {uniformValue, isDifferent} = getUniformFieldValueArray(album.value.tracks, field, rowSelected.value, 'id')
    result = await openDialog<string[]>(EditMulti, { title: '修改genres', contentProps: { multiValue: uniformValue, isDifferent } })
  } else {
    let {uniformValue, isDifferent} = getUniformFieldValueSingle(album.value.tracks, field, rowSelected.value, 'id')
    result = await openDialog<string>(EditValue, { title: '修改' + field, contentProps: { value: uniformValue, isDifferent } })
  }
  if (result) {
    let changed = album.value.tracks.filter((item) => {
      if (rowSelected.value.includes(item.id)) {
        if ((typeof result === 'string' || typeof result === 'number') && item[field] !== result) return true
        if (Array.isArray(result) && !compareArray(result, item[field] as string[]))  return true
        return false
      }
      return false
    }).map(item => item.id)
    updateTrackFieldTag(changed, field, result)
    alert('修改成功')
  }
}

async function handleOpenCellEditDlg(id: number, prop: keyof TrackOfAlbum) {
  let index = album.value.tracks.findIndex(item => item.id === id)
  const result = await openDialog<string[]>(EditMulti, { title: '修改' + prop, contentProps: { multiValue: album.value.tracks[index][prop] } })
  if (result) {
    updateTrackFieldTag([id], prop, result)
  }
}

// 修改曲目封面
async function handleEditTrackCover(track: TrackOfAlbum) {
  if (busy.value) return
  const result = await openDialog<{ trackId: number, file: File }>(EditTrackCover, {
    title: '修改曲目封面',
    contentProps: {
      trackId: track.id,
      trackTitle: track.title,
      currentCover: track.cover,
    }
  })
  if (result) {
    const formData = new FormData()
    formData.append('file', result.file)
    formData.append('track_id', result.trackId.toString())
    const newUrl = await updateTrackCover(formData)
    // 更新本地显示（加时间戳防缓存）
    const index = album.value.tracks.findIndex(item => item.id === result.trackId)
    if (index !== -1) {
      album.value.tracks[index].cover = newUrl + '?hashed=' + Date.now()
    }
    invalidateCache(getAlbum(album.value.id))
    alert('修改封面成功')
  }
}
</script>

<template>
  <div class="w-full h-full flex gap-4 animate-fade-in">
    <!-- 左栏：首字母导航 + 歌手列表 + 歌手图片 -->
    <div class="flex-none w-90 h-full flex flex-col gap-4 min-h-0">
      <!-- Tab 切换 -->
      <div class="card flex-none">
        <div class="card-pad !py-2 flex justify-center">
          <div class="seg">
            <button :class="{ 'seg-on': artistTab === 'char' }" @click="switchArtistTab('char')">首字母</button>
            <button :class="{ 'seg-on': artistTab === 'latest' }" @click="switchArtistTab('latest')">最新添加</button>
            <button :class="{ 'seg-on': artistTab === 'orphan' }" @click="switchArtistTab('orphan')">清理孤立</button>
          </div>
        </div>
      </div>
      <!-- 首字母导航 Tab -->
      <template v-if="artistTab === 'char'">
        <div class="card flex-1 min-h-0 flex flex-col">
          <div class="card-header"><h2>按首字母选择歌手</h2></div>
          <div class="card-pad !py-3 flex-none flex flex-wrap gap-1.5">
            <template v-for="achar in artistChars">
              <div v-if="achar.hasArtist" class="chip !px-0 !gap-0 w-7 h-7 justify-center" :class="{ 'chip-on': artistChar == achar.charName }" @click="switchArtists(achar.charName)">
                {{ achar.charName }}
              </div>
              <div v-else class="chip !px-0 !gap-0 w-7 h-7 justify-center !cursor-default opacity-40">
                {{ achar.charName }}
              </div>
            </template>
          </div>
          <div class="flex-1 overflow-y-auto p-2 border-t border-line">
            <div
              v-for="ar in dataArtists"
              class="rounded-r px-3 py-1.5 cursor-pointer text-[13px] text-ink-2 transition-colors hover:bg-accent-soft"
              :class="{ 'bg-accent-soft text-accent font-medium': ar.name == artist.name }"
              @click="handleArtist(ar.id)"
            >{{ ar.name }}</div>
          </div>
        </div>
      </template>
      <!-- 最新添加 Tab -->
      <template v-else-if="artistTab === 'latest'">
        <div class="card flex-1 min-h-0 flex flex-col">
          <div class="card-header"><h2>最新添加的歌手</h2></div>
          <div class="flex-1 overflow-y-auto p-2">
            <div
              v-for="ar in latestArtists"
              class="rounded-r px-3 py-1.5 cursor-pointer text-[13px] text-ink-2 transition-colors hover:bg-accent-soft"
              :class="{ 'bg-accent-soft text-accent font-medium': ar.name == artist.name }"
              @click="handleArtist(ar.id)"
            >
              <div class="flex justify-between">
                <div class=" flex-1 text-ink-2">{{ ar.name }}</div>
                <div class=" flex-none text-xs text-ink-3">{{ dayjs(ar.created_at).format('YYYY-MM-DD') }}</div>
              </div>
            </div>
            <!-- 加载更多 -->
            <div v-if="latestArtists.length > 0" class="py-2 text-center">
              <button
                v-if="canLoadMore"
                class="btn btn-ghost text-xs"
                :disabled="latestFetching"
                @click="loadMoreLatest"
              >{{ latestFetching ? '加载中...' : '加载更多' }}</button>
              <span v-else class="text-xs text-ink-3">已加载全部（或最多200条）</span>
            </div>
            <div v-if="latestArtists.length === 0 && !latestFetching" class="state-box text-xs">暂无数据</div>
          </div>
        </div>
      </template>
      <!-- 清理孤立 Tab -->
      <template v-else-if="artistTab === 'orphan'">
        <div class="card flex-1 min-h-0 flex flex-col">
          <div class="card-header"><h2>孤立歌手清理</h2></div>
          <div class="card-pad !py-3 flex-none border-b border-line">
            <div class="flex items-center justify-between">
              <span class="text-xs text-ink-2">共 {{ orphanArtists.length }} 个孤立歌手</span>
              <button
                class="btn btn-primary text-xs"
                :disabled="orphanArtists.length === 0 || orphanCleaning"
                @click="handleCleanupOrphan()"
              >{{ orphanCleaning ? '清除中...' : '一键清除全部' }}</button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <div v-if="orphanLoading" class="state-box text-xs">加载中...</div>
            <div v-else-if="orphanArtists.length === 0" class="state-box text-xs">暂无孤立歌手</div>
            <div
              v-else
              v-for="ar in orphanArtists"
              :key="ar.id"
              class="flex items-center justify-between rounded-r px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:bg-accent-soft"
            >
              <span>{{ ar.name }}</span>
              <button
                class="btn btn-ghost text-xs text-danger"
                :disabled="orphanCleaning"
                @click="handleCleanupOrphan(ar.id)"
              >清除</button>
            </div>
          </div>
        </div>
      </template>
      <div class="card flex-none">
        <div class="card-header"><h2>歌手图片</h2></div>
        <div class="card-pad flex gap-4" :class="{ 'opacity-60': busy }">
          <!-- Face: 点击弹出候选选择窗口 -->
          <div class="flex-none w-32 cursor-pointer" @click="handleSelectArt('face')">
            <img v-show="faceSrc" :src="faceSrc" class="w-32 h-32 object-cover rounded-r border border-line" />
            <div v-show="!faceSrc" class="w-32 h-32 flex items-center justify-center bg-panel rounded-r border border-dashed border-line-strong text-ink-3 text-xs">无图片</div>
            <div class="text-xs text-center mt-1.5 text-ink-3">Face</div>
          </div>
          <!-- Portrait: 点击弹出候选选择窗口 -->
          <div class="flex-1 h-32 cursor-pointer" @click="handleSelectArt('portrait')">
            <img v-show="portraitSrc" :src="portraitSrc" class="w-full h-32 object-cover rounded-r border border-line" />
            <div v-show="!portraitSrc" class="w-full h-32 flex items-center justify-center bg-panel rounded-r border border-dashed border-line-strong text-ink-3 text-xs">无图片</div>
            <div class="text-xs text-center mt-1.5 text-ink-3">Portrait</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 右栏：专辑列表 + 曲目表 -->
    <div class="flex-1 h-full flex flex-col gap-4 min-h-0">
      <div class="card flex-none">
        <div class="card-header"><h2>{{ artist.name }} 的专辑</h2></div>
        <div class="card-pad !py-3 flex items-start gap-5">
          <div class="flex-1 max-h-40 overflow-y-auto">
            <div
              v-for="al in artist.main_albums"
              class="rounded-r px-3 py-1.5 cursor-pointer text-[13px] text-ink-2 transition-colors hover:bg-accent-soft"
              :class="{ 'bg-accent-soft text-accent font-medium': al.title == album.title }"
              @click="handleAlbum(al.id)"
            >{{ al.title }}</div>
            <div
              v-for="al in artist.track_albums"
              class="rounded-r px-3 py-1.5 cursor-pointer text-[13px] text-ink-3 transition-colors hover:bg-accent-soft"
              :class="{ 'bg-accent-soft text-accent font-medium': al.title == album.title }"
              @click="handleAlbum(al.id)"
            >{{ al.title }}</div>
          </div>
          <div class="flex-none">
            <WImgUploader
              container-class="flex-none w-32 aspect-square"
              v-model="albumArtSrc"
              :upload-method="uploadAlbumArt"
              :upload-params="{id: album.id}"
              :disabled="busy"
              @uploaded="handleAlbumArtUploaded"
            />
            <div class="text-xs text-center mt-1.5 text-ink-3">Album Art</div>
          </div>
        </div>
      </div>
      <div class="card flex-1 min-h-0 flex flex-col">
        <div class="card-header"><h2>曲目</h2></div>
        <div class="flex-1 min-h-0 overflow-y-auto">
          <w-table :data="album.tracks"> 
            <w-column width="3%"
              :row-selectable="true" 
              v-model:row-selected="rowSelected" 
              v-model:all-selected="allSelected"
              @toggle-all-selection="handleAllSelection"
            />
            <w-column width="6%" label="IMG">
              <template #default="scope">
                <div class="place-items-center cursor-pointer" :title="'Path:'+ scope.row.path" @click="handleEditTrackCover(scope.row as TrackOfAlbum)">
                  <img v-if="scope.row.cover" :src="scope.row.cover" class="w-9 h-9 object-cover rounded-md" />
                  <div v-else class="w-9 h-9 flex items-center justify-center bg-panel rounded-md border border-line text-ink-3">
                    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z"/>
                    </svg>
                  </div>
                </div>
              </template>
            </w-column>
            <w-column label="Title" prop="title" :cell-editable="'direct'" @update-value="updateCellValue" />
            <w-column width="20%" label="Artist" prop="artists" :transform="parseMulti" />
            <w-column width="8%" label="Year" prop="year" align="center"
              :column-editable="true" 
              :cell-editable="'direct'" 
              @edit-column="handleEditColumn" 
              @update-value="updateCellValue" 
            />
            <w-column width="25%" label="Genre" prop="genres" align="center"
              :transform="parseMulti" 
              :column-editable="true" 
              :cell-editable="'dialog'" 
              @edit-column="handleEditColumn" 
              @open-cell-edit-dlg="handleOpenCellEditDlg"
            />
          </w-table>
        </div>
      </div>
    </div>
  </div>
</template>