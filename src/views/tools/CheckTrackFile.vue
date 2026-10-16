<script setup lang="ts">
import { ref } from 'vue'
import { useRequest } from 'alova/client';
import { checkTrackFile } from '@/apis/methods/manage';

const fileList = ref('');
const {data, loading: checking, send: startCheck, error} = useRequest(checkTrackFile, 
  {
    initialData: {
      total: 0, 
      valid: 0, 
      matched: [], 
      unmatched: []
    },
    immediate: false
  }
);

function checkFileList() {
  if (!fileList.value) return;
  startCheck(fileList.value);
}
function clear() {
  fileList.value = '';
  // data.value = { total: 0, valid: 0, matched: [], unmatched: [] };
}
</script>

<template>
  <div class=" flex w-full h-full gap-2 min-h-0">
    <div class="flex-1 flex flex-col gap-2 card h-full min-h-0">
      <div class="flex-none card-header">
        <div>
          <h2>Input file list text</h2>
          <div class=" flex-none text-xs text-ink-3 mt-1">
            使用tree命令生成文件列表，然后将列表中有效部分复制到这里，要求文件名必须以“artist - title”格式。
          </div>
        </div>
      </div>
      <div class="flex-1 h-full min-h-0 p-2">
        <textarea class="flex-1 w-full h-full p-2 rounded bg-panel border border-line focus:outline-none text-sm" v-model="fileList" />
      </div>
      <div class="flex-none p-2 flex justify-end gap-4">
        <button class="btn btn-default" @click="clear">Clear</button>
        <button class="btn btn-primary" @click="checkFileList">{{ checking ? 'Checking...' : 'Check' }}</button>
      </div>
    </div>
    <div class="flex-2 flex flex-col gap-2 card h-full min-h-0">
      <div class="flex-none card-header"><h2>Check Result</h2></div>
      <div v-if="checking" class=" mt-6 text-center">Checking...</div>
      <div v-else-if="error" class=" mt-6 text-center">Error: {{ error }}</div>
      <div v-else-if="data && data.total > 0" class="flex-1 flex flex-col text-sm p-2 text-ink-3 min-h-0">
        <div class=" flex-none text-ink-1">
          检测到 <span class="text-accent">{{ data.total }}</span> 行，
          有效 <span class="text-accent">{{ data.valid }}</span> 行，
          <span class="text-bad">{{ data.matched.length }}</span> 个已存在，
          <span class=" text-emerald-700">{{ data.unmatched.length }}</span> 个未匹配。
        </div>
        <div class=" flex-1 overflow-auto mt-2">
          <div class=" flex-none text-ink-1">存在的歌曲 <span class="text-bad">{{ data.matched.length }}</span> 个</div>
          <ul class="flex-1 gap-2 p-2">
            <li v-for="(line, index) in data.matched" :key="index" class="flex-none">
              <span class="text-bad/70 font-semibold">{{ line.file.file_name }}</span> - {{ line.db_path }}
            </li>
          </ul>
          <div class=" flex-none text-ink-1">未匹配的歌曲 <span class="text-emerald-700">{{ data.unmatched.length }}</span> 个</div>
          <ul class="flex-1 gap-2 p-2">
            <li v-for="(line, index) in data.unmatched" :key="index" class="text-emerald-600 font-semibold">
              {{ line.file.file_name }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else class=" mt-6 w-full text-center">No data</div>
    </div>
  </div>
</template>