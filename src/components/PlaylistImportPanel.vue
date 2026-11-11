<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'
import { matchPlaylistTracks, createPlaylistFromMatch } from '@/apis/methods/manage'
import { toast } from '@/composables/toast'
import { wAlert } from '@/composables/walert'
import { useAuthStore } from '@/store/auth'
import WFile from '@/components/WFile.vue'

const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)
const authStore = useAuthStore()
const currentUsername = computed(() => authStore.userInfo?.username ?? '')

const importFile = ref<File | null>(null)
const parsed = ref<PlaylistImportParsed | null>(null)
const editedTitle = ref('')
const editedComment = ref('')
const matchResult = ref<PlaylistMatchResponse | null>(null)
const selectedIds = ref<Record<number, number | null>>({})
const matching = ref(false)
const creating = ref(false)
const created = ref(false)

onMounted(async () => {
  if (!currentUsername.value) await authStore.fetchUserInfo()
})

const usernameMismatch = computed(() =>
  !!parsed.value?.username && !!currentUsername.value && parsed.value.username !== currentUsername.value
)
const selectedCount = computed(() =>
  matchResult.value?.results.reduce(
    (sum, r) => sum + (typeof selectedIds.value[r.index] === 'number' ? 1 : 0), 0
  ) ?? 0
)
const canMatch = computed(() => !!parsed.value?.tracks.length && !busy.value && !matching.value)
const canCreate = computed(() =>
  !!matchResult.value && !!editedTitle.value.trim() && selectedCount.value > 0
  && !busy.value && !creating.value && !created.value
)

watch(importFile, (file) => { parseImportFile(file) })

function normalizeTracks(value: unknown): PlaylistImportTrack[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return { path: item }
    if (!item || typeof item !== 'object') return {}
    const t = item as Record<string, unknown>
    return {
      title: typeof t.title === 'string' ? t.title : undefined,
      album: typeof t.album === 'string' ? t.album : undefined,
      path: typeof t.path === 'string' && t.path.trim() ? t.path : undefined,
      artists: Array.isArray(t.artists) ? t.artists.filter((a): a is string => typeof a === 'string') : [],
    }
  })
}

async function parseImportFile(file: File | null) {
  if (!file) return
  resetResult()
  try {
    const raw = JSON.parse(await file.text())
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('JSON 顶层必须是对象')
    const tracks = normalizeTracks(raw.tracks)
    parsed.value = {
      title: typeof raw.title === 'string' ? raw.title : '',
      comment: typeof raw.comment === 'string' ? raw.comment : '',
      username: typeof raw.user?.username === 'string' ? raw.user.username : '',
      tracks,
      filename: file.name,
      hasTracks: Array.isArray(raw.tracks),
    }
    editedTitle.value = parsed.value.title
    editedComment.value = parsed.value.comment
    if (!tracks.length) toast('该文件无任何 track', 'warning')
  } catch (e) {
    clearImport()
    toast(`JSON 解析失败：${(e as Error).message}`, 'error')
  }
}

function resetResult() {
  matchResult.value = null
  selectedIds.value = {}
  created.value = false
}

function clearImport() {
  importFile.value = null
  parsed.value = null
  editedTitle.value = ''
  editedComment.value = ''
  resetResult()
}

function trackLabel(t: PlaylistImportTrack) {
  return t.path
    ? `路径 ${t.path}`
    : `${t.title || '（无标题）'} · ${(t.artists || []).join(', ') || '（无歌手）'}${t.album ? ` · ${t.album}` : ''}`
}

function levelLabel(level: PlaylistMatchLevel) {
  return { path: '路径精确', exact: '精确匹配', artist: '歌手匹配', title: '标题匹配' }[level]
}

function selectCandidate(index: number, trackId: number | null) {
  selectedIds.value = { ...selectedIds.value, [index]: trackId }
}

function matchDetail(res: PlaylistMatchResponse) {
  return JSON.stringify({
    total: res.total, matched: res.matched_count, unmatched: res.unmatched_count,
    unmatched_tracks: res.results.filter(r => !r.candidates.length)
      .map(r => ({ index: r.index + 1, track: r.source })),
    matched_candidates: res.results.filter(r => r.candidates.length)
      .map(r => ({ index: r.index + 1, candidates: r.candidates.map(c => ({ id: c.track_id, title: c.title, level: c.match_level })) })),
  })
}

async function handleMatch() {
  if (!canMatch.value || !parsed.value) return
  matching.value = true
  try {
    const res = await matchPlaylistTracks(parsed.value.tracks)
    if (!res) { toast('匹配请求未返回数据', 'error'); return }
    matchResult.value = res
    const picks: Record<number, number | null> = {}
    res.results.forEach(r => { picks[r.index] = r.candidates.length ? r.candidates[0].track_id : null })
    selectedIds.value = picks
    created.value = false
    wAlert(`匹配完成：共 ${res.total} 首，命中 ${res.matched_count} 首，未匹配 ${res.unmatched_count} 首`,
      matchDetail(res), '匹配结果')
  } catch (e) {
    console.error('[PlaylistImportPanel] match failed', e)
  } finally {
    matching.value = false
  }
}

