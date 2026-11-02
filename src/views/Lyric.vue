<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  initLyricIndex,
  cancelLyricInit,
  fetchLyrics,
  getLyricStatus,
  importLyricFetchResult,
  exportLyricBestPending,
  importLyricBestResult,
} from '@/apis/methods/lyric'
import { getFilenameFromHeaders, saveBlob } from '@/utils/download'
import WFile from '@/components/WFile.vue'

const POLL_INTERVAL = 1500

const status = ref<LyricStatusInfo | null>(null)
const busy = ref(false)
const fetchLimit = ref(1000)
const exportLimit = ref<number | null>(null)
const fileFetchCsv = ref<File | null>(null)
const fileBestJson = ref<File | null>(null)
const optInfo = ref<string[]>([])
// keep the last known progress so the numbers stay after the backend resets them
const lastProgress = ref<LyricInitProgress | null>(null)

const log = (msg: string) => {
  optInfo.value.push(msg)
}

function errText(e: unknown) {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message?: unknown }).message)
  }
  return String(e)
}

let timer: number | null = null
function stopPolling() {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}
function startPolling() {
  if (timer !== null) return
  timer = window.setInterval(refreshStatus, POLL_INTERVAL)
}

async function refreshStatus() {
  try {
    const info = await getLyricStatus()
    status.value = info
    if (info.progress) lastProgress.value = { ...info.progress }
  } catch {
    // the global api error handler already reports the failure
  }
}

// init runs in a background task: poll while it is running, stop when it ends
watch(() => status.value?.is_initializing, (val) => {
  if (val) startPolling()
  else stopPolling()
})

onMounted(refreshStatus)
onUnmounted(stopPolling)

const fetchStatusRows = computed(() => [
  { label: 'ok', value: status.value?.status?.ok ?? 0, cls: 'text-ok' },
  { label: 'pending', value: status.value?.status?.pending ?? 0, cls: 'text-warn' },
  { label: 'failed', value: status.value?.status?.failed ?? 0, cls: 'text-bad' },
  { label: 'review', value: status.value?.status?.review ?? 0, cls: 'text-info' },
  { label: 'skip', value: status.value?.status?.skip ?? 0, cls: 'text-ink-3' },
])

const bestStatusRows = computed(() => [
  { label: 'pending', value: status.value?.best_status?.pending ?? 0, cls: 'text-warn' },
  { label: 'extracted', value: status.value?.best_status?.extracted ?? 0, cls: 'text-ok' },
  { label: 'skip', value: status.value?.best_status?.skip ?? 0, cls: 'text-ink-3' },
])

const progress = computed(() => status.value?.progress ?? lastProgress.value)
const initProgress = computed(() => status.value?.progress ?? null)

const initPct = computed(() => {
  const p = initProgress.value
  if (!p || p.total === 0) return 0
  return Math.min(100, p.processed / p.total * 100)
})

function headerValue(headers: any, name: string) {
  return headers?.[name] ?? headers?.get?.(name) ?? '-'
}

async function handleInit() {
  busy.value = true
  try {
    await initLyricIndex()
    log('已提交歌词索引初始化任务，进度将自动刷新...')
    if (status.value) status.value.is_initializing = true
    else await refreshStatus()
  } catch (e) {
    log(`初始化失败: ${errText(e)}`)
  } finally {
    busy.value = false
  }
}

async function handleCancel() {
  busy.value = true
  try {
    await cancelLyricInit()
    log('已请求取消初始化，当前批次结束后停止...')
  } catch (e) {
    log(`取消失败: ${errText(e)}`)
  } finally {
    busy.value = false
  }
}

async function handleFetch() {
  busy.value = true
  try {
    await fetchLyrics(fetchLimit.value)
    log(`已提交增量歌词抓取任务，最多 ${fetchLimit.value} 首，结果由后台回写...`)
  } catch (e) {
    log(`提交抓取任务失败: ${errText(e)}`)
  } finally {
    busy.value = false
  }
}

