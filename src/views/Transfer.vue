<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRequest } from 'alova/client';
import { invalidateCache } from 'alova';
import WTable from '@/components/WTable.vue'
import WColumn from '@/components/WColumn.vue';
import { getFiles, switchVersionType, transferFiles, cleanMetaTag, updateMetaTags, updateFieldTag } from "@/apis/methods/manage.ts";

const rowSelected = ref<string[]>([])
const allSelected = computed(() => rowSelected.value?.length === fileList.value?.length)
const metaDlg = ref<HTMLDialogElement>()
const fieldDlg = ref<HTMLDialogElement>()
const title = ref('')
const artist = ref('')
const album = ref('')
const year = ref('')
const genre = ref('')
const title_editable = ref(false)
const origin_title = ref('')
const origin_artist = ref('')
const origin_album = ref('')
const origin_year = ref('')
const origin_genre = ref('')
const encodingChange = ref(false)
const hasLatin1 = computed(()=>{
  let items = fileList.value?.filter(item => rowSelected.value.includes(item.path))
  let encoding = items?.map(item => item.encoding)
  return encoding?.includes('LATIN1')
})
const delApev2 = ref(false)
const hasApev2 = computed(()=>{
  let items = fileList.value?.filter(item => rowSelected.value.includes(item.path))
  let version = items?.map(item => item.version)
  if (version) {
    for(let v of version){
      if(v.includes('APEv2')){
        return true
      }
    }
  }
  return false
})
const edit_column = ref<EditableTrackMetaField>()
const column_value = ref('')
const origin_column_value = ref('')
const progress = ref(0)
const transfer_lang = ref('')
const transferDlg = ref<HTMLDialogElement>()
const create_playlist = ref(false)
const playlist_title = ref('')

