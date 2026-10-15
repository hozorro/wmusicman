<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { busyState, type BusyState } from '@/composables/busy'
import { testPostBack, testGet, exportAllArtists } from '@/apis/methods/manage';
import { wAlert } from '@/composables/walert';
import { getFilenameFromHeaders, saveBlob } from '@/utils/download';

// While any global task is running, test request entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const data = ref('');
const res = ref('');

const handlePost = async () => {
  // 如果是回车触发，先处理当前输入框的去空
  res.value = await testPostBack();
};

const handleGet = async () => {
  // 删除后聚焦到前一个输入框（如果有的话）
  res.value = await testGet();
};

const handleExportArtists = async () => {
  const res: any = await exportAllArtists();
  saveBlob(res.data, getFilenameFromHeaders(res.headers, 'artists.json'))
};
</script>

<template>
  <div class="card max-w-2xl">
    <!-- 标题区域 -->
    <div class="card-header">
      <h2>Post and Get Test</h2>
      <span class="sp"></span>
      <span class="text-[12.5px] text-ink-3">test post and get methods</span>
    </div>

    <div class="card-pad">
      <!-- 输入区域 -->
      <input
        v-model="data"
        type="text"
        class="input w-full mb-4"
        placeholder="input test data"
      />

      <!-- 操作按钮区域 -->
      <div class="flex flex-wrap gap-2.5 items-center">
        <button type="button" class="btn btn-primary" :disabled="busy" @click="handlePost">Post</button>
        <button type="button" class="btn" :disabled="busy" @click="handleGet">Get</button>
        <button type="button" class="btn" @click="wAlert('This is a test alert', 'alert details')">Alert</button>
        <button type="button" class="btn" @click="handleExportArtists">Export All Artists</button>
      </div>

      <!-- 响应预览 -->
      <div class="mt-5 pt-5 border-t border-line">
        <div class="text-[12.5px] font-medium text-ink-3 mb-2">Response:</div>
        <div class="log-viewer !max-h-48 whitespace-pre-wrap">{{ res || '暂无响应' }}</div>
      </div>
    </div>
  </div>
</template>
