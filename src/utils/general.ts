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