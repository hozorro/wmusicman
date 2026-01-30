import { computed, type Ref } from 'vue'
import { compareValue, getUniformFieldValueSingle } from '@/utils/general'
import { updateMetaVersion, updateMetaTags } from '@/apis/methods/manage'

export function useTransfer(sessionFiles: Ref<SessionFile[]>) {
  const fileList= computed<FileInfo[]>(() => {
    return sessionFiles.value.map(item => {
      let info = {
        id: item.id,
        path: item.path,
        cover: item.cover,
        encoding: item.encoding,
        version: item.version,
        ver_activate: item.ver_activate,
        ...item.meta_additional
      }
      if(item.version && item.ver_activate) {
        if(item.version[item.ver_activate]==='APEv2') {
          return { ...info, ...item.meta_apev2}
        } else {
          return { ...info, ...item.meta_id3}
        }
      } else {
        return { ...info, ...item.meta_id3}
      }
    })
  })

  function handleSwitchVersionType(filePath: string, versionIndex: number) {
    for (let i = 0; i < sessionFiles.value.length; i++) {
      if (sessionFiles.value[i].path === filePath) {
        sessionFiles.value[i].ver_activate = versionIndex
        break
      }
    }
  }

  async function updateVersion(session_id: string, selected: string[]) {
    const items = sessionFiles.value.reduce((acc: {id: string, use_apev2:boolean}[], cur) => {
      if (selected.length > 0) {}
      if (selected.includes(cur.path)) {
        let ver = cur.version[cur.ver_activate]
        acc.push({id: cur.id, use_apev2: ver === 'APEv2'})
      }
      return acc
    }, [])
    const res = await updateMetaVersion(session_id, items)
    if(res) return res.count
  }

  const setActivatedMetaProp = <T extends keyof MetaPrimary>(index: number, prop: T, value: MetaPrimary[T]) => {
    let ver_activated = sessionFiles.value[index].ver_activate
    if (sessionFiles.value[index].version[ver_activated].startsWith('ID3')) {
      sessionFiles.value[index].meta_id3[prop] = value
    } else if (sessionFiles.value[index].version[ver_activated] === 'APEv2') {
      sessionFiles.value[index].meta_apev2[prop] = value
    } else {
      if (sessionFiles.value[index].meta_received) {
        sessionFiles.value[index].meta_received[prop] = value
      }
    }
    sessionFiles.value[index].is_modified = true
  }

  const getUniformTagValue = (field: Exclude<keyof MetaPrimary, 'artists' | 'genres'>, selected: string[]) => {
    return getUniformFieldValueSingle<Omit<FileInfo, 'cover'>, Exclude<keyof FileInfo, 'cover'>> (
      fileList.value,
      field,
      selected,
      'id'
    )
  }
  const getUniformFieldArray = (field: Extract<keyof MetaPrimary, 'artists' | 'genres'>, selected: string[]) => {
    const selectedFields = fileList.value.reduce((acc: Array<MetaPrimary[typeof field]>, cur) => { 
      if (selected.includes(cur.id)) {
        const value = cur[field]?.sort((a, b) => a.localeCompare(b))
        if (value) acc.push([...value]) // deep copy, or structure clone in EditMeta will fail
        else acc.push(value)
      }
      return acc
    }, [])
    let first = selectedFields[0]
    let firstStr = JSON.stringify(first)
    return selectedFields.every(item => JSON.stringify(item) === firstStr) 
      ? {uniformValue: (first == undefined || first.length == 0) ? [''] : first, isDifferent: false} 
      : {uniformValue: [''], isDifferent: true}
  }

  const getUniformObject = (selected: string[]) => {
    const initial: MetaEditInput = {
      title: {uniformValue: '', isDifferent: false},
      artists: {uniformValue: [''], isDifferent: false},
      album: {uniformValue: '', isDifferent: false},
      year: {uniformValue: '0', isDifferent: false}, // transfer number to string, easy for type check
      genres: {uniformValue: [''], isDifferent: false},
    }
    if (selected.length > 0) {
      let key: keyof MetaPrimary
      for (key in initial) {
        if (key === 'artists' || key === 'genres') {
          const { uniformValue, isDifferent } = getUniformFieldArray(key, selected)
          initial[key] = {uniformValue, isDifferent}
        } else {
          initial[key] = getUniformTagValue(key, selected)
        }
      }
    }
    return initial
  }

  const sortList = (field: keyof MetaPrimary, ascend: boolean) => {
    sessionFiles.value.sort((a, b) => {
      const version_a = a.version[a.ver_activate]
      const version_b = b.version[b.ver_activate]
      const meta_a = version_a.startsWith('ID3') ? a.meta_id3 : version_a === 'APEv2' ? a.meta_apev2 : a.meta_received || a.meta_id3
      const meta_b = version_b.startsWith('ID3') ? b.meta_id3 : version_b === 'APEv2' ? b.meta_apev2 : b.meta_received || b.meta_id3
      const field_a = meta_a[field]
      const field_b = meta_b[field]
      let c: number = 0
      if (field_a && field_b) {
        c = compareValue(field_a, field_b)
      }
      return ascend ? c : -c
    })
  }

  const setAcoustInfo = (id: string, info: MatchResult) => {
    for(let i = 0; i < sessionFiles.value.length; i++) {
      if (sessionFiles.value[i].id === id) {
        let info_artists = info.artists.map(item => item.name)
        const item: MetaPrimary = {
          title: info.title || fileList.value[i].title,
          artists: info_artists.length === 0 ? fileList.value[i].artists : info_artists,
          genres: sessionFiles.value[i].meta_id3.genres, //通过acoust api获取mb上的genres较复杂，此处取默认取源文件ID3的genres
          album: info.release_title || fileList.value[i].album,
          year: info.release_year || fileList.value[i].year
        }
        sessionFiles.value[i].meta_received = item
        sessionFiles.value[i].version.push('MB')
        sessionFiles.value[i].ver_activate = sessionFiles.value[i].version.length - 1

        let addtional_albumartist = info.release_artists.map(item => item.name)
        let addtional_artistids = info.artists.map(item => item.id)
        let addtional_albumartistid = info.release_artists.map(item => item.id)
        const additional: MetaAddtional = {
          ...sessionFiles.value[i].meta_additional,
          mb_trackid: info.id || sessionFiles.value[i].meta_additional.mb_trackid,
          albumartist: addtional_albumartist.length === 0 ? sessionFiles.value[i].meta_additional.albumartist : addtional_albumartist,
          mb_artistids: addtional_artistids.length === 0 ? sessionFiles.value[i].meta_additional.mb_artistids : addtional_artistids,
          mb_albumid: info.release_id || sessionFiles.value[i].meta_additional.mb_albumid,
          mb_albumartistid: addtional_albumartistid.length === 0 ? sessionFiles.value[i].meta_additional.mb_albumartistid : addtional_albumartistid,
          acoustid_id: info.acoustid_id || sessionFiles.value[i].meta_additional.acoustid_id
        }
        sessionFiles.value[i].meta_additional = additional
        if (info.cover_blob) {
          sessionFiles.value[i].cover = info.cover_blob
        }
        sessionFiles.value[i].is_modified = true
      }
    }
  }
  async function updateMetas(session_id: string, selected: string[]) {
    const items = fileList.value.reduce((acc: FileInfoMeta[], cur) => { 
      if (selected.includes(cur.id)) {
        const { path, ver_activate, encoding, version, ...item } = cur
        acc.push(item)
      }
      return acc
    }, [])
    const formData = new FormData()
    formData.append('batch_count', items.length.toString())
    items.forEach(item => {
      const { cover, ...metaWithoutCover } = item
      formData.append(`meta_${item.id}`, JSON.stringify(metaWithoutCover))
      if (cover && typeof cover !== 'string') formData.append(`cover_${item.id}`, cover, `cover_${item.id}.jpg`)
    })
    const res = await updateMetaTags(session_id, formData)
    if (res) return res.count
  }

  return { 
    fileList, 
    handleSwitchVersionType,
    updateVersion,
    updateMetas,
    getUniformField: getUniformTagValue,
    getUniformFieldArray,
    getUniformObject,
    sortList,
    setAcoustInfo,
    setActivatedMetaProp
  }
}