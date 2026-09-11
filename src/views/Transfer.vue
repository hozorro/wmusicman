<script setup lang="ts">
import { ref, computed, inject, onMounted } from "vue";
import { useRequest } from "alova/client";
import WTable from "@/components/WTable.vue";
import WColumn from "@/components/WColumn.vue";
import { useSystemStore } from "@/store/system";
import { openDialog } from '@/composables/wdialog';
import Sessions from './dialogs/Sessions.vue';
import Acoust from "./dialogs/Acoust.vue";
import EditMulti from "./dialogs/EditMulti.vue";
import EditValue from "./dialogs/EditValue.vue";
import EditMeta from "./dialogs/EditMeta.vue";
import TransferOpt from "./dialogs/TransferOpt.vue";
import { createStageSession, getSessionFiles, addFilesToSession, transferFiles } from "@/apis/methods/manage";
import { useTransfer } from "@/composables/transfer";
import { busyState, type BusyState } from '@/composables/busy';
import { invalidateCache } from "alova";

// While a global task is running, all operations are disabled (read-only view)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const systemStore = useSystemStore()
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

const { data: fetchedFiles, send: loadSessionFiles } = useRequest(
  (session) => getSessionFiles(session), 
  { immediate: false }
)
const refreshSessionFiles = async () => {
  if (!systemStore.curSession) return
  await loadSessionFiles(systemStore.curSession)
  sessionFiles.value = [...fetchedFiles.value]
}
const selectSession = async () => {
  const result = await openDialog<string>(Sessions, { title: '选择会话' })
  if (result) {
    systemStore.curSession = result
    await refreshSessionFiles()
  }
}
const createSession = async () => {
  let res = await createStageSession()
  systemStore.curSession = res.session_id
  sessionFiles.value = []
}
const { data: addedFiles, loading, error, send: addFiles } = useRequest(
  () => addFilesToSession(systemStore.curSession), 
  { immediate: false }
)
const addFilesToCurSession = async () => {
  if(systemStore.curSession) {
    await addFiles()
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
  const res = await updateVersion(systemStore.curSession, selected)
  if (res) {
    alert('升级成功')
    await refreshSessionFiles()
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
  const res = await updateMetas(systemStore.curSession, rowSelected.value)
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
      session: systemStore.curSession,
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
    const count = await transferFiles(rowSelected.value, lang, systemStore.curSession, result)
    invalidateCache(getSessionFiles(systemStore.curSession))
    if (count.count < sessionFiles.value.length) {
      await refreshSessionFiles()
    } else {
      sessionFiles.value = []
      systemStore.curSession = ''
    }
  }
}

onMounted(() => {
  if (systemStore.curSession) {
    refreshSessionFiles()
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Transfer</h1>
        <p>暂存区文件的元数据编辑、版本升级与存档转移</p>
      </div>
      <div class="sp actions flex-wrap justify-end">
        <button type="button" class="btn" :disabled="busy" @click="selectSession">选择会话</button>
        <button type="button" class="btn btn-icon" title="新建会话" :disabled="busy" @click="createSession">+</button>
        <button type="button" class="btn" :disabled="loading || busy" @click="addFilesToCurSession">添加文件</button>
        <button type="button" class="btn btn-primary" :disabled="busy" @click="handleUpdateVersion">升级编码及meta版本</button>
        <button type="button" class="btn" :disabled="rowSelected.length == 0 || busy" @click="handleModifyMeta">修改meta</button>
        <button type="button" class="btn" :disabled="!is_modified || loading || busy" @click="handleSaveMeta">保存meta</button>
        <button type="button" class="btn btn-danger" :disabled="busy" @click="handleTransfer('CN')">转移至CN</button>
        <button type="button" class="btn btn-danger" :disabled="busy" @click="handleTransfer('FR')">转移至FR</button>
      </div>
    </div>

    <div class="flex items-center gap-2 text-[13px]">
      <span class="text-ink-3">当前会话</span>
      <span class="tag tag-cyan num">{{ systemStore.curSession || '未选择' }}</span>
      <span v-if="error" class="text-bad ml-4">{{ error.message }}</span>
    </div>

    <div class="card">
      <div class="tbl-wrap h-[calc(100svh_-_16rem)] overflow-y-auto" :class="{ 'opacity-70': busy }">
        <WTable :data="fileList">
          <WColumn width="3%"
            :row-selectable="true"
            v-model:row-selected="rowSelected"
            v-model:all-selected="allSelected"
            @toggle-all-selection="handleAllSelection"
          />
          <WColumn width="10%" label="File">
            <template #default="scope">
              <div class="text-xs" :title="'Path:' + scope.row.path">
                <span class="tag tag-ok ml-1">{{ scope.row.file_type }}</span>
                <template v-for="(v, i) in scope.row.version" :key="i">
                  <span class="ver-tag"
                    :class="{ 'ver-on': i === scope.row.ver_activate, 'ver-mb': scope.row.version[i] === 'MB', 'pointer-events-none': busy }"
                    @click="handleSwitchVersionType(scope.row.path, i as number)">
                    {{ v }}
                  </span>
                </template>
                <span class="tag tag-ok ml-1">{{ scope.row.encoding }}</span>
              </div>
            </template>
          </WColumn>
          <WColumn label="Title" prop="title" cell-editable="direct" @update-value="updateCellValue" />
          <WColumn width="15%" label="Artists" prop="artists"
            :column-editable="true"
            cell-editable="dialog"
            :sortable="true"
            :transform="parseMulti"
            @edit-column="handleEditColumn"
            @open-cell-edit-dlg="handleOpenCellEditDlg"
            @sort-data="handleSortData"
          />
          <WColumn width="8%" label="Album Artist" prop="albumartist" :column-editable="false" />
          <WColumn width="15%" label="Album" prop="album"
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
              <div class="inline-flex items-center gap-1 text-xs">
                <span
                  class="tag"
                  :class="scope.row.cover_art_hash ? (scope.row.cover_art_hash.startsWith('matched_') ? 'tag-warn' : 'tag-info') : 'tag-gray'"
                  :title="scope.row.cover_art_hash">CA</span>
                <span
                  class="tag"
                  :class="scope.row.mb_trackid ? 'tag-cyan' : 'tag-gray'"
                  :title="scope.row.mb_trackid">MB</span>
                <span
                  class="tag"
                  :class="scope.row.acoustid_id ? 'tag-bad' : 'tag-gray'"
                  :title="scope.row.acoustid_id">AC</span>
              </div>
            </template>
          </WColumn>
          <WColumn width="5%" label="Match">
            <template #default="scope">
              <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="handleMatch(scope.row.id)">FPMB</button>
            </template>
          </WColumn>
        </WTable>
        <div v-if="!fileList.length" class="state-box !py-10">
          <b>暂无文件</b>
          <span>选择会话并添加文件后开始处理</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ver-tag {
  display: inline-block; margin-top: 2px; margin-right: 4px; padding: 0 5px;
  border: 1px solid var(--color-warn); border-radius: 4px; cursor: pointer;
  color: var(--color-warn); transition: all .15s; line-height: 1.7;
}
.ver-tag:hover { background: var(--color-warn-soft); }
.ver-tag.ver-on { background: var(--color-warn-soft); font-weight: 600; }
.ver-tag.ver-mb { border-color: var(--color-warn-ink); color: var(--color-warn-ink); }
</style>