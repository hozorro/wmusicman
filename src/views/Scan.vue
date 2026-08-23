<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useRequest } from 'alova/client'
import { type ScanState, scanState } from '@/composables/key'
import { busyState, type BusyState } from '@/composables/busy'
import { getScanFolder, startScan, stopScan } from '@/apis/methods/manage'
import dayjs from 'dayjs'

const isIncremental = ref(false)
const { data: folder } = useRequest(getScanFolder)
const { scanInfo, initScanState } = inject<ScanState>(scanState) as ScanState
// While any global task is running, starting a scan is disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

// Read-only derived progress percentage
const scanPct = computed(() => {
  const p = scanInfo.value.scan_progress
  return p.total > 0 ? p.processed / p.total * 100 : 0
})

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
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Scanner</h1>
        <p>扫描音乐库目录，同步曲目与元数据</p>
      </div>
      <div class="sp actions">
        <button v-if="scanInfo.is_scanning" type="button" class="btn btn-danger" @click="handleScan">Stop Scanning</button>
        <button v-else type="button" class="btn btn-primary" :disabled="busy" @click="handleScan">Start Scanning</button>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-header"><h2>Scan Folders</h2></div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>path</th>
                <th class="w-[20%]">created</th>
                <th class="w-[20%]">last update</th>
              </tr>
            </thead>
            <tbody v-if="folder">
              <tr>
                <td :title="folder.path">{{ folder.path }}</td>
                <td class="num">{{ dayjs(folder.created_at).format() }}</td>
                <td class="num">{{ folder.last_update ? dayjs(folder.last_update).format() : '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!folder" class="state-box !py-8">No folder to scan</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Scan Options</h2></div>
        <div class="card-pad flex flex-col gap-4">
          <label class="check" for="incremental">
            <input type="checkbox" id="incremental" v-model="isIncremental" :disabled="busy" /> Incremental
          </label>
          <p class="text-[12.5px] text-ink-3 leading-relaxed">
            When maintaining, <b>Incremental</b> scan suggested to keep entity id consistent with before.
          </p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h2>Scan Progress</h2></div>
      <div v-if="scanInfo.is_scanning" class="card-pad">
        <div class="flex items-center gap-3">
          <div class="progress progress-lg progress-striped flex-1">
            <div class="bar" :style="{ width: scanPct + '%' }"></div>
          </div>
          <span class="w-14 text-right text-[13px] font-semibold text-ink-2 num">{{ scanPct.toFixed(1) }}%</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
          <div class="kpi">
            <div class="kpi-k">Total</div>
            <div class="kpi-v !text-xl">{{ scanInfo.scan_progress.total }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k">Processed</div>
            <div class="kpi-v !text-xl">{{ scanInfo.scan_progress.processed }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k text-ok-ink">Success</div>
            <div class="kpi-v !text-xl text-ok">{{ scanInfo.scan_progress.success }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k text-bad-ink">Failed</div>
            <div class="kpi-v !text-xl text-bad">{{ scanInfo.scan_progress.failed }}</div>
          </div>
        </div>
        <div class="mt-3 text-[12.5px] text-ink-3 truncate">
          Current: <span class="text-ink-2">{{ scanInfo.scan_progress.current_file }}</span>
        </div>
      </div>
      <div v-else class="state-box !py-8">No scan progress</div>
    </div>
  </div>
</template>
