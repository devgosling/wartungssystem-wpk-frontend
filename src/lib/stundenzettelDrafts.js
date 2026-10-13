import { openDB } from 'idb'

let dbPromise

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB('stundenzettel-drafts', 1, {
      upgrade(db) {
        db.createObjectStore('drafts', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function getAllDrafts() {
  const db = await getDB()
  const drafts = await db.getAll('drafts')
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function putDraft(draft) {
  const db = await getDB()
  await db.put('drafts', draft)
}

export async function deleteDraft(id) {
  const db = await getDB()
  await db.delete('drafts', id)
}