async function handleCreate() {
  if (!canCreate.value) return
  creating.value = true
  try {
    const res = await createPlaylistFromMatch({
      title: editedTitle.value.trim(),
      comment: editedComment.value.trim() || null,
      track_ids: orderedIds(),
    })
    if (!res) { toast('创建请求未返回数据', 'error'); return }
    created.value = true
    wAlert(
      `歌单「${res.title}」创建成功（ID ${res.id}）：请求 ${res.requested} 首，写入 ${res.added} 首，忽略 ${res.ignored} 首`,
      JSON.stringify(res), '创建结果'
    )
  } catch (e) {
    console.error('[PlaylistImportPanel] create failed', e)
  } finally {
    creating.value = false
  }
}

function orderedIds(): number[] {
  return matchResult.value?.results
    .map(r => selectedIds.value[r.index])
    .filter((id): id is number => typeof id === 'number') ?? []
}
</script>

<template>
  <div class="two-col items-stretch">
    <div class="card pl-card">
      <div class="card-header flex items-center gap-2">
        <h2>导入并解析 JSON</h2>
        <span class="sp"></span>
        <button v-if="parsed" type="button" class="btn btn-ghost btn-sm" @click="clearImport">清空</button>
      </div>
      <div class="card-pad flex flex-col gap-3">
        <div class="pl-drop">
          <WFile v-model="importFile" accept="application/json,.json" />
        </div>
        <div v-if="parsed?.filename" class="text-[12px] text-ink-3 truncate">已导入：{{ parsed.filename }}</div>

        <div class="input-group">
          <label>歌单名称 <span class="text-bad">*</span></label>
          <input v-model="editedTitle" type="text" class="input" placeholder="JSON 中无 title 时请在此填写" />
        </div>
        <div class="input-group">
          <label>歌单简介</label>
          <textarea v-model="editedComment" class="textarea" rows="2" placeholder="JSON 中无 comment 时留空"></textarea>
        </div>
        <div class="input-group">
          <label>歌单用户</label>
          <div class="flex items-center gap-2 min-h-8">
            <span v-if="parsed?.username" class="text-sm text-ink-1">{{ parsed.username }}</span>
            <span v-else class="text-sm text-ink-3">{{ parsed ? '留空' : '尚未导入文件' }}</span>
            <span v-if="usernameMismatch" class="tag tag-warn">不一致</span>
          </div>
        </div>

        <div class="input-group">
          <label>歌曲 <span class="num">({{ parsed?.tracks.length ?? 0 }})</span></label>
          <div class="pl-scroll pl-track-list">
            <div v-if="!parsed" class="text-[12.5px] text-ink-3 p-2">导入 JSON 文件后在此显示歌曲列表</div>
            <div v-else-if="!parsed.tracks.length" class="state-box !py-8">
              <b>该文件无任何track</b>
              <span>顶层 tracks 字段缺失或为空</span>
            </div>
            <div v-for="(t, i) in parsed?.tracks ?? []" :key="i" class="pl-track-row">
              <span class="num text-ink-3">{{ i + 1 }}</span>
              <div class="min-w-0">
                <div class="text-[13px] text-ink-1 truncate">{{ t.title || '（无标题）' }}</div>
                <div class="text-[11.5px] text-ink-3 truncate">
                  {{ (t.artists || []).join(', ') || '（无歌手）' }}<span v-if="t.album"> · {{ t.album }}</span>
                </div>
                <div v-if="t.path" class="text-[11px] text-info truncate">{{ t.path }}</div>
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-primary w-full justify-center" :disabled="!canMatch" @click="handleMatch">
          {{ matching ? '匹配中…' : '匹配' }}
        </button>
        <div v-if="!parsed?.tracks.length" class="text-[11.5px] text-ink-3">文件中没有 track 时无法匹配</div>
      </div>
    </div>

    <div class="card pl-card">
      <div class="card-header"><h2>匹配结果</h2></div>
      <div class="card-pad flex flex-col gap-3">
        <div class="flex items-center gap-2 text-[12.5px]">
          <span class="tag tag-info">总数 {{ matchResult?.total ?? 0 }}</span>
          <span class="tag tag-ok">命中 {{ matchResult?.matched_count ?? 0 }}</span>
          <span class="tag tag-gray">未匹配 {{ matchResult?.unmatched_count ?? 0 }}</span>
          <span class="sp"></span>
          <span class="text-ink-3">已选 {{ selectedCount }}</span>
        </div>

        <div class="pl-scroll pl-result-list">
          <div v-if="!matchResult" class="state-box !py-12">
            <div class="ico">
              <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
            </div>
            <b>尚未匹配</b>
            <span>在左侧导入 JSON 并点击「匹配」后，这里会列出每首歌的候选</span>
          </div>
          <div v-for="r in matchResult?.results ?? []" :key="r.index" class="pl-group">
            <div class="flex items-center gap-2 mb-2">
              <span class="num text-ink-3 text-[12px]">{{ r.index + 1 }}</span>
              <span class="text-[12.5px] font-semibold text-ink-1 truncate">{{ trackLabel(r.source) }}</span>
              <span class="sp"></span>
              <span v-if="r.match_by === 'path'" class="tag tag-cyan">按路径</span>
              <span v-else-if="r.match_by === 'meta'" class="tag tag-info">按元数据</span>
              <span v-else class="tag tag-gray">未匹配</span>
            </div>
            <div v-if="!r.candidates.length" class="text-[12px] text-ink-3 px-2">未匹配到音乐库中的歌曲，创建时将忽略</div>
            <label v-for="c in r.candidates" :key="c.track_id" class="pl-candidate radio"
                   :class="{ 'is-on': selectedIds[r.index] === c.track_id }">
              <input type="radio" :name="`pl-match-${r.index}`" :checked="selectedIds[r.index] === c.track_id"
                     @change="selectCandidate(r.index, c.track_id)" />
              <div class="min-w-0 flex-1">
                <div class="text-[12.5px] text-ink-1 truncate">
                  <span class="num text-ink-3 mr-1">#{{ c.track_id }}</span>{{ c.title }}
                  <span class="tag tag-ok ml-1">{{ levelLabel(c.match_level) }}</span>
                </div>
                <div class="text-[11.5px] text-ink-3 truncate">{{ c.artists.join(', ') }} · {{ c.album || '（无专辑）' }}</div>
                <div class="text-[11px] text-ink-3 truncate">{{ c.path }}</div>
              </div>
            </label>
            <label v-if="r.candidates.length" class="pl-ignore radio">
              <input type="radio" :name="`pl-match-${r.index}`" :checked="selectedIds[r.index] === null"
                     @change="selectCandidate(r.index, null)" />
              <span class="text-[12px] text-ink-3">忽略此曲（不加入歌单）</span>
            </label>
          </div>
        </div>

        <button type="button" class="btn btn-primary w-full justify-center" :disabled="!canCreate" @click="handleCreate">
          {{ creating ? '创建中…' : created ? '已创建' : '创建歌单' }}
        </button>
        <div class="text-[11.5px] text-ink-3">
          <span v-if="!editedTitle.trim()">请先填写歌单名称（不能为空）</span>
          <span v-else-if="!matchResult">请先完成匹配</span>
          <span v-else-if="!selectedCount">请至少选择一首匹配的歌曲</span>
          <span v-else-if="created">如需再次创建，请重新匹配或重新导入文件</span>
          <span v-else>将按匹配顺序以选中的 {{ selectedCount }} 首创建歌单，未匹配的忽略</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pl-card { position: relative; }
