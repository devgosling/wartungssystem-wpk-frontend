import { databases } from './appwrite'
import { Permission, Role, Query } from 'appwrite'
import { clearPendingFlag, deleteFolder as removeCachedFolder } from './imageFolderCache'

const ADMIN_TEAM_ID = '68866cde003207e2fbab'

function folderPermissions(createdBy) {
  return [
    Permission.read(Role.users()),
    Permission.update(Role.user(createdBy)),
    Permission.delete(Role.user(createdBy)),
    Permission.update(Role.team(ADMIN_TEAM_ID)),
    Permission.delete(Role.team(ADMIN_TEAM_ID)),
  ]
}

export async function executeFolderCreateJob(job) {
  const { $id, name, level, parent, customerId, createdBy } = job
  await databases.createDocument(
    'wartungssystem',
    'imagefolder',
    $id,
    { name, level, parent: parent ?? null, customerId: customerId ?? null, createdBy },
    folderPermissions(createdBy),
  )
  await clearPendingFlag($id, 'pendingCreate')
}

export async function executeFolderDeleteJob(job) {
  const { $id } = job

  const childFolders = await databases.listDocuments('wartungssystem', 'imagefolder', [
    Query.equal('parent', $id),
    Query.limit(1),
  ])
  if (childFolders.total > 0) {
    throw new Error('FOLDER_NOT_EMPTY')
  }

  const childImages = await databases.listDocuments('wartungssystem', 'imageupload', [
    Query.equal('folderId', $id),
    Query.limit(1),
  ])
  if (childImages.total > 0) {
    throw new Error('FOLDER_NOT_EMPTY')
  }

  await databases.deleteDocument('wartungssystem', 'imagefolder', $id)
  await removeCachedFolder($id)
}
