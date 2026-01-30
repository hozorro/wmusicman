<script setup lang="ts">
import { useSlots } from 'vue';
const {data = []} = defineProps<{
  data: any[]
}>()
const slots = useSlots()
</script>

<template>
  <table class=" w-full">
    <thead>
      <tr class=" bg-gray-100 border-b-1 border-gray-300 sticky top-0">
        <slot />
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in data" :key="index" class=" even:bg-gray-50 odd:bg-white">
        <template v-for="slot in slots['default']?.()" :key="slot">
          <template v-if="slot && slot.children">
            <td class=" py-1">
              <component :is="slot" :scope="item" :prop="slot.props?.prop" />
            </td>
          </template>
          <template v-else>
            <td class=" py-1"> 
              <component :is="slot" :scope="item" />
            </td>
          </template>
        </template>
      </tr>
    </tbody>
  </table>
</template>