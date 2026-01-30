<script setup lang="ts">
import { ref, computed } from "vue";
import { useRequest } from "alova/client";
import WTable from "@/components/WTable.vue";
import WColumn from "@/components/WColumn.vue";
import { openDialog } from '@/composables/wdialog';
import Sessions from './dialogs/Sessions.vue';
import Acoust from "./dialogs/Acoust.vue";
import EditMulti from "./dialogs/EditMulti.vue";
import EditValue from "./dialogs/EditValue.vue";
import EditMeta from "./dialogs/EditMeta.vue";
import TransferOpt from "./dialogs/TransferOpt.vue";
import { createStageSession, getSessionFiles, addFilesToSession, transferFiles } from "@/apis/methods/manage";
import { useTransfer } from "@/composables/transfer";

const curSession = ref('');
const sessionFiles = ref<SessionFile[]>([])

const { 
  fileList, 
  handleSwitchVersionType,
  updateVersion,
  updateMetas,
  getUniformField,
  getUniformFieldArray,
  getUniformObject,
  sortList,
  setAcoustInfo,
  setActivatedMetaProp
} = useTransfer(sessionFiles)

const is_modified = computed(() => {
  return sessionFiles.value.some(item => item.is_modified)
})
const rowSelected = ref<string[]>([])
const allSelected = computed(() => {
  return rowSelected.value.length !==0 && rowSelected.value.length === sessionFiles.value.length;
});
const parseMulti = (tag: string[]) => {
  return tag.join(', ')
}

