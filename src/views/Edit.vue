<script setup lang="ts">
import { ref, computed } from "vue";
import { useRequest } from "alova/client";
import { invalidateCache } from "alova";
import WTable from '@/components/WTable.vue'
import WColumn from '@/components/WColumn.vue';
import WImgUploader from "@/components/WImgUploader.vue";
import EditValue from "./dialogs/EditValue.vue";
import EditMulti from "./dialogs/EditMulti.vue";
import { openDialog } from "@/composables/wdialog";
import { getArtistChars, getArtists, getArtist, getAlbum, uploadArtistArt, uploadAlbumArt, updateTrackFieldTag } from "@/apis/methods/manage";
import { getUniformFieldValueSingle, getUniformFieldValueArray, compareArray } from "@/utils/general";
import DefaultTrack from "@/assets/imgs/track.jpg";

const artistChar = ref("");
const showNoPathArtists = ref(false);
const {data: artistChars, onSuccess} = useRequest(getArtistChars);
onSuccess(() => {
  let firstHasArtistChar = artistChars.value.find((charInfo) => charInfo.hasArtist)
  if (firstHasArtistChar) {
    artistChar.value = firstHasArtistChar.charName;
    getArtistList(artistChar.value, showNoPathArtists.value);
  }
});
const {data: dataArtists, send: getArtistList} = useRequest((achar: string, withNoPah: boolean) => getArtists(achar, withNoPah),{
  initialData: [],
  immediate: false
});
const {data: artist, send: getArtistInfo} = useRequest((id: number) => getArtist(id),{
  initialData: {main_albums: [], track_albums: [], name: '[歌手]', face: '', portrait: ''},
  immediate: false
});
const {data: album, send: getAlbumInfo} = useRequest((id: number) => getAlbum(id),{
  initialData: {trakcs: [], name: '[专辑]', cover: ''},
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
  getArtistList(artistChar.value, showNoPathArtists.value);
}
const filterArtists = () => {
  getArtistList(artistChar.value, showNoPathArtists.value);
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

function handleFaceUploaded(_:any) {
  invalidateCache(getArtist(artist.value.id))
  alert('修改face成功.')
}
function handlePortraitUploaded(_:any) { 
  invalidateCache(getArtist(artist.value.id))
  alert('修改portrait成功.')
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
    let {uniformValue, isDifferent} = getUniformFieldValueArray(album.value.tracks, 'genres', rowSelected.value, 'id')
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
  <div class=" w-full h-full flex text-sm">
    <div class=" flex-none h-full flex flex-col w-96">
      <div class=" p-2 flex-none grid grid-cols-9 gap-2 w-full bg-white rounded-lg">
        <template v-for="achar in artistChars"> 
          <div v-if="achar.hasArtist && artistChar == achar.charName" class=" bg-cyan-700 text-white rounded-md p-1 aspect-square place-content-center cursor-pointer">
            <div class=" text-center">{{ achar.charName }}</div>
          </div>
          <div v-else-if="achar.hasArtist" class=" bg-stone-200 text-stone-700 rounded-md p-1 aspect-square place-content-center cursor-pointer" @click="switchArtists(achar.charName)">
            <div class=" text-center">{{ achar.charName }}</div>
          </div>
          <div v-else class=" bg-stone-100 text-stone-700 rounded-md p-1 aspect-square place-content-center cursor-pointer"> 
            <div class=" text-center">{{ achar.charName }}</div>
          </div>
        </template>
      </div>
      <div class=" flex-none mt-2">
        <input type="checkbox" v-model="showNoPathArtists" @change="filterArtists">过滤无Path歌手</input>
      </div>
      <div class=" flex-1 mt-2 overflow-y-auto">
        <div class=" w-full p-2 overflow-y-auto bg-white rounded-lg divide-y divide-gray-100">
          <div :class="{'bg-cyan-100': ar.name == artist.name}" v-for="ar in dataArtists" class=" p-1 cursor-pointer" @click="handleArtist(ar.id)">{{ ar.name }}</div>
        </div>
      </div>
      <div class=" flex-none flex mt-2">
        <WImgUploader 
          container-class=" flex-none w-32 aspect-square"
          v-model="faceSrc"
          :show-progress="true"
          :upload-method="uploadArtistArt"
          :upload-params="{id: artist.id, art_type: 'face'}"
          @change="handleFaceUploaded"
        />
        <WImgUploader 
          class=" flex-1 h-32 ml-4"
          v-model="portraitSrc"
          :show-progress="true"
          :upload-method="uploadArtistArt"
          :method-options="{id: artist.id, art_type: 'portrait'}"
          @change="handlePortraitUploaded"
        />
      </div>
    </div>
    <div class=" flex-1 flex flex-col h-full ml-2 p-2 bg-white rounded-lg">
      <div class=" flex-none border-b border-b-gray-300">{{ artist.name }} 的专辑</div>
      <div class=" flex-1 flex justify-between overflow-auto">
        <div class=" flex-1 ml-2 overflow-y-auto">
          <div class=" h-full p-2 overflow-y-auto  bg-white rounded-lg divide-y divide-gray-100">
            <div :class="{'bg-cyan-100': al.title == album.title}" v-for="al in artist.main_albums" class=" p-1 cursor-pointer" @click="handleAlbum(al.id)">{{ al.title }}</div>
            <div :class="{'bg-cyan-100': al.title == album.title}" v-for="al in artist.track_albums" class=" p-1 text-gray-500 cursor-pointer" @click="handleAlbum(al.id)">{{ al.title }}</div>
          </div>
        </div>
        <div class=" flex-none p-2 ml-4 w-48">
          <WImgUploader 
            container-class=" flex-none w-32 aspect-square"
            v-model="albumArtSrc"
            :upload-method="uploadAlbumArt"
            :upload-params="{id: album.id}"
            @uploaded="handleAlbumArtUploaded"
          />
        </div>
      </div>
      <div class=" flex-3 p-2 w-full h-full overflow-y-auto bg-white rounded-lg">
        <div class=" h-full overflow-y-auto"> 
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
                  <img :src="scope.row.cover" v-default-src="DefaultTrack" class="w-9 h-9 object-cover rounded-md" />
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