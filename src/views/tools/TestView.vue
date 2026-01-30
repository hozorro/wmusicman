<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <!-- 标题区域 -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-gray-800 flex items-center">
          <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Post and Get Test
        </h3>
        <p class="text-sm text-gray-500 mt-1">test post and get methods</p>
      </div>

      <!-- 输入区域 -->
      <div class="space-y-3 mb-6">
        <div class="flex items-center gap-2 group">
          <!-- 输入框 -->
          <input
            v-model="data"
            type="text"
            class="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-800"
            placeholder="input test data"
          >
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="flex flex-wrap gap-3 items-center">
        <!-- Post按钮 -->
        <button
          @click="handlePost"
          class="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm hover:shadow"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14"></path>
          </svg>
          Post
        </button>

        <!-- Get按钮 -->
        <button
          @click="handleGet"
          class="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm hover:shadow"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Get
        </button>
      </div>

      <!-- 响应预览（可选） -->
      <div class="mt-6 pt-6 border-t border-gray-100">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Resposne:</h4>
        <div class="flex flex-wrap gap-2">
          {{ res }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { testPostBack, testGet } from '@/apis/methods/manage';

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
</script>