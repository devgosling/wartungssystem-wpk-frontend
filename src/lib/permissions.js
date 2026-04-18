export function canDeleteImage(image, currentUserId, isAdmin) {
  if (!image) return false
  if (!currentUserId) return false
  if (isAdmin) return true
  return image.owner === currentUserId
}
