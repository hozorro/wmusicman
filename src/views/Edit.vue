<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useRequest } from "alova/client";
import { invalidateCache } from "alova";
import { busyState, type BusyState } from '@/composables/busy'
import WTable from '@/components/WTable.vue'
import WColumn from '@/components/WColumn.vue';
import WImgUploader from "@/components/WImgUploader.vue";
import EditValue from "./dialogs/EditValue.vue";
import EditMulti from "./dialogs/EditMulti.vue";
import SelectArtistArt from './dialogs/SelectArtistArt.vue';
import { openDialog } from "@/composables/wdialog";
import { getArtistChars, getArtists, getArtist, getAlbum, uploadAlbumArt, updateTrackFieldTag, setArtistArt } from "@/apis/methods/manage";
import { getUniformFieldValueSingle, getUniformFieldValueArray, compareArray } from "@/utils/general";

// While any global task is running, art selection entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

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
    const newUrl = await setArtistArt(artist.value.id, artType, result)
    if (newUrl) {
      if (artType === 'face') {
        faceSrc.value = newUrl
      } else {
        portraitSrc.value = newUrl
      }
      invalidateCache(getArtist(artist.value.id))
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
</script>

<template>
  <div class="w-full h-full flex gap-4 animate-fade-in">
    <!-- 左栏：首字母导航 + 歌手列表 + 歌手图片 -->
    <div class="flex-none w-90 h-full flex flex-col gap-4 min-h-0">
      <div class="card flex-none">
        <div class="card-pad !py-3 flex flex-wrap gap-1.5">
          <template v-for="achar in artistChars">
            <div v-if="achar.hasArtist" class="chip !px-0 !gap-0 w-7 h-7 justify-center" :class="{ 'chip-on': artistChar == achar.charName }" @click="switchArtists(achar.charName)">
              {{ achar.charName }}
            </div>
            <div v-else class="chip !px-0 !gap-0 w-7 h-7 justify-center !cursor-default opacity-40">
              {{ achar.charName }}
            </div>
          </template>
        </div>
      </div>
      <div class="card flex-1 min-h-0 flex flex-col">
        <div class="card-header"><h2>歌手</h2></div>
        <div class="flex-1 overflow-y-auto p-2">
          <div
            v-for="ar in dataArtists"
            class="rounded-r px-3 py-1.5 cursor-pointer text-[13px] text-ink-2 transition-colors hover:bg-accent-soft"
            :class="{ 'bg-accent-soft text-accent font-medium': ar.name == artist.name }"
            @click="handleArtist(ar.id)"
          >{{ ar.name }}</div>
        </div>
      </div>
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
                <div class=" place-items-center" :title="'Path:'+ scope.row.path">
                  <img :src="scope.row.cover" class="w-9 h-9 object-cover rounded-md" />
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