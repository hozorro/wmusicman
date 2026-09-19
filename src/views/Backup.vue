<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'
import { getUserList, exportUserPlaylistData, exportUserHitData, exportUserFavData, importUserPlaylistData, importUserHitData, importUserFavData } from '@/apis/methods/manage'
import dayjs from 'dayjs'
import WFile from '@/components/WFile.vue'
import { getFilenameFromHeaders, saveBlob } from '@/utils/download'

// While any global task is running, export/import entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const users = ref<UserDetail[]>([])
const selectedUserId = ref<number>()
const selectedUser = computed(() => users.value.find(user => user.id == selectedUserId.value))
const playlistImportMode = ref<'merge'|'replace'|'skip'>('merge')
const assocArtists = ref<boolean>(false)
const filePlaylistJson = ref<File | null>(null)
const fileHitJson = ref<File | null>(null)
const fileFavJson = ref<File | null>(null)
const optInfo = ref<string[]>([])

onMounted(async () => { 
  users.value = await getUserList()
})

const showOperationInfo = (result: ImportResult) => {
  optInfo.value.push(`导入完成: 总数 - ${result.total}, 成功 - ${result.success}, 跳过 - ${result.skipped}, 失败 - ${result.failed}`)
  if(result.errors.length > 0){
    optInfo.value.push(`--错误信息：`)
    result.errors.forEach(error => {
      optInfo.value.push(` ----${error}`)
    })
  }
}
async function handleExportUserPlaylistData() { 
  if(selectedUserId.value){
    optInfo.value.push(`开始导出用户${selectedUser.value?.username}的歌单数据...`)
    const res: any = await exportUserPlaylistData(selectedUserId.value)
    saveBlob(res.data, getFilenameFromHeaders(res.headers, `user_${selectedUserId.value}_playlists.json`))
    optInfo.value.push(`导出完成: user_${selectedUserId.value}_playlists.json`)
  }
}
async function handleImportPlaylistData() { 
  if(filePlaylistJson.value && selectedUserId.value) {
    const formData = new FormData()
    formData.append('file', filePlaylistJson.value)
    formData.append('mode', playlistImportMode.value)
    formData.append('user_id', selectedUserId.value.toString())
    optInfo.value.push(`开始导入用户${selectedUser.value?.username}的歌单数据...`)
    const result = await importUserPlaylistData(formData)
    showOperationInfo(result)
  }
}
async function handleExportUserHitData() { 
  if(selectedUserId.value){
    optInfo.value.push(`开始导出用户${selectedUser.value?.username}的播放数据...`)
    const res: any = await exportUserHitData(selectedUserId.value)
    saveBlob(res.data, getFilenameFromHeaders(res.headers, `user_${selectedUserId.value}_hit.json`))
    optInfo.value.push(`导出完成: user_${selectedUserId.value}_hit.json`)
  }
}
async function handleImportHitData() { 
  if(fileHitJson.value &&  selectedUserId.value) {
    const formData = new FormData()
    formData.append('file', fileHitJson.value)
    formData.append('user_id', selectedUserId.value?.toString())
    optInfo.value.push(`开始导入用户${selectedUser.value?.username}的播放数据...`)
    const result = await importUserHitData(formData)
    showOperationInfo(result)
  }
}
async function handleExportUserFavData() { 
  if(selectedUserId.value){
    optInfo.value.push(`开始导出用户${selectedUser.value?.username}的收藏数据...`)
    const res: any = await exportUserFavData(selectedUserId.value)
    saveBlob(res.data, getFilenameFromHeaders(res.headers, `user_${selectedUserId.value}_fav.json`))
    optInfo.value.push(`导出完成: user_${selectedUserId.value}_fav.json`)
  }
}
async function handleImportFavData() { 
  if(fileFavJson.value && selectedUserId.value) {
    const formData = new FormData()
    formData.append('file', fileFavJson.value)
    formData.append('user_id', selectedUserId.value?.toString())
    optInfo.value.push(`开始导入用户${selectedUser.value?.username}的收藏数据...`)
    const result = await importUserFavData(formData)
    showOperationInfo(result)
  }
}
</script>

