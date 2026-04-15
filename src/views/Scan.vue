<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRequest } from 'alova/client'
import { type ScanState, scanState } from '@/composables/key'
import { getScanFolder, startScan, stopScan } from '@/apis/methods/manage'
import dayjs from 'dayjs'

const isIncremental = ref(false)
const { data: folder } = useRequest(getScanFolder)
const { scanInfo, initScanState } = inject<ScanState>(scanState) as ScanState

async function handleScan() {
  if(scanInfo.value.is_scanning) { 
    await stopScan()
    initScanState()
  } else {
    initScanState()
    await startScan(isIncremental.value)
    scanInfo.value.is_scanning = true
  }
}
</script>

<template>
  <div class=" my-2">
    <input type="checkbox" class=" mr-2" v-model="isIncremental" id="incremental" />
    <label for="incremental">Incremental</label>
    <button type="button" class=" ml-2 p-2 w-36" @click="handleScan">
      {{ scanInfo.is_scanning ? 'Stop Scanning' : 'Start Scanning' }}
    </button>
    <span class=" ml-2 text-gray-600 text-sm">When maintaining, <b>Incremental</b> scan suggested to keep entity id consistent with before.</span>
  </div>
  <div class=" my-1 text-xl font-bold">Scan Folders</div>
  <div class=" my-2 p-2 w-full bg-gray-100 rounded-md shadow-md">
    <table width="100%">
      <thead class=" border-b border-b-gray-300">
        <tr>
          <th class=" p-1">path</th>
          <th class=" p-1" width="20%">created</th>
          <th class=" p-1" width="20%">last update</th>
        </tr>
      </thead>
      <tbody v-if="folder">
        <tr>
          <td class=" p-1">{{ folder.path }}</td>
          <td class=" p-1 text-center">{{ dayjs(folder.created_at).format() }}</td>
          <td class=" p-1 text-center">{{ folder.last_update ? dayjs(folder.last_update).format() : '-' }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="!folder" class=" mx-auto mt-2">No folder to scan</div>
  </div>
  <hr class=" my-2 text-gray-300" />
  <div class=" my-1 text-xl font-bold">Scan Progress</div>
  <div v-if="scanInfo.is_scanning">
    <div class=" relative mt-2 w-full h-8 bg-gray-300 text-cyan-700 rounded-md">
      <div class=" absolute top-0 left-0 p-1 h-full bg-cyan-300/50 rounded-md overflow-hidden text-center" 
      :style="{width:`${scanInfo.scan_progress.processed / scanInfo.scan_progress.total * 100}%`}">
      {{ scanInfo.scan_progress.processed ? (scanInfo.scan_progress.processed / scanInfo.scan_progress.total * 100).toFixed(2) : 0 }}%
    </div>
    </div>
    <div class=" mt-2 p-2 grid grid-cols-[6rem_1fr]">
      <div>Total:</div>
      <div>{{ scanInfo.scan_progress.total }}</div>
      <div>Processed:</div>
      <div>{{ scanInfo.scan_progress.processed }}</div>
      <div>Success:</div>
      <div>{{ scanInfo.scan_progress.success }}</div>
      <div>Failed:</div>
      <div>{{ scanInfo.scan_progress.failed }}</div>
      <div>Current:</div>
      <div>{{ scanInfo.scan_progress.current_file }}</div>
    </div>
  </div>
  <div v-else>No scan progress</div>
</template>