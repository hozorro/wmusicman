<script setup lang="ts">
import { useSlots } from 'vue';
const {data = []} = defineProps<{
  data: any[]
}>()
const slots = useSlots()
</script>

<template>
  <table class="tbl w-full">
    <thead>
      <tr class="sticky top-0 z-10">
        <slot />
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in data" :key="index">
        <template v-for="slot in slots['default']?.()" :key="slot">
          <template v-if="slot && slot.children">
            <td>
              <component :is="slot" :scope="item" :prop="slot.props?.prop" />
            </td>
          </template>
          <template v-else>
            <td> 
              <component :is="slot" :scope="item" />
            </td>
          </template>
        </template>
      </tr>
    </tbody>
  </table>
</template>