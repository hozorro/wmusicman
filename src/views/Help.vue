<script setup lang="ts">
</script>

<template>
  <h1>0. 部署设置</h1>
  <p>
    在.env设置baseUrl，staticUrl和apiUrl。
  </p>
  <h1>1. Edit（编辑）</h1>
  <p>
    音乐库的文件层次结构是：root->country->startchar->artist->album->track。音乐文件的编辑修改涉及到文件的重命名、移动、删除、编辑tag等。其中编辑tag又基于上述文件层次结构涉及文件的移动方式。另外watcher原始的onmove只针对文件重命名。因此，基于上述条件和要求，各种修改所对应的操作方法和效果说明如下。
  </p>
  <h2>1.1 文件重命名</h2>
  <p>
    前端无直接修改文件名的功能（实际也无必要），如要修改，可直接在后台操作系统中修改文件名，此时，watcher会监测到onmove，并自动scan，Track记录的path发生变化。不会删除原纪录添加新纪录。
  </p>
  <h2>1.2 文件移动</h2>
  <p>
    前端无直接移动文件的功能（实际也无必要），如要移动，如果先删除，后添加，则watcher会会先监测ondelete，由scanner执行remove_file，再监测oncreate，由scanner执行scan_file，此时添加的是新的记录，这个track的id会发生变化。
    为了保证文件id不变，需要以真正的移动模式，方法是在前端打开move_mode,解除对delete的触发，只记录文件名，当触发oncreate时，判断是否有这个文件名，如有则为move【本来想用hash标识文件的，但delete触发后文件已不存在，无法hash，只有文件路径信息还在】，同时还解除对modified的触发，这样可避免多次scan，只在oncreate时一次性scan。
  </p>
  <h2>1.3 文件删除</h2>
  <p>
    前端无直接删除文件功能（实际也无必要），如要删除，可直接在操作系统中删除文件，此时watcher会监测到ondelete，由scanner执行remove_file。
  </p>
  <h2>1.4 文件添加</h2>
  <p>
    前端通过upload页面上传，然后在transfer页面先进行扫描，然后编辑标签，最后按国别进行转移，国别下层对应目录会自动创建或分配。
  </p>
  <h2>1.5 文件tag编辑</h2>
  <p>
    前端通过edit页面进行tag编辑，这有两种情况：<br />
    1）一种是title、genre、year等tag，不涉及文件目录的改变，直接修改文件，watcher会监测到onmodify，由scanner执行scan_file。<br />
    2）另一种artist、album这两个tag的修改，涉及文件目录变化，需要现在前端开启move_mode，然后再进行修改，如果后台确定执行文件移动，watcher监测和scanner操作机制同上所属文件移动。
  </p>
  <h2>1.6 上传或修改cover</h2>
  <p>
    包括对artist的face和portrait的修改或上传，对album的cover的修改或上传。<br />
    1）album的cover会直接上传到album所在目录，collection专辑会的目录会直接在artist的根目录下。<br />
    2）由于对于多artist的track，只会根据第一个artist创建artist目录，因此有些只参与合唱但又不是artist标签中第一个artist的，将没有对应的artist根目录，也就是没有artist.path字段。
    因此，对于artist的face和portrait上传，会先判断artist.path字段，如果不为空，则上传至artist根目录，如果为空，则上传至static/photo/artist目录的face或portrait子目录，以artist.name（字符合法化后）名+artist.id命名。
  </p>
</template>

<style scoped>
@reference "tailwindcss";
h1 {
  @apply text-xl font-semibold;
}
h2 {
  @apply text-lg font-semibold;
}
h3 {
  @apply text-base font-semibold;
}
p {
  @apply text-base indent-2 pl-4;
}
</style>