async function handleImportFetchCsv() {
  if (!fileFetchCsv.value) return
  busy.value = true
  const formData = new FormData()
  formData.append('file', fileFetchCsv.value)
  try {
    const result = await importLyricFetchResult(formData)
    log(`抓取结果导入完成: 行数 ${result.rows}, 匹配 ${result.matched}, 更新 ${result.updated}, 未匹配 ${result.unmatched}, 落盘 ${result.written}, 状态非法 ${result.invalid_status}`)
    fileFetchCsv.value = null
    await refreshStatus()
  } catch (e) {
    log(`抓取结果导入失败: ${errText(e)}`)
  } finally {
    busy.value = false
  }
}

async function handleExportBest() {
  busy.value = true
  try {
    const limit = exportLimit.value && exportLimit.value > 0 ? exportLimit.value : undefined
    const res: any = await exportLyricBestPending(limit)
    const count = headerValue(res?.headers, 'x-exported-count')
    saveBlob(res.data, getFilenameFromHeaders(res.headers, 'lyric_best_pending.json'))
    log(`已导出 ${count} 条待提取记录，本轮未返回结果的记录会在导入时标记为 skip`)
    await refreshStatus()
  } catch (e) {
    log(`导出失败: ${errText(e)}`)
  } finally {
    busy.value = false
  }
}