const { data: fetchedFiles, send: loadSessionFiles } = useRequest((session) => getSessionFiles(session), { immediate: false }
)
const selectSession = async () => {
  const result = await openDialog<string>(Sessions, { title: '选择会话' })
  if (result) {
    curSession.value = result
    await loadSessionFiles(result)
    sessionFiles.value = [...fetchedFiles.value]
  }
}
const createSession = async () => {
  let res = await createStageSession()
  curSession.value = res.session_id
  sessionFiles.value = []
}
const { data: addedFiles, loading, error, send: addFiles } = useRequest(() => addFilesToSession(curSession.value), { immediate: false })
const addFilesToCurSession = async () => {
  if(curSession.value) {
    await addFiles()
    console.log(addedFiles.value)
    if (addedFiles.value && addedFiles.value.length) {
      sessionFiles.value.push(...addedFiles.value)
    } else {
      alert('没有可添加的文件')
    }
  }
}
function handleAllSelection() {
  if (allSelected.value) {
    rowSelected.value = []
  } else {
    rowSelected.value = sessionFiles.value.map(item => item.path)
  }
}
async function handleUpdateVersion() {
  let selected: string[]
  if (rowSelected.value.length === 0) {
    selected = sessionFiles.value.reduce((acc: string[], cur) => {
      if (cur.encoding == 'latin-1' || cur.version.some(item => item.startsWith('ID3v1')))
        acc.push(cur.id)
      return acc
    }, [])
    if(!confirm(`将升级所有ID3v1文件，共${selected.length}个，是否继续(如需分别处理，请先选择要处理的文件）？`)) return
  } else {
    selected = rowSelected.value
  }
  const res = await updateVersion(curSession.value, selected)
  if (res) {
    alert('升级成功')
    loadSessionFiles(curSession.value)
  }
}
async function handleModifyMeta() {
  if (rowSelected.value.length === 0) {
    alert('请选择要修改的文件')
    return
  }
  const meta = getUniformObject(rowSelected.value)
  const result = await openDialog<MetaEditOutput>(EditMeta, {title: '修改meta', contentProps: { meta }})
  if (result) {
    for (let i = 0; i < sessionFiles.value.length; i++) {
      if (rowSelected.value.includes(sessionFiles.value[i].id)) {
        let key: keyof MetaEditOutput
        for (key in result) {
          setActivatedMetaProp(i, key, result[key].value)
        }
      }
    }
  }
}
async function handleSaveMeta() {
  if (rowSelected.value.length === 0) {
    alert('请选择要保存的文件')
    return
  }
  const res = await updateMetas(curSession.value, rowSelected.value)
  if (res) {
    alert('保存成功')
  }
}
async function handleOpenCellEditDlg(id: string, prop: keyof MetaPrimary) {
  let index = sessionFiles.value.findIndex(item => item.id === id)
  const result = await openDialog<string[]>(EditMulti, { title: '修改' + prop, contentProps: { multiValue: fileList.value[index][prop] } })
  if (result) setActivatedMetaProp(index, prop, result)
}
function updateCellValue(payload: { key: string, field: keyof MetaPrimary, value: string | number }) {
  const { key, field, value } = payload
  let index = sessionFiles.value.findIndex(item => item.id === key)
  setActivatedMetaProp(index, field, value)
}
async function handleEditColumn(prop: keyof MetaPrimary) {
  if (rowSelected.value.length === 0) {
    alert('请选择要修改的文件')
    return
  }
  let result: string[] | string | number | null
  if (prop === 'artists' || prop === 'genres') {
    let {uniformValue, isDifferent} = getUniformFieldArray(prop, rowSelected.value)
    result = await openDialog<string[]>(EditMulti, { 
      title: '修改' + prop, 
      contentProps: { multiValue: uniformValue, isDifferent } 
    })
  } else {
    let {uniformValue, isDifferent} = getUniformField(prop, rowSelected.value)
    result = await openDialog<string | number>(EditValue, { 
      title: '修改' + prop, 
      contentProps: { value: uniformValue, isDifferent } 
    })
  }

  if (result) {
    for (let i = 0; i < sessionFiles.value.length; i++) {
      if (rowSelected.value.includes(sessionFiles.value[i].id)) {
        setActivatedMetaProp(i, prop, result)
      }
    }
  }
}
function handleSortData(payload: {field: keyof MetaPrimary, ascend: boolean}) {
  const { field, ascend } = payload
  sortList(field, ascend)
}
async function handleMatch(id: string) {
  const f = fileList.value.find(item => item.id === id)
  if(f) {
    const props: SongInfo = {
      title: f.title,
      artists: f.artists,
      album: f.album,
      genres: f.genres,
      year: f.year,
      path: f.path,
      session: curSession.value,
      cover: f.cover
    }
    const result = await openDialog<MatchResult | null>(Acoust, { title: '匹配歌曲', contentProps: props })
    if (result) setAcoustInfo(id, result)
  }
}
async function handleTransfer(lang: 'CN' | 'FR') {
  if (rowSelected.value.length === 0) {
    alert('请选择要转移的文件')
    return
  }
  const items = fileList.value.reduce((acc: TransferItem[], cur) => {
    if (rowSelected.value.includes(cur.id)) {
      acc.push({
        id: cur.id, 
        title: cur.title || '', 
        artists: cur.artists || [],
      })
    }
    return acc
  }, [])
  const result = await openDialog<string>(TransferOpt, { title: '存档歌曲', contentProps: { lang, items } })
  if (result != null) {
    await transferFiles(rowSelected.value, lang, curSession.value, result)
  }
}
</script>