function get_set<K extends keyof TrackFile>(items: TrackFile[], field: K): TrackFile[K]{
  let item_list = items.map(item => item[field])
  let item_set = new Set(item_list)
  if(item_set.size === 1){
    return item_set.values().next().value as TrackFile[K]
  }else{
    return '*多值*' as never as TrackFile[K]
  }
}
const { data: fileList, send: getFileList} = useRequest(getFiles, { immediate: false })
function handleGetFiles() {
  getFileList()
}
function handleAllSelection() {
  if(allSelected.value){
    rowSelected.value = []
  }else{
    rowSelected.value = fileList.value.map(item => item.path)
  }
}
function handleEditMeta() {
  if(rowSelected.value.length > 0){
    if(rowSelected.value.length === 1){
      let item = fileList.value.find(item => item.path === rowSelected.value[0])
      if (item !== undefined) {
        title.value = item.title
        title_editable.value = true
        artist.value = item.artist
        album.value = item.album
        year.value = item.year
        genre.value = item.genre
      }
    }else{
      title.value = '*多值*'
      title_editable.value = false
      let items = fileList.value.filter(item => rowSelected.value.includes(item.path))
      artist.value = get_set(items, 'artist')
      album.value = get_set(items, 'album')
      year.value = get_set(items, 'year')
      genre.value = get_set(items, 'genre')
    }
    origin_title.value = title.value
    origin_artist.value = artist.value
    origin_album.value = album.value
    origin_year.value = year.value
    origin_genre.value = genre.value
    metaDlg.value?.showModal()
  }
}
function updateMeta() {
  let change:ChangeInfo = {encoding: encodingChange.value, apev2: delApev2.value}
  if(title.value != origin_title.value){
    change.title = title.value
  }
  if(artist.value != origin_artist.value){
    change.artist = artist.value
  }
  if(album.value != origin_album.value){
    change.album = album.value
  }
  if(year.value != origin_year.value){
    change.year = year.value
  }
  if(genre.value != origin_genre.value){
    change.genre = genre.value
  }
  console.log({items: rowSelected.value, change: change})
  updateMetaTags(rowSelected.value, change).then((res) => {
    if (res.data == 'ok') {
      if (metaDlg.value !== undefined) {
        metaDlg.value.close()
        invalidateCache(getFiles())
        getFileList()
      }
    }
  })
}
function handleEditColumn(field: EditableTrackMetaField) {
  let items = rowSelected.value.length === 0 ? fileList.value : fileList.value.filter(item => rowSelected.value.includes(item.path))
  edit_column.value = field
  column_value.value = get_set(items, field) as string
  origin_column_value.value = column_value.value
  fieldDlg.value?.showModal()

}
function updateColumn(){
  let items = rowSelected.value.length === 0 ? fileList.value.map(item => item.path) : rowSelected.value
  console.log({field: edit_column.value, value: column_value.value, items: items})
  updateFieldTag(items, edit_column.value!, column_value.value).then((res) => {
    if (res.data == 'ok'){
      for(let i = 0; i < fileList.value.length; i++){
        if(items.includes(fileList.value[i].path)){
          fileList.value[i][edit_column.value!] = column_value.value
        }
      }
      fieldDlg.value?.close()
    }
  })
}
function updateCellValue(payload: {key: string, field: EditableTrackMetaField, value: string}){
  // send to backend ★★★★★★★★★★★★★★★★★★★
  console.log('change in ' + payload.field + ' of ' + payload.key + ':' + payload.value)
  updateFieldTag([payload.key], payload.field, payload.value ).then((res) => {
    if (res.data == 'ok'){
      fileList.value.filter(item => item.path === payload.key)[0][payload.field] = payload.value
      alert('修改成功')
    }
  })
}
function handleTransfer(lang: string){
  // send to backend ★★★★★★★★★★★★★★★★★★★
  if(rowSelected.value.length === 0){
    alert('请选择文件')
  }else{
    transfer_lang.value = lang
    transferDlg.value?.showModal()
  }
}
function doTransfer(){
  transferFiles(rowSelected.value, transfer_lang.value, create_playlist.value ? playlist_title.value : '').then((data) => {
    if(data){
      transferDlg.value?.close()
      alert('Transfer Success!')
      rowSelected.value = []
      invalidateCache(getFiles())
      getFileList()
    }else{
      alert('Transfer Failed!')
    }
  })
}
async function handleClean(){
  let needClean = fileList.value.filter(item => item.version.includes('APEv2') || item.encoding === 'LATIN1')
  let needCleanItems = needClean.map(item => ({path:item.path, ver_type:item.version[item.ver_activate!]}))
  let clean_count = needCleanItems.length
  if (clean_count === 0){
    return
  }else{
    if(confirm('有'+needCleanItems.length+'个文件需要清除MetaTag及编码，是否继续？')){
      let batched = Math.ceil(clean_count / 10)
      for(let i = 0; i < batched; i++){
        let res = await cleanMetaTag(needCleanItems.slice(i * 10, (i + 1) * 10))
        if(res){
          progress.value = Math.min((i + 1) * 10 / clean_count * 100, 100)
        }
      }
      invalidateCache(getFiles())
    }
  }
}
function handleSortData(payload: {path: string, field: SortableTrackMetaField, ascend: boolean}){
  if(payload.ascend){
    fileList.value.sort((a, b) => a[payload.field].localeCompare(b[payload.field]))
  }else{
    fileList.value.sort((a, b) => b[payload.field].localeCompare(a[payload.field]))
  }
}
function handleSwitchVersionType(path:string, index: number){
  let row = fileList.value.find(item => item.path === path)
  if(row !== undefined) {
    let ver_type = row.version[index]
    if (ver_type !== undefined) {
      switchVersionType(path, ver_type).then((res) => {
          let item = res.data
          item.ver_activate = index
          fileList.value[fileList.value.indexOf(row)] = item
      })
    }
  }
}
</script>
<template>
  <div class=" my-2">
    <button type="button" class=" mr-2 p-2 w-28" @click="handleGetFiles">列出文件</button>
    <button type="button" class=" mr-2 p-2 w-52" @click="handleClean">修正编码及MetaTag版本</button>
    <button type="button" class=" mr-2 p-2 w-32" @click="handleEditMeta">修改MetaTag</button>
    <button type="button" class=" mr-2 p-2 w-28" @click="handleTransfer('CN')">转移至CN</button>
    <button type="button" class=" mr-2 p-2 w-28" @click="handleTransfer('FR')">转移至FR</button>
  </div>
  <div class=" h-1 bg-cyan-300" :style="{width: progress + '%'}"></div>
  <div class=" h-[calc(100svh_-_6rem)] overflow-y-auto block">
    <w-table :data="fileList">
      <w-column width="3%"
        :row-selectable="true" 
        v-model:row-selected="rowSelected" 
        v-model:all-selected="allSelected"
        @toggle-all-selection="handleAllSelection"
      />
      <w-column width="12%" label="File">
        <template #default="scope">
          <div class=" inline-block text-xs text-amber-500" :title="'Path:'+ scope.row.path">
            <template v-for="(v,i) in scope.row.version" :key="i">
              <span class=" border rounded-xs px-1 mr-1 cursor-pointer"
                :class="i === scope.row.ver_activate ? ' bg-amber-200' : ''"
                @click="handleSwitchVersionType(scope.row.path, i)">
                {{ v }}
              </span>
            </template> | 
            <span>{{ scope.row.encoding }}</span>
          </div>
        </template>
      </w-column>
      <w-column label="Title" prop="title" :cell-editable="true" @update-value="updateCellValue" />
      <w-column width="18%" label="Artists" prop="artist" 
        :column-editable="true" 
        :cell-editable="true"
        :sortable="true"
        @edit-column="handleEditColumn" 
        @update-value="updateCellValue"
        @sort-data="handleSortData" 
      />
      <w-column width="18%" label="Album" prop="album" 
        :column-editable="true" 
        :cell-editable="true" 
        @edit-column="handleEditColumn" 
        @update-value="updateCellValue" 
      />
      <w-column width="5%" label="Year" prop="year" 
        :column-editable="true" 
        :cell-editable="true" 
        @edit-column="handleEditColumn" 
        @update-value="updateCellValue" 
      />
      <w-column width="10%" label="Genre" prop="genre" 
        :column-editable="true" 
        :cell-editable="true" 
        @edit-column="handleEditColumn" 
        @update-value="updateCellValue" 
      />
      <w-column width="5%" label="Has_Art" prop="has_art" />
    </w-table>
  </div>
  <dialog ref="metaDlg" class=" absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-1/3 p-2">
    <div class=" w-full my-2">
      <label class=" inline-block w-20">Title</label><input type="text" v-model="title" :disabled="!title_editable" />
    </div>
    <div class=" w-full my-2">
      <label class=" inline-block w-20">Artist</label><input type="text" v-model="artist" />
    </div>
    <div class=" w-full my-2">
      <label class=" inline-block w-20">Album</label><input type="text" v-model="album" />
    </div>
    <div class=" w-full my-2">
      <label class=" inline-block w-20">Year</label><input type="text" v-model="year" />
    </div>
    <div class=" w-full my-2">
      <label class=" inline-block w-20">Genre</label><input type="text" v-model="genre" />
    </div>
    <div class=" w-full my-2">
      <input type="checkbox" v-model="encodingChange" id="encoding" :disabled="!hasLatin1">
      <label for="encoding">Change encoding{{ hasLatin1?'(检测到Latin1编码)':'' }}</label>
    </div>
    <div class=" w-full my-2">
      <input type="checkbox" v-model="delApev2" id="delapev2" :disabled="!hasApev2">
      <label for="delapev2">Del APEv2 tags{{ hasApev2?'(检测到APEv2)':'' }}</label>
    </div>
    <div class=" w-full flex justify-around my-2">
      <button type="button" @click="updateMeta" class=" block w-16">OK</button>
      <button type="button" @click="metaDlg?.close()" class=" block w-16">Close</button>
    </div>
  </dialog>
  <dialog ref="fieldDlg" class=" absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-40 p-2">
    <div class=" w-full my-2">
      <label class=" inline-block w-20">{{ edit_column }}</label><input type="text" v-model="column_value" />
    </div>
    <div class=" w-full flex justify-around my-2">
      <button type="button" @click="updateColumn" class=" block w-16">OK</button>
      <button type="button" @click="fieldDlg?.close()" class=" block w-16">Close</button>
    </div>
  </dialog>
  <dialog ref="transferDlg" class=" absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-h-64 p-2">
    <div class=" w-full my-2">
      即将转移{{ rowSelected.length }}个文件到{{transfer_lang}}，是否将这些文件作为一个新的播放列表？<br />
      <div class=" text-xs text-gray-400 bg-gray-100 p-1">这些文件会作为列表记录为一个json文件，后续待守护进程监测到文件并扫描到数据库后，可依据这个json文件手动创建播放列表。</div>
    </div>
    <div class=" h-14">
      <div class=" w-full my-2">
        <input type="checkbox" v-model="create_playlist" id="create_playlist" />
        <label for="create_playlist">新建播放列表</label>
      </div>
      <div class=" w-full my-2" :style="{display:create_playlist?'block':'none'}">
        <label class=" inline-block w-34">待建播放列表名称:</label><input type="text" v-model="playlist_title" placeholder="留空则使用日期" />
      </div>
    </div>
    <div class=" w-full flex justify-around my-4">
      <button type="button" @click="doTransfer" class=" block w-16">OK</button>
      <button type="button" @click="transferDlg?.close()" class=" block w-16">Close</button>
    </div>
  </dialog>
</template>