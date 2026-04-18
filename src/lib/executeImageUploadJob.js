import { storage, databases, ID } from './appwrite'
import { Permission, Role } from 'appwrite'

const ADMIN_TEAM_ID = '68866cde003207e2fbab'

function filePermissions(ownerId) {
  return [
    Permission.read(Role.users()),
    Permission.update(Role.user(ownerId)),
    Permission.delete(Role.user(ownerId)),
    Permission.update(Role.team(ADMIN_TEAM_ID)),
    Permission.delete(Role.team(ADMIN_TEAM_ID)),
  ]
}

export async function executeImageUploadJob(job) {
  const { owner, filename, imageBase64 } = job

  const blob = await (await fetch('data:image/jpeg;base64,' + imageBase64)).blob()
  const file = new File([blob], filename, { type: 'image/jpeg' })

  const fileId = ID.unique()
  const perms = filePermissions(owner)

  await storage.createFile('storage', fileId, file, perms)

  await databases.createDocument(
    'wartungssystem',
    'imageupload',
    ID.unique(),
    { owner, associatedFile: fileId },
    perms,
  )
}

export async function executeImageDeleteJob(job) {
  const { documentId, fileId } = job
  await storage.deleteFile('storage', fileId)
  await databases.deleteDocument('wartungssystem', 'imageupload', documentId)
}
