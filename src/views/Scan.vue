<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import { type ScanState, scanState } from '@/composables/key'
import { getFolderStatus, scanFolders, getScanStatus } from '@/apis/methods/manage'

const flag = ref(0)
const startScan = 'Start scanning...'
const scanInfo = ref('')
const scannedNum = ref(0)
const folders = ref<ScanFolder[]>()
const {scanned, updateScanned} = inject<ScanState>(scanState) as ScanState
const flashMsg = ref('')
const displayFlash = computed(() => {
  if(flashMsg.value != ''){
    return 'block'
  }else{
    return 'none'
  }
})
function sleep(interval: number) {
  return new Promise(resolve => {
    setTimeout(resolve, interval)
  })
}

function loadFolderStatus() {
  getFolderStatus().then((res) => {
    if(res.code == 200){
      folders.value = res.data
    }
  })
}

async function handleScan() {
  scanInfo.value = startScan
  let res = await scanFolders()
  if(res.code == 200){
    if(res.msg != 'ok'){
      flag.value = 0
      flashMsg.value = res.msg
      scanInfo.value = startScan + '\nFailed: ' + res.msg
      setTimeout(() => {
        flashMsg.value = ''
      }, 3000)
    }else{
      flag.value = 1
      refreshScanProgress()
    }
  }
}
async function refreshScanProgress() {
  while(flag.value == 1){
    await sleep(2000)
    let res = await getScanStatus()
    if(res.code == 200){
      if(res.data != -1){
        scannedNum.value = res.data
        updateScanned(res.data)
        scanInfo.value = `${startScan}\n${scannedNum.value} files scanned.`
      }else{
        flag.value = 2
        scanInfo.value += '\nDone'
        updateScanned(-1)
      }
    }
  }
  console.log('scan interrupted of finished')
}

onMounted(() => {
  loadFolderStatus()
  if(scanned.value != -1){
    flag.value = 1
    refreshScanProgress()
  }
})
onBeforeUnmount(() => {
  flag.value = 0
})
</script>

<template>
  <div class=" absolute top-0 left-0 hidden w-full h-10 p-2 bg-red-100 rounded-md shadow-md" :style="{display:displayFlash}">{{ flashMsg }}</div>
  <div class=" my-2">
    <button type="button" class=" mr-2 p-2 w-28" @click="handleScan">扫描音乐库</button>
  </div>
  <div class=" my-1 text-xl font-bold">Scan Folders</div>
  <div class=" my-2 p-2 w-full bg-gray-100 rounded-md shadow-md">
    <table width="100%">
      <thead>
        <tr>
          <th width="15%">name</th>
          <th>path</th>
          <th width="20%">created</th>
          <th width="20%">last scan</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in folders" :key="index">
          <td>{{ item.name }}</td>
          <td>{{ item.path }}</td>
          <td>{{ item.created }}</td>
          <td>{{ item.last_scan }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <hr class=" my-2 text-gray-300" />
  <div class=" my-1 text-xl font-bold">Scan Info</div>
  <div class=" p-2 w-full h-20 bg-gray-800 text-green-300 rounded-md whitespace-pre-wrap">
    {{ scanInfo }}
  </div>
</template>