<template>
  <div class=" my-2">
    <button type="button" class=" rounded-r-none border-r border-r-gray-50" @click="selectSession">选择会话</button>
    <button type="button" class=" mr-2 px-2 rounded-l-none" @click="createSession">+</button>
    <button type="button" class=" mr-2" :disabled="loading" @click="addFilesToCurSession">添加文件</button>
    <button type="button" class=" mr-2" @click="handleUpdateVersion">升级编码及meta版本</button>
    <button type="button" :disabled="rowSelected.length == 0" class=" mr-2 disabled:bg-gray-500" @click="handleModifyMeta">修改meta</button>
    <button type="button" :disabled="!is_modified || loading" class=" mr-2 disabled:bg-gray-500" @click="handleSaveMeta">保存meta</button>
    <button type="button" class=" mr-2" @click="handleTransfer('CN')">转移至CN</button>
    <button type="button" class=" mr-2" @click="handleTransfer('FR')">转移至FR</button>
  </div>
  <div class=" w-full my-1 p-2 rounded bg-gray-200">
    当前会话：<span>{{ curSession }}</span><span v-if="error" class=" text-red-500 ml-4">{{ error.message }}</span>
  </div>
  <div class=" h-[calc(100svh_-_8rem)] overflow-y-auto">
    <WTable :data="fileList">
      <WColumn width="3%"
        :row-selectable="true"
        v-model:row-selected="rowSelected"
        v-model:all-selected="allSelected"
        @toggle-all-selection="handleAllSelection"
      />
      <WColumn width="10%" label="File">
        <template #default="scope">
          <div class=" text-xs" :title="'Path:' + scope.row.path">
            <template v-for="(v, i) in scope.row.version" :key="i">
              <span class=" inline-block mt-1 border border-amber-500 rounded-xs px-1 mr-1 cursor-pointer text-amber-500"
                :class="{' bg-amber-200' : i === scope.row.ver_activate, 'border-amber-800 text-amber-800': scope.row.version[i] === 'MB'}"
                @click="handleSwitchVersionType(scope.row.path, i as number)">
                {{ v }}
              </span>
            </template>
            <span class=" inline-block mt-1 border border-emerald-500 rounded-xs px-1 text-emerald-500">{{ scope.row.encoding }}</span>
          </div>
        </template>
      </WColumn>
      <WColumn label="Title" prop="title" cell-editable="direct" @update-value="updateCellValue" />
      <WColumn width="18%" label="Artists" prop="artists"
        :column-editable="true"
        cell-editable="dialog"
        :sortable="true"
        :transform="parseMulti"
        @edit-column="handleEditColumn"
        @open-cell-edit-dlg="handleOpenCellEditDlg"
        @sort-data="handleSortData"
      />
      <WColumn width="18%" label="Album" prop="album"
        :column-editable="true"
        cell-editable="direct"
        @edit-column="handleEditColumn"
        @update-value="updateCellValue"
      />
      <WColumn width="5%" label="Year" prop="year"
        :column-editable="true"
        cell-editable="direct"
        @edit-column="handleEditColumn"
        @update-value="updateCellValue"
      />
      <WColumn width="5%" label="Genre" prop="genres"
        :column-editable="true"
        cell-editable="dialog"
        :transform="parseMulti"
        @edit-column="handleEditColumn"
        @open-cell-edit-dlg="handleOpenCellEditDlg"
      />
      <WColumn width="8%" label="Info">
        <template #default="scope">
          <div class=" inline-block text-xs">
            <span 
              class=" border border-sky-500 rounded-xs px-1 mr-1 text-sky-500"
              :class="scope.row.cover_art_hash ? ' bg-sky-200' : ''"
              :title="scope.row.cover_art_hash">CA</span>
            <span 
              class=" border border-fuchsia-500 rounded-xs px-1 mr-1 text-fuchsia-500"
              :class="scope.row.mb_trackid ? ' bg-fuchsia-200' : ''"
              :title="scope.row.mb_trackid">MB</span>
            <span 
              class=" border border-rose-500 rounded-xs px-1 mr-1 text-rose-500"
              :class="scope.row.acoustid_id ? ' bg-rose-200' : ''"
              :title="scope.row.acoustid_id">AC</span>
          </div>
        </template>
      </WColumn>
      <WColumn width="5%" label="Match">
        <template #default="scope">
          <button type="button" class=" h-6 px-1 py-0" @click="handleMatch(scope.row.id)">FPMB</button>
        </template>
      </WColumn>
    </WTable>
  </div>
</template>