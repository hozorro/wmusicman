export function getFileName(filePath: string): string {
  // 处理空字符串或无效输入
  if (!filePath.trim()) return "";

  // 统一分隔符后分割（兼容性更好）
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  
  // 返回最后一部分（可能是文件名或目录名）
  return parts[parts.length - 1];
}

export function getFileNameWithoutExt(filePath: string): string {
  // 1. 统一路径分隔符为 /
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // 2. 获取文件名（兼容 Windows/Linux）
  const fileName = normalizedPath.split('/').pop() || "";
  
  // 3. 处理无扩展名或隐藏文件的情况
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex <= 0) return fileName; // 无扩展名或隐藏文件（如 .gitignore）
  
  // 4. 返回去掉扩展名的部分
  return fileName.substring(0, lastDotIndex);
}

export function formatSize(size: number) {
  if (size < 1024) return size + ' B';
  if (size < 1048576) return (size / 1024).toFixed(2) + ' KB';
  if (size < 1073741824) return (size / 1048576).toFixed(2) + ' MB';
  return (size / 1073741824).toFixed(2) + ' GB';
}

export function timeStampToDate(timestamp: number) {
  if (timestamp < 369743025) return timestamp.toString();
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatTimeDuration(duration: number) { 
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  if (hours === 0) {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function compareValue<T extends (string | number | string[])>(a:T, b:T): number {
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (Array.isArray(a) && Array.isArray(b)) return a[0].localeCompare(b[0])
  return 0
}

export function compareArray(a:string[], b:string[]): boolean {
  let a_cloned = [...a]
  let b_cloned = [...b]
  a_cloned.sort((m, n) => m.localeCompare(n))
  b_cloned.sort((m, n) => m.localeCompare(n))
  if (JSON.stringify(a_cloned) === JSON.stringify(b_cloned)) return true
  return false
}

export function get_set<T extends {[P in keyof T]: string | number | undefined}, K extends keyof T>(items: T[], field: K): T[K]{
  let item_list = items.map(item => item[field])
  let item_set = new Set(item_list)
  if(item_set.size === 1){
    return item_set.values().next().value as T[K]
  }else{
    return '*多值*' as never as T[K]
  }
}

export function getUniformFieldValueSingle<T extends {[P in keyof T]: string | number | string[] | undefined}, K extends keyof T>(objArray: T[], field: K, selected: (T[K])[], sid: K): any {
  let first = null;
  for (let i = 0; i < objArray.length; i++) {
    if (selected.includes(objArray[i][sid])) {
      if (first === null) first = objArray[i][field];
      if (objArray[i][field] !== first) {
        return { uniformValue: '', isDifferent: true }
      }
    }
  }
  return { uniformValue: (first ?? '').toString(), isDifferent: false }
}

export function getUniformFieldValueArray<T extends {[P in keyof T]: string | number | string[] | undefined}, K extends keyof T>(objArray: T[], field: K, selected: (T[K])[], sid: K): any {
  // if (objArray.length === 0) return { uniformValue: [''], isDifferent: false };
  // else {
  //   if (objArray[0][field] instanceof Array) {
  //     const selectedFields = objArray.reduce((acc: string[][], obj) => {
  //       if (selected.includes(obj[sid])) {
  //         const fieldValue = [...(obj[field] as string[])];
  //         fieldValue.sort((a, b) => a.localeCompare(b));
  //         if (fieldValue) acc.push(fieldValue);
  //       }
  //       return acc;
  //     }, []);
  //     let first = selectedFields[0];
  //     let firstStr = JSON.stringify(first)
  //     return selectedFields.every(item => JSON.stringify(item) === firstStr) 
  //       ? { uniformValue: (first == undefined || first.length == 0) ? [''] : first, isDifferent: false } 
  //       : { uniformValue: [''], isDifferent: true };
  //   }
  // }
  let first = null
  for (let i = 0; i < objArray.length; i++) {
    if (selected.includes(objArray[i][sid])) {
      const fieldValue = [...(objArray[i][field] as string[])];
      fieldValue.sort((a, b) => a.localeCompare(b));
      if (first === null) first = fieldValue
      if (JSON.stringify(fieldValue) !== JSON.stringify(first)) {
        return { uniformValue: [''], isDifferent: true }
      }
    }
  }
  return { uniformValue: (first ?? ['']), isDifferent: false }
}

export async function urlToFile(url: string, filename: string): Promise<File> { 
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

export class AssetImageCache {
  private cache: Map<string, File> = new Map();

  async getImage(assetUrl: string, filename: string): Promise<File | null> {
    if (this.cache.has(assetUrl)) {
      return this.cache.get(assetUrl)!;
    }

    const file = await urlToFile(assetUrl, filename);
    this.cache.set(assetUrl, file);
    return file;
  }

  clear() {
    this.cache.clear();
  }
}

export const assetImageCache = new AssetImageCache();