async function handleImportBestJson() {
  if (!fileBestJson.value) return
  busy.value = true
  const formData = new FormData()
  formData.append('file', fileBestJson.value)
  try {
    const result = await importLyricBestResult(formData)
    log(`best 导入完成: 记录 ${result.rows}, 匹配 ${result.matched}, 提取 ${result.extracted}, 未匹配 ${result.unmatched}, 跳过 ${result.skip} (无歌词 ${result.no_lyric} / 提取失败 ${result.extract_failed})`)
    fileBestJson.value = null
    await refreshStatus()
  } catch (e) {
    log(`best 导入失败: ${errText(e)}`)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Lyrics</h1>
        <p>歌词索引维护、增量抓取与 best 歌词提取</p>
      </div>
      <div class="sp actions">
        <button
          v-if="status?.is_initializing"
          type="button"
          class="btn btn-danger"
          :disabled="busy"
          @click="handleCancel"
        >Cancel Init</button>
        <button
          v-else
          type="button"
          class="btn btn-primary"
          :disabled="busy"
          @click="handleInit"
        >Init Index</button>
        <button
          type="button"
          class="btn"
          :disabled="busy || status?.is_initializing"
          @click="handleFetch"
        >Fetch Lyrics</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>歌词库统计</h2>
        <span class="sp"></span>
        <span v-if="status?.is_initializing" class="tag tag-cyan animate-soft-pulse">初始化进行中</span>
        <span v-else class="tag tag-gray">已落盘 {{ status?.written ?? 0 }} 首</span>
      </div>
      <div class="card-pad grid gap-6 md:grid-cols-2">
        <div>
          <div class="mb-2.5 text-[12.5px] font-semibold text-ink-3 uppercase tracking-tight">歌词抓取状态</div>
          <div class="grid grid-cols-2 gap-3.5 md:grid-cols-5">
            <div v-for="row in fetchStatusRows" :key="row.label" class="kpi">
              <div class="kpi-k">{{ row.label }}</div>
              <div class="kpi-v !text-xl" :class="row.cls">{{ row.value }}</div>
            </div>
          </div>
        </div>
        <div>
          <div class="mb-2.5 text-[12.5px] font-semibold text-ink-3 uppercase tracking-tight">Best 提取状态</div>
          <div class="grid grid-cols-3 gap-3.5">
            <div v-for="row in bestStatusRows" :key="row.label" class="kpi">
              <div class="kpi-k">{{ row.label }}</div>
              <div class="kpi-v !text-xl" :class="row.cls">{{ row.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>索引初始化进度</h2>
        <span class="sp"></span>
        <span v-if="status?.is_initializing" class="tag tag-cyan animate-soft-pulse">正在索引歌词文件...</span>
      </div>

      <div v-if="status?.is_initializing && initProgress" class="card-pad flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="progress progress-lg progress-striped flex-1">
            <div class="bar" :style="{ width: initPct + '%' }"></div>
          </div>
          <span class="w-16 text-right text-[13px] font-semibold text-ink-2 num">{{ initPct.toFixed(1) }}%</span>
        </div>
        <div class="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <div class="kpi">
            <div class="kpi-k">Total</div>
            <div class="kpi-v !text-xl">{{ initProgress?.total }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k">Processed</div>
            <div class="kpi-v !text-xl">{{ initProgress?.processed }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k text-ok-ink">Indexed</div>
            <div class="kpi-v !text-xl text-ok">{{ initProgress?.ok }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k">Pending</div>
            <div class="kpi-v !text-xl text-warn">{{ initProgress?.pending }}</div>
          </div>
        </div>
        <div class="text-[12.5px] text-ink-3 truncate">
          Current: <span class="text-ink-2">{{ initProgress?.current_file }}</span>
        </div>
      </div>

      <div v-else-if="progress && progress.processed > 0" class="card-pad">
        <div class="mb-3 text-[14px] font-semibold text-ink-1">上次初始化结果</div>
        <div class="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <div class="kpi">
            <div class="kpi-k">Total</div>
            <div class="kpi-v !text-xl">{{ progress.total }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k">Processed</div>
            <div class="kpi-v !text-xl">{{ progress.processed }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k text-ok-ink">Indexed</div>
            <div class="kpi-v !text-xl text-ok">{{ progress.ok }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k">Pending</div>
            <div class="kpi-v !text-xl text-warn">{{ progress.pending }}</div>
          </div>
        </div>
      </div>

      <div v-else class="state-box !py-8">无初始化进度</div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Best 歌词提取</h2>
        <span class="sp"></span>
        <span class="text-[12.5px] text-ink-3">流程：导出 pending → 外部提取 → 导入结果</span>
      </div>
      <div class="card-pad !py-2">
        <div class="setting-row !py-3.5">
          <div class="info">
            <b>导出待提取记录</b>
            <span>导出全部 best_status 为 pending 的歌词，供外部程序提取 best</span>
          </div>
          <div class="control flex flex-none items-center gap-3">
            <input
              v-model.number="exportLimit"
              type="number"
              min="1"
              placeholder="不限条数"
              class="input w-28"
              :disabled="busy"
            />
            <button type="button" class="btn btn-sm" :disabled="busy" @click="handleExportBest">导出</button>
          </div>
        </div>

        <div class="setting-row !py-3.5">
          <div class="info">
            <b>导入提取结果</b>
            <span>上传外部程序产出的 JSON（<code>[{"path":"...","best":"..."}]</code>）</span>
          </div>
          <div class="control flex flex-none items-center gap-3">
            <WFile v-model="fileBestJson" accept="application/json,.json" />
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="busy || !fileBestJson"
              @click="handleImportBestJson"
            >导入</button>
          </div>
        </div>

        <div class="setting-row !py-3.5">
          <div class="info">
            <b>导入抓取结果</b>
            <span>上传外部 sqlite 工具导出的歌词抓取结果 CSV</span>
          </div>
          <div class="control flex flex-none items-center gap-3">
            <WFile v-model="fileFetchCsv" accept=".csv,text/csv" />
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="busy || !fileFetchCsv"
              @click="handleImportFetchCsv"
            >导入</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card flex flex-col">
      <div class="card-header">
        <h2>Operation Info</h2>
        <span class="sp"></span>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="optInfo.length === 0"
          @click="optInfo = []"
        >清空</button>
      </div>
      <div class="card-pad !p-3">
        <div class="log-viewer bg-ink-3/10 whitespace-pre-wrap max-h-80 overflow-y-auto">
          <template v-if="optInfo.length > 0">
            <div v-for="(info, index) in optInfo" :key="index">{{ info }}</div>
          </template>
          <div v-else>暂无操作记录</div>
        </div>
      </div>
    </div>
  </div>
</template>
