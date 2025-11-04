<script setup lang="ts">
// import { h } from 'vue'
// export default {
//   setup() {
//     return () => h('div',{style: {color: 'red'}}, 'hello world!')
//   }
// }
import { setArtistPath } from '@/apis/methods/manage';
function testFunc() {
  setArtistPath('7b29f3e32d9b41fb87f5ccade99f6f4d', 'cn')
}

</script>

<template>
  <div>hello world!</div>
  <button @click="testFunc">test</button>
</template>