<template>
  <div class="flex flex-col h-full gap-4 animate-fade-in">
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

    <div class="two-col items-stretch">
      <!-- 用户选择 -->
      <div class="card">
        <div class="card-header"><h2>选择用户</h2></div>
        <div class="card-pad overflow-y-auto">
          <div 
            v-for="user in users" :key="user.id" 
            class=" grid grid-cols-[10px_1fr_60px_60px_200px_160px] gap-3 text-sm p-2 cursor-default" 
            :class="{'bg-info/20 rounded-md': selectedUserId == user.id}"
            @click="selectedUserId = user.id"
          >
            <div class=" text-ink-3">{{ user.id }}</div>
            <div class=" text-ink-2">{{ user.username }}</div>
            <div class=" text-ink-3">{{ user.is_admin ? 'admin' : 'user' }}</div>
            <div class=" text-ink-3">{{ user.client_type }}</div>
            <div class=" text-ink-3 truncate">{{ user.device_id }}</div>
            <div class=" text-ink-3">{{ dayjs(user.last_login_at).format('YYYY-MM-DD HH:mm:ss') }}</div>
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
            <div class="control flex flex-none w-96 items-center gap-4 flex-wrap justify-end">
              <div class="flex-none w-16">
                <button type="button" class="btn btn-sm" :disabled="busy || !selectedUserId" @click="handleExportUserPlaylistData">导出</button>
              </div>
              <div class=" flex justify-end items-center gap-3 px-4 py-2 bg-accent/5 rounded-md">
                <div class=" flex-none">
                  <div>
                    <WFile v-model="filePlaylistJson" class="w-44" accept="application/json" :disabled="busy" />
                  </div>
                  <div class=" mt-2">
                    <label class="check"><input type="radio" v-model="playlistImportMode" value="merge" :disabled="busy" />合并</label>
                    <label class="check ml-2"><input type="radio" v-model="playlistImportMode" value="replace" :disabled="busy" />替换</label>
                    <label class="check ml-2"><input type="radio" v-model="playlistImportMode" value="skip" :disabled="busy" />跳过</label>
                  </div>
                </div>
                <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !selectedUserId" @click="handleImportPlaylistData">导入</button>
              </div>
            </div>
          </div>
          <div class="setting-row !py-3.5">
            <div class="info">
              <b>播放数据</b>
              <span>导出或导入用户的播放记录统计 <br />(<span class="text-warn">导出仅歌曲，可关联生成歌手播放数据</span>)</span>
            </div>
            <div class="control flex flex-none w-96 items-center gap-4 flex-wrap justify-end">
              <div class="flex-none w-16">
                <button type="button" class="btn btn-sm" :disabled="busy || !selectedUserId" @click="handleExportUserHitData">导出</button>
              </div>
              <div class=" flex justify-end items-center gap-3 px-4 py-2 bg-accent/5 rounded-md">
                <div class="flex-none">
                  <div>
                    <WFile v-model="fileHitJson" class="w-44" accept="application/json" :disabled="busy" />
                  </div>
                  <div class=" mt-2">
                    <label class="check"><input type="checkbox" v-model="assocArtists" :disabled="busy" />关联生成歌手播放数据</label>
                  </div>
                </div>
                <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !selectedUserId" @click="handleImportHitData">导入</button>
              </div>
            </div>
          </div>
          <div class="setting-row !py-3.5">
            <div class="info">
              <b>Fav 数据</b>
              <span>导出或导入用户的收藏数据 (<span class="text-warn">仅歌曲</span>)</span>
            </div>
            <div class="control flex flex-none w-96 items-center gap-4 flex-wrap justify-end">
              <div class="flex-none w-16">
                <button type="button" class="btn btn-sm" :disabled="busy || !selectedUserId" @click="handleExportUserFavData">导出</button>
              </div>
              <div class=" flex justify-end items-center gap-3 px-4 py-2 bg-accent/5 rounded-md">
                <WFile v-model="fileFavJson" class="w-44" accept="application/json" :disabled="busy" />
                <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !selectedUserId" @click="handleImportFavData">导入</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Operation Info -->
    <div class="card flex flex-col flex-1">
      <div class="card-header flex-none"><h2>Operation Info</h2></div>
      <div class="card-pad !p-3 flex-1 h-full">
        <div class="log-viewer bg-ink-3/10 whitespace-pre-wrap h-full">
          <template v-if="optInfo.length > 0">
            <div v-for="(info, index) in optInfo" :key="index">{{ info }}</div>
          </template>
          <div v-else>暂无操作记录</div>
        </div>
      </div>
    </div>
  </div>
</template>
