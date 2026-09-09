<script setup lang="ts">
import { useRequest } from 'alova/client';
import { getStageSessions } from '@/apis/methods/manage';
import dayjs from 'dayjs';

const emits = defineEmits(['select']);

const { data, loading, error } = useRequest(getStageSessions);
function selectSession(session_id: string) {
  emits('select', {close: true, payload: session_id});
}
</script>

<template>
  <div class="min-w-96">
    <div v-if="loading" class="state-box !py-8">Loading...</div>
    <div v-else-if="error" class="state-box !py-8"><b>加载失败</b><span>{{ error.message }}</span></div>
    <div v-else class="flex flex-col gap-1.5">
      <div
        v-for="session in data.sessions"
        :key="session.session_id"
        class="rounded-r px-3.5 py-2.5 cursor-pointer border border-line transition-colors hover:bg-accent-soft hover:border-accent"
        @click="selectSession(session.session_id)"
      >
        <div class="text-[13.5px] font-medium text-ink-1 num">{{ session.session_id }}</div>
        <div class="mt-0.5 text-[12px] text-ink-3 num">{{ session.song_count }} 首 · {{ dayjs(session.created_at).format('YYYY-MM-DD HH:mm:ss') }}</div>
      </div>
      <div v-if="!data.sessions.length" class="state-box !py-8"><b>没有可用会话</b></div>
    </div>
  </div>
</template>
