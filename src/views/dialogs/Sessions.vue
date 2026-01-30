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
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <div v-else>
      <div v-for="session in data.sessions"> 
        <div class=" p-1 place-content-center cursor-pointer" @click="selectSession(session.session_id)">
          {{session.session_id}}
          <span class=" text-sm text-gray-300">({{ session.song_count }}, {{ dayjs(session.created_at).format('YYYY-MM-DD HH:mm:ss') }})</span>
        </div>
      </div>
    </div>
  </div>
</template>