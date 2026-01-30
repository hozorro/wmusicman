<script setup lang="ts">
</script>

<template>
  <div class=" p-2">
    <div class="text-2xl">设置</div>
    <h1>metadat</h1>
    <div>
      <input type="checkbox" id="chk-meta-del-id3v1" />
      <label for="meta-del-id3v1">更新meta时删除ID3v1版的meta</label>
    </div>
    <div>
      <input type="checkbox" id="chk-meta-del-apev2" />
      <label for="meta-del-apev2">更新meta时删除apev2版的meta</label>
    </div>
    <div>
      <input type="checkbox" id="chk-meta-decode-other" />
      <label for="meta-del-id3v1">解码ID3v1版meta并保存时，同时对基础meta（title, artists, album, genre, year）以外的meta也以解码后的数据保存。</label>
    </div>
  </div>
</template>