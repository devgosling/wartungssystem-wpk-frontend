import { getPendingJobs, removeJob } from './offlineQueue'
import { executeJob } from './executeJob'
import { executeStundenzettelJob } from './executeStundenzettelJob'
import {
  executeCustomerSignatureJob,
  executeControlSignatureJob,
  executeDeleteStundenzettelJob,
} from './executeStundenzettelSignatureJob'
import { executeImageUploadJob, executeImageDeleteJob } from './executeImageUploadJob'

export async function processJobs() {
  const jobs = await getPendingJobs()
  for (const job of jobs) {
    try {
      if (job.type === 'stundenzettel') {
        await executeStundenzettelJob(job)
      } else if (job.type === 'customer-signature') {
        await executeCustomerSignatureJob(job)
      } else if (job.type === 'control-signature') {
        await executeControlSignatureJob(job)
      } else if (job.type === 'delete-stundenzettel') {
        await executeDeleteStundenzettelJob(job)
      } else if (job.type === 'image-upload') {
        await executeImageUploadJob(job)
      } else if (job.type === 'image-delete') {
        await executeImageDeleteJob(job)
      } else {
        await executeJob(job)
      }
      await removeJob(job.id)
    } catch (err) {
      console.error('Failed to process job', err)
      break
    }
  }
}

let listenerRegistered = false

export function setupOfflineJobProcessor() {
  if (listenerRegistered) return
  listenerRegistered = true
  window.addEventListener('online', processJobs)
}
