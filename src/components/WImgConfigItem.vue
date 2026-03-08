<script setup lang="ts">
import type { Method } from 'alova';
import { ref, computed, watch } from 'vue';
import WImgUploader from './WImgUploader.vue';
import { assetImageCache } from '@/utils/general';

interface Props {
  label: string;
  modelValue: string | null; // 当前图片 URL
  initialUrl: string | null; // 初始图片 URL (用于判断还原和脏状态)
  defaultAssetUrl?: string;  // 本地默认图片资源路径
  enableDefault?: boolean;   // 是否启用"设为默认"
  uploadMethod?: (formData: FormData) => Method;
  uploadParams?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  enableDefault: true,
  defaultAssetUrl: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [url: string | null];
  'saved': [url: string | null]; // 保存成功事件，供父组件同步全局状态
  'error': [error: Error],
}>();

// 内部状态
const internalUrl = ref<string | null>(props.modelValue);
const pendingFile = ref<File | null>(null);
const actionType = ref<'none' | 'local' | 'default'>('none');
const isUploading = ref(false);
const progress = ref(0);

// 监听外部 Value 变化 (例如父组件整体重置)
watch(() => props.modelValue, (newVal) => {
  internalUrl.value = newVal;
  if (newVal === props.initialUrl) {
    actionType.value = 'none'
    pendingFile.value = null;
  }
});

// 计算属性
const isDirty = computed(() => {
  return actionType.value !== 'none';
});
const isDefaultAlready = computed(() => {
  if (!props.defaultAssetUrl || !internalUrl.value) return false;
  return internalUrl.value.includes(props.defaultAssetUrl.split('/').pop() || '');
});

const statusText = computed(() => {
  if (isUploading.value) return '正在处理...';
  if (!isDirty.value) return props.initialUrl ? '已同步' : '未设置';
  if (actionType.value === 'local') return '待上传：本地文件';
  if (actionType.value === 'default') return '待上传：默认资源';
  return '待上传';
});

// 方法
const handleLocalSelect = ({ file }: { file: File }) => {
  pendingFile.value = file;
  actionType.value = 'local';
};

const handleSetDefault = async () => {
  if (!props.defaultAssetUrl) return;
  
  try {
    const file = await assetImageCache.getImage(props.defaultAssetUrl, 'default.jpg')

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      internalUrl.value = previewUrl;
      pendingFile.value = file;
      actionType.value = 'default';
    } else {
      throw new Error('Failed to load default image');
    }
  } catch (error) {
    emit('error', error as Error);
    alert('操作失败');
  }
};

const handleConfirm = async () => {
  if (!isDirty.value || !props.uploadMethod) return;
  isUploading.value = true;
  progress.value = 0;

  try {
    const formData = new FormData();
    formData.append('file', pendingFile.value as File)
    for (const key in props.uploadParams) {
      if (props.uploadParams.hasOwnProperty(key)) {
        formData.append(key, props.uploadParams[key]);
      }
    }
    const upload = props.uploadMethod(formData)

    upload.onUpload((progressEvent) => {
      progress.value = Math.round(progressEvent.loaded * 100 / progressEvent.total);
    })
    upload.then((newUrl: string) => {
      progress.value = 100;
      if (internalUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(internalUrl.value);
      }
      internalUrl.value = newUrl;
      emit('update:modelValue', newUrl);
      emit('saved', newUrl)

      actionType.value = 'none';
      pendingFile.value = null;
    })
  } catch (error) {
    console.error(error);
    emit('error', error as Error);
    alert('操作失败');

    if (internalUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(internalUrl.value);
    }
    internalUrl.value = props.modelValue;
    actionType.value = 'none';
    pendingFile.value = null;
  } finally {
    isUploading.value = false;
    setTimeout(() => { progress.value = 0; }, 500);
  }
};
</script>

<template>
  <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-6">
    <!-- 左侧：图片选择区 -->
    <div class="flex-shrink-0 flex flex-col items-center">
      <WImgUploader
        v-model="internalUrl"
        container-class="w-32 h-32"
        :disabled="isUploading"
        :show-progress="true"
        :is-uploading="isUploading"
        :upload-progress="progress"
        :upload-params="uploadParams"
        @change="handleLocalSelect"
      />
      <span class="mt-2 text-sm font-medium text-gray-700">{{ label }}</span>
    </div>

    <!-- 右侧：操作区 -->
    <div class="flex-1 flex flex-col justify-center gap-3 min-w-[120px]">
      <!-- 主操作按钮 -->
      <button
        @click="handleConfirm"
        :disabled="!isDirty || isUploading"
        class="w-full py-2 px-4 font-medium transition-colors flex justify-center items-center gap-2"
        :class="!isDirty || isUploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'"
      >
        <span v-if="isUploading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {{ isUploading ? '上传中...' : '确认上传' }}
      </button>

      <!-- 辅助操作 -->
      <button
        v-if="enableDefault"
        @click="handleSetDefault"
        :disabled="isUploading || isDefaultAlready"
        class="w-full py-2 px-4"
      >
        {{ isDefaultAlready ? '已是默认' : '使用默认' }}
      </button>

      <!-- 状态提示 -->
      <div class="text-xs mt-2" :class="isDirty ? 'text-orange-500' : 'text-gray-400'">
        {{ statusText }}
      </div>
    </div>
  </div>
</template>