.pl-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #4F46E5, #818CF8, transparent);
}
.pl-drop { padding: 2px; border-radius: 10px; background: linear-gradient(135deg, rgba(79,70,229,.06), rgba(129,140,248,.02)); }
.pl-scroll { overflow-y: auto; }
.pl-track-list { max-height: 260px; }
.pl-result-list { max-height: 480px; }
.pl-track-row {
  display: flex; align-items: flex-start; gap: 10px; padding: 7px 8px;
  border-bottom: 1px solid rgba(148,163,184,.16); border-radius: 6px; transition: background .15s;
}
.pl-track-row:hover { background: rgba(79,70,229,.045); }
.pl-group {
  padding: 10px 12px; margin-bottom: 8px; border: 1px solid rgba(148,163,184,.22);
  border-radius: 10px; background: rgba(248,250,252,.7);
}
.pl-candidate {
  display: flex; align-items: flex-start; gap: 9px; width: 100%; padding: 7px 9px;
  border: 1px solid transparent; border-radius: 8px; cursor: pointer;
  transition: background .18s, border-color .18s, transform .18s;
}
.pl-candidate:hover { background: #fff; transform: translateX(2px); }
.pl-candidate.is-on { background: #fff; border-color: #818CF8; box-shadow: 0 2px 10px rgba(79,70,229,.10); }
.pl-ignore { display: flex; align-items: center; gap: 9px; padding: 5px 9px; cursor: pointer; }
.text-bad { color: #DC2626; }
.text-info { color: #0284C7; }
</style>
