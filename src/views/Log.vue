<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getLogTypes, getLogs, exportLogs } from '@/apis/methods/manage'

const logInfo = ref<LogTypes>()
const logs = ref<LogItem[]>()
const logType = ref<string>('')
const logLevel = ref<string>('')
const logStartTime = ref<string>()
const logEndTime = ref<string>()
const keyword = ref<string>()
const curPage = ref<number>(1)
const pageSize = ref<number>(50)
const pager = ref<{total: number, page_size: number, page: number, total_pages: number}>()

onMounted(() => {
  getLogTypes().then(res => {
    logInfo.value = res
  })
  logEndTime.value = new Date().toISOString().slice(0, 16)
  logStartTime.value = new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString().slice(0, 16)
})
function handleLogs() {
  getLogs(logType.value, logLevel.value, keyword.value, logStartTime.value, logEndTime.value, curPage.value, pageSize.value).then(res => {
    logs.value = res.logs
    pager.value = res.pagination
  })
}
function handleExport() {
  exportLogs(logType.value, logLevel.value, keyword.value, logStartTime.value, logEndTime.value)
}
function handlePrev() {
  curPage.value--
  handleLogs()
}
function handleNext() {
  curPage.value++
  handleLogs()
}
// Read-only tag style mapping for log levels
function levelTag(level: string) {
  const l = (level || '').toUpperCase()
  if (l.includes('ERROR') || l.includes('CRITICAL') || l.includes('FATAL')) return 'tag-bad'
  if (l.includes('WARN')) return 'tag-warn'
  if (l.includes('INFO')) return 'tag-info'
  return 'tag-gray'
}
</script>
<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Logs</h1>
        <p>查询与导出系统运行日志</p>
      </div>
      <div class="sp actions">
        <button type="button" class="btn btn-primary" @click="handleLogs">获取日志</button>
        <button type="button" class="btn" @click="handleExport">导出日志</button>
      </div>
    </div>

    <!-- 筛选条 -->
    <div class="card">
      <div class="card-pad !py-3.5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div class="flex items-center gap-2">
          <label class="text-[12.5px] text-ink-3 flex-none">日志类型</label>
          <select v-model="logType" class="select !w-32">
            <option value="" selected>全部</option>
            <option v-for="(l,i) in logInfo?.log_types" :key="i" :value="l.value">{{ l.label }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[12.5px] text-ink-3 flex-none">日志级别</label>
          <select v-model="logLevel" class="select !w-32">
            <option value="" selected>全部</option>
            <option v-for="(l,i) in logInfo?.log_levels" :key="i" :value="l.value">{{ l.label }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[12.5px] text-ink-3 flex-none">开始时间</label>
          <input type="datetime-local" v-model="logStartTime" class="input !w-48" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[12.5px] text-ink-3 flex-none">结束时间</label>
          <input type="datetime-local" v-model="logEndTime" class="input !w-48" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[12.5px] text-ink-3 flex-none">关键词</label>
          <input type="text" v-model="keyword" class="input !w-44" placeholder="按关键词过滤" />
        </div>
      </div>
    </div>

    <!-- 日志表格 -->
    <div class="card flex-1 min-h-0 flex flex-col">
      <div class="tbl-wrap flex-1 min-h-0 overflow-auto">
        <table class="tbl">
          <thead class="sticky top-0 z-10">
            <tr>
              <th class="w-48">时间</th>
              <th class="w-40">日志器</th>
              <th class="w-24">级别</th>
              <th class="w-52">位置</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(l,i) in logs" :key="i">
              <td class="num text-ink-3">{{ l.time }}</td>
              <td>{{ l.logger }}</td>
              <td><span class="tag" :class="levelTag(l.level)">{{ l.level }}</span></td>
              <td class="text-ink-3">{{ l.location }}</td>
              <td class="text-ink-2">{{ l.message }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!logs?.length" class="state-box !py-12">
          <b>暂无日志</b>
          <span>调整筛选条件后点击「获取日志」</span>
        </div>
      </div>
      <div class="flex items-center gap-2 px-4 py-3 border-t border-line">
        <button type="button" class="btn btn-sm" v-if="curPage > 1" @click="handlePrev">上一页</button>
        <span class="text-[13px] text-ink-2 num px-2">{{ curPage }}</span>
        <button type="button" class="btn btn-sm" v-if="pager && curPage < pager.total_pages" @click="handleNext">下一页</button>
        <span class="sp"></span>
        <span v-if="pager" class="text-[12.5px] text-ink-3 num">共 {{ pager.total }} 条 / {{ pager.total_pages }} 页</span>
      </div>
    </div>
  </div>
</template>
