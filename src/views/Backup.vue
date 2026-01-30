<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef } from 'vue'
import { getUserList, exportUserPlaylistData, exportUserHitData, exportUserFavData, importUserPlaylistData, importUserHitData, importUserFavData } from '@/apis/methods/manage'

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
  <div class=" my-2 flex w-full">
    <div class=" flex-none w-48">
      <select v-model="selectedUserId" size="10" class=" w-full p-2 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500">
        <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
      </select>
    </div>
    <div class=" flex-1 ml-4">
      <div class=" rounded-md bg-gray-100"><strong>用户：</strong>{{ selectedUser?.username }} (上次登录于{{ selectedUser?.last_login_at }})</div>
      <div class=" my-2 grid grid-cols-[20rem_1fr] gap-1">
        <div class=" my-2">
          <span>导出</span><span class=" text-cyan-600">{{selectedUser?.username || '用户'}}</span><span>歌单数据：</span>
          <button type="button" class=" p-1 w-20" @click="handleExportUserPlaylistData">导出</button>
        </div>
        <div class=" my-2"> 
          <span>导入歌单数据到</span><span class=" text-cyan-600">{{selectedUser?.username || '用户'}}</span><span>：</span>
          <input type="file" ref="filePlaylistJson" accept="application/json" class=" w-48 text-sm text-gray-500" />
          <input type="checkbox" v-model="isUpdate" class=" ml-2" />覆盖已有歌单
          <button type="button" class=" ml-1 p-1 w-20" @click="handleImportPlaylistData">导入</button>
        </div>
        <div class=" my-2">
          <span>导出</span><span class=" text-cyan-600">{{selectedUser?.username || '用户'}}</span><span>播放数据：</span>
          <button type="button" class=" p-1 w-20" @click="handleExportUserHitData">导出</button>
        </div>
        <div class=" my-2"> 
          <span>导入播放数据到</span><span class=" text-cyan-600">{{selectedUser?.username || '用户'}}</span><span>：</span>
          <input type="file" ref="fileHitJson" accept="application/json" class=" w-48 text-sm text-gray-500" />
          <button type="button" class=" ml-2 p-1 w-20" @click="handleImportHitData">导入</button>
        </div>
        <div class=" my-2">
          <span>导出</span><span class=" text-cyan-600">{{selectedUser?.username || '用户'}}</span><span>Fav数据：</span>
          <button type="button" class=" p-1 ml-2 w-20" @click="handleExportUserFavData">导出</button>
        </div>
        <div class=" my-2"> 
          <span>导入Fav数据到</span><span class=" text-cyan-600">{{selectedUser?.username || '用户'}}</span><span>：</span>
          <input type="file" ref="fileFavJson" accept="application/json" class=" w-48 text-sm text-gray-500" />
          <button type="button" class=" ml-3 p-1 w-20" @click="handleImportFavData">导入</button>
        </div>
      </div>
    </div>
  </div>
  <div class=" my-2 text-red-500 text-sm font-black">
    备份或恢复歌单时，会一次性备份或恢复所有歌单，如要备份或恢复部分歌单，可到Playlist页面进行操作。
  </div>
  <hr class=" my-2 text-gray-300" />
  <div class=" my-1 text-xl font-bold">Operation Info</div>
  <div class=" p-2 w-full h-20 bg-gray-800 text-green-300 rounded-md whitespace-pre-wrap">
    {{ optInfo }}
  </div>
</template>