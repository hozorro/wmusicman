<script setup lang="ts">
import { computed, inject } from 'vue';
import { useRequest } from 'alova/client';
import { busyState, type BusyState } from '@/composables/busy'
import { getInitDirs, createInitDirs } from '@/apis/methods/manage';

// While any global task is running, init entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const needInitDirs = computed(() => {
  if (!folders.value || folders.value.length == 0) return false;
  for (let folder of folders.value) {
    if (!folder.path) return true;
  }
  return false;
})
const { data:folders, send: refresh } = useRequest(getInitDirs)
async function createAll() {
  await createInitDirs()
  refresh()
}

</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Initial</h1>
        <p>创建初始目录并设置默认 Artwork</p>
      </div>
    </div>

    <div class="card max-w-3xl">
      <div class="card-header">
        <h2>Create Init Directories</h2>
        <span class="sp"></span>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="createAll"
          :disabled="!needInitDirs || busy"
        >Create All</button>
      </div>
      <div class="card-pad !py-2">
        <div v-for="f in folders" :key="f.name" class="setting-row">
          <div class="info">
            <b>{{ f.name }}</b>
            <span :class="{ '!text-warn-ink': !f.path }">{{ f.path || '尚未创建' }}</span>
          </div>
          <div class="control">
            <span class="tag" :class="f.path ? 'tag-ok' : 'tag-warn'">{{ f.path ? '就绪' : '待创建' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>