export function canDeleteImage(image, currentUserId, isAdmin) {
  if (!image) return false
  if (!currentUserId) return false
  if (isAdmin) return true
  return image.owner === currentUserId
}

export function canDeleteFolder(folder, currentUserId, isAdmin) {
  if (!folder) return false
  if (!currentUserId) return false
  if (isAdmin) return true
  return folder.createdBy === currentUserId
}
