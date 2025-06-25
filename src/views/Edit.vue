<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import { useRequest } from "alova/client";
import { invalidateCache } from "alova";
import WTable from '@/components/WTable.vue'
import WColumn from '@/components/WColumn.vue';
import { getArtistChars, getArtists, getArtist, getAlbum, uploadArtistArt, uploadAlbumArt, updateTrackFieldTag } from "@/apis/methods/manage";
import DefaultFace from "@/assets/imgs/artist.png";
import DefaultPortrait from "@/assets/imgs/portrait.png";
import DefaultTrack from "@/assets/imgs/track.png";
import DefaultAlbumArt from "@/assets/imgs/album.png";

const artistChar = ref("");
const {data: artistChars, onSuccess} = useRequest(getArtistChars);
onSuccess(() => {
  let firstHasArtistChar = artistChars.value.find((charInfo) => charInfo.hasArtist)
  if (firstHasArtistChar) {
    artistChar.value = firstHasArtistChar.charName;
    getArtistList(artistChar.value);
  }
});
const {data: artists, send: getArtistList} = useRequest((achar: string) => getArtists(achar),{
  initialData: [],
  immediate: false
});
const {data: artist, send: getArtistInfo} = useRequest((id: string) => getArtist(id),{
  initialData: {albums: [], name: '[歌手]', face: '', portrait: ''},
  immediate: false
});
const {data: album, send: getAlbumInfo} = useRequest((id: string) => getAlbum(id),{
  initialData: {trakcs: [], name: '[专辑]', cover: ''},
  immediate: false
});
function switchArtists(char: string){
  artist.value.albums = [];
  artist.value.name = '[歌手]';
  faceSrc.value = '';
  portraitSrc.value = '';
  album.value.name = '[专辑]'
  album.value.tracks = [];
  albumArtSrc.value = '';
  artistChar.value = char;
  getArtistList(artistChar.value);
}
function handleArtist(id: string){
  album.value.tracks = [];
  album.value.name = '[专辑]'
  album.value.cover = '';
  getArtistInfo(id).then((res) => { 
    faceSrc.value = res.face;
    portraitSrc.value = res.portrait;
  });
}
function handleAlbum(id: string){
  getAlbumInfo(id).then((res) => {
    albumArtSrc.value = res.cover;
  })
}

// 修改图片face和portrait
const faceFile = useTemplateRef('faceFile')
const portraitFile = useTemplateRef('portraitFile')
const faceSrc = ref('')
const portraitSrc = ref('')
const faceProgress = ref(0)
const portraitProgress = ref(0)

function triggleFaceSelect() {
  if(faceFile.value != null) {
    faceFile.value.click()
  }
}
function trigglePortraitSelect() { 
  if(portraitFile.value != null) {
    portraitFile.value.click()
  }
}
function handleFaceChange(e: Event) {
  const target = e.target as HTMLInputElement
  if(target.files && target.files.length > 0) {
    const faceSelected = target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(faceSelected)
    reader.onload = function(e) {
      if(e.target) {
        faceSrc.value = e.target.result as string
      }
    }

    const formData = new FormData()
    formData.append('file', faceSelected)
    formData.append('art_type', 'face')
    const uploadFace = uploadArtistArt(artist.value.id, formData)
    uploadFace.onUpload((progressEvent) => { 
      faceProgress.value = Math.round(progressEvent.loaded * 100 / progressEvent.total)
    })
    uploadFace.then((res) => {
      if(res) {
        faceProgress.value = 0
        invalidateCache(getArtist(artist.value.id))
        alert('修改face成功')
      }
    })
  }
}
function handlePortraitChange(e: Event) { 
  const target = e.target as HTMLInputElement
  if(target.files && target.files.length > 0) {
    const portraitSelected = target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(portraitSelected)
    reader.onload = function(e) {
      if(e.target) {
        portraitSrc.value = e.target.result as string
      }
    }

    const formData = new FormData()
    formData.append('file', portraitSelected)
    formData.append('art_type', 'portrait')
    const uploadPortrait = uploadArtistArt(artist.value.id, formData)
    uploadPortrait.onUpload((progressEvent) => { 
      portraitProgress.value = Math.round(progressEvent.loaded * 100 / progressEvent.total)
    })
    uploadPortrait.then((res) => {
      if(res) {
        portraitProgress.value = 0
        invalidateCache(getArtist(artist.value.id))
        alert('修改portrait成功')
      }
    })
  }
}

