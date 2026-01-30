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
</script>
<template>
  <div class=" flex flex-col h-full">
    <div class=" flex-none p-2 rounded-md bg-white">
      <div>
        日志类型：<select v-model="logType" class=" mr-2 p-1 w-28 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500">
          <option value="" selected>全部</option>
          <option v-for="(l,i) in logInfo?.log_types" :key="i" :value="l.value">{{ l.label }}</option>
        </select>
        日志级别：<select v-model="logLevel" class=" mr-2 p-1 w-28 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500">
          <option value="" selected>全部</option>
          <option v-for="(l,i) in logInfo?.log_levels" :key="i" :value="l.value">{{ l.label }}</option>
        </select>
      </div>
      <div class=" mt-2">
        开始时间：<input type="datetime-local" v-model="logStartTime" class=" mr-2 p-1 w-44 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500" />
        结束时间：<input type="datetime-local" v-model="logEndTime" class=" mr-2 p-1 w-44 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500" />
        关键词：<input type="text" v-model="keyword" class=" mr-2 p-1 w-44 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500" />
      </div>
      <div class=" mt-2">
        <button type="button" class=" mr-2 p-1 w-28" @click="handleLogs">获取日志</button>
        <button type="button" class=" mr-2 p-1 w-28" @click="handleExport">导出日志</button>
      </div>
    </div>
    <div class=" flex-1 mt-2 w-full h-full rounded-md bg-white overflow-y-auto text-sm">
      <table class=" w-full table-auto">
        <thead class=" sticky top-0 bg-gray-100 border-b-gray-300">
          <tr>
            <th class=" p-2" width="194px">时间</th>
            <th class=" p-2">日志器</th>
            <th class=" p-2">级别</th>
            <th class=" p-2">位置</th>
            <th class=" p-2">内容</th>
          </tr>
        </thead>
        <tbody class=" divide-y divide-gray-100"> 
          <tr v-for="(l,i) in logs" :key="i" class=" hover:bg-gray-200">
            <td class=" p-2">{{ l.time }}</td>
            <td class=" p-2">{{ l.logger }}</td>
            <td class=" p-2">{{ l.level }}</td>
            <td class=" p-2">{{ l.location }}</td>
            <td class=" p-2">{{ l.message }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class=" flex-none mt-2">
      <span class=" inline-block p-2 rounded-md w-16 border border-cyan-500" v-if="curPage > 1" @click="handlePrev">上一页</span>
      <span class=" inline-block ml-4 p-2">{{ curPage }}</span>
      <span class=" inline-block p-2 rounded-md w-16 border border-cyan-500" v-if="pager && curPage < pager.total_pages" @click="handleNext">下一页</span>
    </div>
  </div>
</template>