export function computeResizeDimensions(width, height, maxEdge) {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) return { width, height }
  const scale = maxEdge / longEdge
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

/**
 * Decode an image File, resize it so the long edge is at most maxEdge,
 * re-encode as JPEG, and return a base64 payload (no data-URL prefix).
 *
 * Produces a deterministic filename suitable for Appwrite storage.
 */
export async function resizeImageFile(
  file,
  { maxEdge = 2048, quality = 0.85, owner = 'unknown' } = {},
) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const { width, height } = computeResizeDimensions(img.naturalWidth, img.naturalHeight, maxEdge)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')

    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const random6 = Math.random().toString(36).slice(2, 8)
    const filename = `bild_${stamp}_${owner}_${random6}.jpg`

    return { base64, filename }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image decode failed'))
    img.src = src
  })
}
