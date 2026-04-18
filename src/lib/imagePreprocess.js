export function computeResizeDimensions(width, height, maxEdge) {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) return { width, height }
  const scale = maxEdge / longEdge
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}
