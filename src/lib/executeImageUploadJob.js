import { storage, databases, ID } from './appwrite'
import { Permission, Role } from 'appwrite'

const ADMIN_TEAM_ID = '68866cde003207e2fbab'

// Appwrite only lets a client grant roles it holds itself, so when an admin
// uploads on behalf of an employee the owner-specific permissions are left out.
function filePermissions(ownerId, uploadedBy) {
  const adminPermissions = [
    Permission.read(Role.users()),
    Permission.update(Role.team(ADMIN_TEAM_ID)),
    Permission.delete(Role.team(ADMIN_TEAM_ID)),
  ]
  if (ownerId !== uploadedBy) return adminPermissions
  return [
    ...adminPermissions,
    Permission.update(Role.user(ownerId)),
    Permission.delete(Role.user(ownerId)),
  ]
}

export async function executeImageUploadJob(job) {
  const { owner, folderId, filename, imageBase64 } = job
  const uploadedBy = job.uploadedBy ?? owner

  if (!folderId) {
    throw new Error('IMAGE_UPLOAD_MISSING_FOLDER')
  }

  const blob = await (await fetch('data:image/jpeg;base64,' + imageBase64)).blob()
  const file = new File([blob], filename, { type: 'image/jpeg' })

  const fileId = ID.unique()
  const perms = filePermissions(owner, uploadedBy)

  await storage.createFile('storage', fileId, file, perms)

  await databases.createDocument(
    'wartungssystem',
    'imageupload',
    ID.unique(),
    { owner, folderId, associatedFile: fileId },
    perms,
  )
}

export async function executeImageDeleteJob(job) {
  const { documentId, fileId } = job
  await storage.deleteFile('storage', fileId)
  await databases.deleteDocument('wartungssystem', 'imageupload', documentId)
}
