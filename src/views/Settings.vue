<script setup lang="ts">
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Settings</h1>
        <p>系统参数设置</p>
      </div>
    </div>

    <div class="card max-w-3xl">
      <div class="card-header"><h2>Metadata</h2></div>
      <div class="card-pad !py-2">
        <div class="setting-row !py-3.5">
          <div class="info">
            <b>删除 ID3v1 版 meta</b>
            <span>更新 meta 时删除 ID3v1 版的 meta</span>
          </div>
          <div class="control">
            <input type="checkbox" id="chk-meta-del-id3v1" class="switch" />
          </div>
        </div>
        <div class="setting-row !py-3.5">
          <div class="info">
            <b>删除 APEv2 版 meta</b>
            <span>更新 meta 时删除 apev2 版的 meta</span>
          </div>
          <div class="control">
            <input type="checkbox" id="chk-meta-del-apev2" class="switch" />
          </div>
        </div>
        <div class="setting-row !py-3.5">
          <div class="info">
            <b>解码保存其他 meta</b>
            <span>解码 ID3v1 版 meta 并保存时，同时对基础 meta（title, artists, album, genre, year）以外的 meta 也以解码后的数据保存。</span>
          </div>
          <div class="control">
            <input type="checkbox" id="chk-meta-decode-other" class="switch" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
