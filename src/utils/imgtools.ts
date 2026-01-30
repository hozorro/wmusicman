interface ImageCompressOptions {
  maxWidth?: number
  maxHeight?: number
  quilty?: number
}

/**
 * 
 * @param blob {Blob} original image blob
 * @param options {Object} compress options: maxWidth(default 512), maxHeight(default 512), quality(0~1,default 0.8)
 * @returns {Promise<Blob>} compressed blob
 */
export const compressImageBlob = async (blob: Blob, options: ImageCompressOptions = {}) => {
  if (!(blob instanceof Blob)) {
    console.warn('not a blob, skipped.')
    return blob
  }
  if ( blob.size === 0) {
    console.warn('blob size is 0, skipped.')
    return blob
  }
  if (blob.size < 10 * 1024) {
    console.log('blob size is less than 10KB, skipped.')
    return blob
  }
  const {
    maxWidth = 512,
    maxHeight = 512,
    quilty = 0.85,
  } = options
  try {
    return new Promise<Blob>((resolve) => { 
      const reader = new FileReader()
      reader.onerror = () => { 
        console.error('file reader error')
        resolve(blob)
      }
      reader.readAsDataURL(blob)
      reader.onload = (e) => { 
        const img = new Image()
        img.onerror = () => { 
          console.error('image load error, skipped.')
          resolve(blob)
        }
        img.src = e.target?.result as string
        img.onload = () => { 
          try {
            let width = img.width
            let height = img.height
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height)
              width = Math.floor(width * ratio)
              height = Math.floor(height * ratio)
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) { 
              ctx.drawImage(img, 0, 0, width, height)
            } else {
              console.error('canvas context error, skipped.')
              resolve(blob)
              return
            }
            if (!canvas.toBlob) {
              console.error('canvas toBlob error, skipped.')
              resolve(blob)
              return
            }
            canvas.toBlob((compressedBlob) => {
              if (!compressedBlob || compressedBlob.size === 0) {
                console.error('compressed blob error, skipped.')
                resolve(blob)
                return
              }
              resolve(compressedBlob!)
            }, 'image/jpeg', quilty)
          }catch (err) { 
            console.error('compress image process error:', err)
            resolve(blob)
          }
        }
      }
    })
  } catch (err) { 
    console.error('compress image error:', err)
    return blob
  }
}