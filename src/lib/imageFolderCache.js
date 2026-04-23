import { openDB } from 'idb'

let dbPromise

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB('bilderuploads-folders', 1, {
      upgrade(db) {
        const store = db.createObjectStore('folders', { keyPath: '$id' })
        store.createIndex('parent', 'parent')
      },
    })
  }
  return dbPromise
}

export async function getAllFolders() {
  const db = await getDB()
  return db.getAll('folders')
}

export async function putFolder(folder) {
  const db = await getDB()
  await db.put('folders', folder)
}

export async function putFolders(folders) {
  const db = await getDB()
  const tx = db.transaction('folders', 'readwrite')
  for (const f of folders) tx.store.put(f)
  await tx.done
}

export async function deleteFolder(id) {
  const db = await getDB()
  await db.delete('folders', id)
}

export async function clearPendingFlag(id, flag) {
  const db = await getDB()
  const folder = await db.get('folders', id)
  if (!folder) return
  delete folder[flag]
  await db.put('folders', folder)
}

export async function replaceAll(serverFolders) {
  const db = await getDB()
  const tx = db.transaction('folders', 'readwrite')
  const existing = await tx.store.getAll()
  const pendingIds = new Set(
    existing.filter((f) => f.pendingCreate || f.pendingDelete).map((f) => f.$id),
  )
  await tx.store.clear()
  for (const f of serverFolders) tx.store.put(f)
  for (const f of existing) {
    if (pendingIds.has(f.$id) && !serverFolders.some((s) => s.$id === f.$id)) {
      tx.store.put(f)
    }
  }
  await tx.done
}
