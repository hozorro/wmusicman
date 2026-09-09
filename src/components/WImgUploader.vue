<script setup lang="ts">
import type { Method } from 'alova';
import { ref, computed, useTemplateRef, watch, onBeforeUnmount } from 'vue';

// --- Props 定义 ---
interface Props {
  // 初始图片地址 (通常从后端获取)
  modelValue?: string | null;
  // 容器样式类名 (用于控制大小，如 'w-32 h-32')
  containerClass?: string;
  // 无图片时的提示文字
  placeholderText?: string;
  // 是否显示进度条
  showProgress?: boolean;
  // 是否禁用
  disabled?: boolean;
  // 自动上传方法：如果传入此方法，选择图片后会自动调用并上传
  // 返回值 Promise<string> 代表上传成功后后端返回的新图片 URL
  uploadMethod?: (formData: FormData) => Method;
  // 上传方法参数
  uploadParams?: Record<string, any>;
  isUploading?: boolean;
  uploadProgress?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  containerClass: 'w-32 h-32', // 默认大小
  placeholderText: '无图片',
  showProgress: false,
  disabled: false,
  uploadMethod: undefined,
  uploadParams: undefined,
});

// --- Emits 定义 ---
const emit = defineEmits<{
  // 图片变更事件
  // mode: 'auto' 时 data 为后端返回的新 url
  // mode: 'manual' 时 data 为选中的 File 对象 (由外部按钮处理上传)
  (e: 'change', payload: { file: File; url?: string; mode: 'auto' | 'manual' }): void;
  // 支持 v-model
  (e: 'update:modelValue', val: string): void;
}>();

// --- 状态管理 ---
const fileInputRef = useTemplateRef('imgFile');
const displayUrl = ref<string | null>(props.modelValue || null);
const hasError = ref<boolean>(false);
const isUploadingAuto = ref<boolean>(false);
const progressAuto = ref<number>(0);

const isUploadingSup = computed(() => {
  return props.isUploading || isUploadingAuto.value;
})
const progressSup = computed(() => {
  return props.uploadProgress || progressAuto.value || 0;
});

// 监听外部 modelValue 变化 (例如父组件重置表单)
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    displayUrl.value = newVal;
    hasError.value = false;
  }
});

// --- 方法 ---

// 1. 点击图片触发文件选择
const handleContainerClick = () => {
  if (props.disabled || isUploadingAuto.value) return;
  fileInputRef.value?.click();
};

// 2. 图片加载失败处理
const handleImageError = () => {
  hasError.value = true;
  displayUrl.value = null;
};

// 3. 文件选择核心逻辑
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // 创建本地预览 URL
  const localUrl = URL.createObjectURL(file);
  displayUrl.value = localUrl;
  hasError.value = false;

  // 判断模式
  if (props.uploadMethod) {
    // --- 模式 A: 自动上传 ---
    await performAutoUpload(file);
  } else {
    // --- 模式 B: 手动暂存 ---
    // 仅 emit 事件，由父组件外部按钮决定何时上传
    emit('change', { file, mode: 'manual' });
  }

  // 重置 input value，允许重复选择同一文件
  target.value = '';
};

// 执行自动上传逻辑
const performAutoUpload = async (file: File) => {
  if (!props.uploadMethod) return;

  isUploadingAuto.value = true;
  progressAuto.value = 0;

  try {
    const formData = new FormData();
    formData.append('file', file);
    for (const key in props.uploadParams) {
      if (props.uploadParams.hasOwnProperty(key)) {
        formData.append(key, props.uploadParams[key]);
      }
    }
    // 调用传入的上传方法
    const upload = props.uploadMethod(formData);
    upload.onUpload((ProgressEvent) => {
      progressAuto.value = Math.round(ProgressEvent.loaded * 100 / ProgressEvent.total);
    })
    
    const newUrl = await upload
    progressAuto.value = 0;
    // 更新显示为后端返回的真实 URL (释放本地 ObjectURL 内存)
    URL.revokeObjectURL(displayUrl.value || '');
    displayUrl.value = newUrl;
    
    // 通知父组件更新 v-model
    emit('update:modelValue', newUrl);
    // 通知变更事件
    emit('change', { file, url: newUrl, mode: 'auto' });
  } catch (error) {
    console.error('Upload failed', error);
    alert('上传失败，请重试');
    // 失败回滚显示
    displayUrl.value = props.modelValue || null; 
    hasError.value = !props.modelValue;
  } finally {
    isUploadingAuto.value = false;
    // 短暂延迟后隐藏进度条
    setTimeout(() => { progressAuto.value = 0; }, 500);
  }
};

onBeforeUnmount(() => {
  // 释放本地预览 URL 内存
  if (displayUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(displayUrl.value);
  }
});
</script>

<template>
  <div 
    class="relative group cursor-pointer select-none"
    :class="[containerClass, { 'opacity-50': disabled }]"
    @click="handleContainerClick"
  >
    <!-- 图片显示区域 -->
    <img 
      v-if="!hasError && displayUrl"
      :src="displayUrl"
      alt="Preview"
      class="w-full h-full object-cover rounded-r border border-line"
      @error="handleImageError"
    />

    <!-- 无图片时的文字提示 -->
    <div 
      v-else
      class="w-full h-full flex items-center justify-center bg-panel rounded-r border border-dashed border-line-strong text-ink-3 text-sm"
    >
      {{ placeholderText }}
    </div>

    <!-- 遮罩层 (Hover 时显示提示) -->
    <div 
      v-if="!disabled"
      class="absolute inset-0 bg-ink-1/40 rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    >
      <span class="text-white text-xs font-medium">点击更换</span>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="imgFile"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
      :disabled="disabled"
    />

    <!-- 底部进度条 -->
    <div 
      v-if="showProgress && isUploadingSup"
      class="absolute bottom-0 left-0 w-full h-1 bg-panel rounded-b-r overflow-hidden"
    >
      <div 
        class="h-full transition-all duration-300 ease-out"
        :style="{ width: `${progressSup}%`, background: 'linear-gradient(90deg, var(--color-accent-light), var(--color-accent))' }"
      ></div>
    </div>
    
    <!-- 上传中遮罩 (防止重复点击) -->
    <div v-if="isUploadingAuto" class="absolute inset-0 bg-white/20 z-10"></div>
  </div>
</template>