// handle album art edit
const albumArtFile = useTemplateRef('albumArtFile')
const albumArtSrc = ref('')
const albumArtProgress = ref(0)

function triggleAlbumArtSelect() { 
  if (albumArtFile.value != null) {
    albumArtFile.value.click()
  }
}

function handleAlbumArtChange(e: Event) { 
  const target = e.target as HTMLInputElement
  if(target.files && target.files.length > 0) {
    const albumArtSelected = target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(albumArtSelected)
    reader.onload = function(e) {
      if(e.target) {
        albumArtSrc.value = e.target.result as string
      }
    }

    const formData = new FormData()
    formData.append('file', albumArtSelected)
    const uploadAlbumArtMethod = uploadAlbumArt(album.value.id, formData)
    uploadAlbumArtMethod.onUpload((progressEvent) => { 
      albumArtProgress.value = Math.round(progressEvent.loaded * 100 / progressEvent.total)
    })
    uploadAlbumArtMethod.then((res) => {
      if(res) {
        albumArtProgress.value = 0
        invalidateCache(getAlbum(album.value.id))
        alert('修改album art成功')
      }
    })
  }
}

// handle track tag edit
const rowSelected = ref<string[]>([])
const allSelected = computed(() => {
  if (album.value) {
    if (album.value.tracks?.length === 0) return false
    return rowSelected.value.length === album.value.tracks?.length
  }
  return false
})
const edit_column = ref<EditableTrackMetaField>()
const column_value = ref('')
const origin_column_value = ref('')
const fieldDlg = useTemplateRef('fieldDlg')
function get_set<K extends keyof Track>(items: Track[], field: K): Track[K]{
  let item_list = items.map(item => item[field])
  let item_set = new Set(item_list)
  if(item_set.size === 1){
    return item_set.values().next().value as Track[K]
  }else{
    return '*多值*' as never as Track[K]
  }
}
function handleAllSelection() {
  if(allSelected.value){
    rowSelected.value = []
  }else{
    rowSelected.value = album.value.tracks.map(item => item.id)
  }
}
function updateCellValue(payload: {id: string, field: EditableTrackMetaField, value: string}) {
  console.log('change in ' + payload.field + ' of ' + payload.id + ':' + payload.value)
  updateTrackFieldTag([payload.id], payload.field, payload.value ).then((data) => {
    if (data == 'ok'){
      album.value.tracks.filter(item => item.id === payload.id)[0][payload.field] = payload.value
      alert('修改成功')
    }
  })
}
function handleEditColumn(field: EditableTrackMetaField) {
  let items = rowSelected.value.length === 0 ? album.value.tracks : album.value.tracks.filter(item => rowSelected.value.includes(item.id))
  edit_column.value = field
  column_value.value = get_set(items, field) as string
  origin_column_value.value = column_value.value
  fieldDlg.value?.showModal()
}
function updateColumn() {
  let items = rowSelected.value.length === 0 ? album.value.tracks.map(item => item.id) : rowSelected.value
  if (edit_column.value !== undefined){
    let field = edit_column.value
    console.log({field: edit_column.value, value: column_value.value, items: items})
    updateTrackFieldTag(items, edit_column.value!, column_value.value).then((data) => {
      if (data == 'ok'){
        for(let i = 0; i < album.value.tracks.length; i++){
          if(items.includes(album.value.tracks[i].id)){
            album.value.tracks[i][field] = column_value.value
          }
        }
        fieldDlg.value?.close()
      }
    })
  }
}
</script>

