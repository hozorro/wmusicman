<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'
import { getUserList, exportUserPlaylistData, exportUserHitData, exportUserFavData, importUserPlaylistData, importUserHitData, importUserFavData } from '@/apis/methods/manage'

// While any global task is running, export/import entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const users = ref<UserInfo[]>([])
const selectedUserId = ref<number>()
const selectedUser = computed(() => users.value.find(user => user.id == selectedUserId.value))
const isUpdate = ref(false)
const filePlaylistJson = useTemplateRef('filePlaylistJson')
const fileHitJson = useTemplateRef('fileHitJson')
const fileFavJson = useTemplateRef('fileFavJson')
const optInfo = ref('')

onMounted(async () => { 
  users.value = await getUserList()
})

const showOperationInfo = (result: ImportResult) => {
  optInfo.value += `\n导入完成: \n --成功：${result.success}\n --失败：${result.failed}\n`
  if(result.errors.length > 0){
    optInfo.value += `\n--错误信息：\n`
    result.errors.forEach(error => {
      optInfo.value += `\n ----${error}`
    })
  }
}
async function handleExportUserPlaylistData() { 
  if(selectedUserId.value){
    optInfo.value = `开始导出用户${selectedUser.value?.username}的歌单数据...`
    await exportUserPlaylistData(selectedUserId.value)
    optInfo.value = '导出完成'
  }
}
async function handleImportPlaylistData() { 
  if(filePlaylistJson.value && filePlaylistJson.value.files && filePlaylistJson.value.files.length > 0 && selectedUserId.value) {
    const formData = new FormData()
    formData.append('file', filePlaylistJson.value.files[0])
    formData.append('is_update', isUpdate.value ? '1' : '0')
    formData.append('user_id', selectedUserId.value.toString())
    optInfo.value = `开始导入用户${selectedUser.value?.username}的歌单数据...`
    const result = await importUserPlaylistData(formData)
    showOperationInfo(result)
  }
}
async function handleExportUserHitData() { 
  if(selectedUserId.value){
    optInfo.value = `开始导出用户${selectedUser.value?.username}的播放数据...`
    await exportUserHitData(selectedUserId.value)
    optInfo.value = '导出完成'
  }
}
async function handleImportHitData() { 
  if(fileHitJson.value && fileHitJson.value.files && fileHitJson.value.files.length > 0 && selectedUserId.value) {
    const formData = new FormData()
    formData.append('file', fileHitJson.value.files[0])
    formData.append('user_id', selectedUserId.value?.toString())
    optInfo.value = `开始导入用户${selectedUser.value?.username}的播放数据...`
    const result = await importUserHitData(formData)
    showOperationInfo(result)
  }
}
async function handleExportUserFavData() { 
  if(selectedUserId.value){
    optInfo.value = `开始导出用户${selectedUser.value?.username}的收藏数据...`
    await exportUserFavData(selectedUserId.value)
    optInfo.value = '导出完成'
  }
}
async function handleImportFavData() { 
  if(fileFavJson.value && fileFavJson.value.files && fileFavJson.value.files.length > 0 && selectedUserId.value) {
    const formData = new FormData()
    formData.append('file', fileFavJson.value.files[0])
    formData.append('user_id', selectedUserId.value?.toString())
    optInfo.value = `开始导入用户${selectedUser.value?.username}的收藏数据...`
    const result = await importUserFavData(formData)
    showOperationInfo(result)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Backup & Restore</h1>
        <p>导出与导入用户的歌单、播放与收藏数据</p>
      </div>
    </div>

    <div class="card">
      <div class="card-pad !py-3 flex items-center gap-3">
        <span class="tag tag-warn">注意</span>
        <span class="text-[13px] text-ink-2">备份或恢复歌单时，会一次性备份或恢复所有歌单，如要备份或恢复部分歌单，可到 Playlist 页面进行操作。</span>
      </div>
    </div>

    <div class="two-col items-start">
      <!-- 用户选择 -->
      <div class="card">
        <div class="card-header"><h2>选择用户</h2></div>
        <div class="card-pad flex flex-col gap-3">
          <select v-model="selectedUserId" size="10" class="select !h-auto" :disabled="busy">
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
          </select>
          <div v-if="selectedUser" class="rounded-r bg-panel border border-line px-3.5 py-2.5 text-[13px] text-ink-2">
            <b class="text-ink-1">{{ selectedUser.username }}</b>
            <span class="text-ink-3">（上次登录于 {{ selectedUser.last_login_at }}）</span>
          </div>
        </div>
      </div>

      <!-- 数据导入导出 -->
      <div class="card">
        <div class="card-header">
          <h2>数据导入 / 导出</h2>
          <span class="sp"></span>
          <span class="text-[12.5px] text-ink-3">目标用户：<b class="text-accent">{{ selectedUser?.username || '未选择' }}</b></span>
        </div>
        <div class="card-pad !py-2">
          <div class="setting-row !py-3.5">
            <div class="info">
              <b>歌单数据</b>
              <span>导出或导入用户的歌单（可覆盖已有歌单）</span>
            </div>
            <div class="control flex items-center gap-2.5 flex-wrap justify-end">
              <button type="button" class="btn btn-sm" :disabled="busy || !selectedUserId" @click="handleExportUserPlaylistData">导出</button>
              <input type="file" ref="filePlaylistJson" accept="application/json" class="text-[12px] text-ink-3 max-w-48" :disabled="busy" />
              <label class="check"><input type="checkbox" v-model="isUpdate" :disabled="busy" />覆盖已有歌单</label>
              <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !selectedUserId" @click="handleImportPlaylistData">导入</button>
            </div>
          </div>
          <div class="setting-row !py-3.5">
            <div class="info">
              <b>播放数据</b>
              <span>导出或导入用户的播放记录统计</span>
            </div>
            <div class="control flex items-center gap-2.5 flex-wrap justify-end">
              <button type="button" class="btn btn-sm" :disabled="busy || !selectedUserId" @click="handleExportUserHitData">导出</button>
              <input type="file" ref="fileHitJson" accept="application/json" class="text-[12px] text-ink-3 max-w-48" :disabled="busy" />
              <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !selectedUserId" @click="handleImportHitData">导入</button>
            </div>
          </div>
          <div class="setting-row !py-3.5">
            <div class="info">
              <b>Fav 数据</b>
              <span>导出或导入用户的收藏数据</span>
            </div>
            <div class="control flex items-center gap-2.5 flex-wrap justify-end">
              <button type="button" class="btn btn-sm" :disabled="busy || !selectedUserId" @click="handleExportUserFavData">导出</button>
              <input type="file" ref="fileFavJson" accept="application/json" class="text-[12px] text-ink-3 max-w-48" :disabled="busy" />
              <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !selectedUserId" @click="handleImportFavData">导入</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Operation Info -->
    <div class="card">
      <div class="card-header"><h2>Operation Info</h2></div>
      <div class="card-pad !p-3">
        <div class="log-viewer !max-h-40 whitespace-pre-wrap">{{ optInfo || '暂无操作记录' }}</div>
      </div>
    </div>
  </div>
</template>