<template>
  <div class=" w-full h-full flex">
    <div class=" flex-none flex flex-col w-96">
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
      <div class=" flex-1 flex mt-2">
        <div class=" flex-none w-32 h-full p-2 overflow-y-auto bg-white rounded-lg">
          <template v-for="ar in artists.data"> 
            <div class=" p-1 cursor-pointer" @click="handleArtist(ar.id)">{{ ar.name }}</div>
          </template>
        </div>
        <div class=" flex-1 h-full ml-2 p-2 overflow-y-auto bg-white rounded-lg">
          <template v-for="album in artist.albums">
            <div class=" p-1 cursor-pointer" @click="handleAlbum(album.id)">{{ album.name }}</div>
          </template> 
        </div>
      </div>
    </div>
    <div class=" flex-1 flex flex-col h-full ml-2 p-2 bg-white rounded-lg">
      <div class=" flex-none flex justify-between">
        <div class=" flex-1">
          <div class=" w-full p-2 border-b-2 border-b-gray-400">{{ artist.name }}</div>
          <div class=" flex w-full p-2">
            <div class=" flex-none w-32 aspect-square" @click="triggleFaceSelect">
              <img v-if="faceSrc !== ''" :src="faceSrc" v-default-src="DefaultFace" class=" inline-block w-32 aspect-square object-cover" />
              <div class=" mx-2 w-[calc(100%-(--spacing(4)))] h-[2px]">
                <div class=" h-[2px] bg-cyan-500" :style="{width: faceProgress + '%'}"></div>
              </div>
              <input type="file" class=" hidden" ref="faceFile" @change="handleFaceChange" />
            </div>
            <div class=" flex-1" @click="trigglePortraitSelect">
              <img v-if="portraitSrc !== ''" :src="portraitSrc" v-default-src="DefaultPortrait" class=" inline-block h-32 ml-4" />
              <div class=" mx-2 w-[calc(100%-(--spacing(4)))] h-[2px]">
                <div class=" h-[2px] bg-cyan-500" :style="{width: portraitProgress + '%'}"></div>
              </div>
              <input type="file" class=" hidden" ref="portraitFile" @change="handlePortraitChange" />
            </div>
          </div>
        </div>
        <div class=" flex-none ml-4 w-48">
          <div class=" w-full p-2 border-b-2 border-b-gray-400 truncate">{{ album.name }}</div>
          <div class=" p-2">
            <div class=" w-32 aspect-square" @click="triggleAlbumArtSelect">
              <img v-if="albumArtSrc !== ''" :src="albumArtSrc" v-default-src="DefaultAlbumArt" class=" inline-block w-32 aspect-square object-cover" />
              <div class=" mx-2 w-[calc(100%-(--spacing(4)))] h-[2px]">
                <div class=" h-[2px] bg-cyan-500" :style="{width: albumArtProgress + '%'}"></div>
              </div>
              <input type="file" class=" hidden" ref="albumArtFile" @change="handleAlbumArtChange" />
            </div>
          </div>
        </div>
      </div>
      <div class=" flex-1 p-2 w-full h-full bg-white rounded-lg">
        <div class=" flex-1 h-full overflow-y-auto"> 
          <w-table :data="album.tracks"> 
            <w-column width="3%"
              :row-selectable="true" 
              v-model:row-selected="rowSelected" 
              v-model:all-selected="allSelected"
              @toggle-all-selection="handleAllSelection"
            />
            <w-column width="8%" label="IMG">
              <template #default="scope">
                <img :src="scope.row.cover" v-default-src="DefaultTrack" class="w-12 h-12 object-cover rounded-md" />
              </template>
            </w-column>
            <w-column label="Title" prop="title" :cell-editable="true" @update-value="updateCellValue" />
            <w-column width="18%" label="Artist" prop="artist" 
              :column-editable="true" 
              :cell-editable="true" 
              @edit-column="handleEditColumn" 
              @update-value="updateCellValue"
            />
            <w-column width="18%" label="Album" prop="album" :column-editable="true" :cell-editable="true" @edit-column="handleEditColumn" @update-value="updateCellValue" />
            <w-column width="5%" label="Year" prop="year" :column-editable="true" :cell-editable="true" @edit-column="handleEditColumn" @update-value="updateCellValue" />
            <w-column width="10%" label="Genre" prop="genre" :column-editable="true" :cell-editable="true" @edit-column="handleEditColumn" @update-value="updateCellValue" />
          </w-table>
        </div>
      </div>
    </div>
  </div>
  <dialog ref="fieldDlg" class=" absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-40 p-2">
    <div class=" w-full my-2">
      <label class=" inline-block w-20">{{ edit_column }}</label><input type="text" v-model="column_value" />
    </div>
    <div class=" w-full flex justify-around my-2">
      <button type="button" @click="updateColumn" class=" block w-16">OK</button>
      <button type="button" @click="fieldDlg?.close()" class=" block w-16">Close</button>
    </div>
  </dialog>
</template>