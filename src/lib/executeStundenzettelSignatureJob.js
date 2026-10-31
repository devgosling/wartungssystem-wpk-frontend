import { AppwriteException } from 'appwrite'
import { databases } from './appwrite'
import { deleteFile, getFileBlob, replaceFile } from './fileStore'
import { addCustomerSignatureToPDF } from './pdf-lib'

export async function executeCustomerSignatureJob(job) {
  const { stundenzettelId, documentId, signatureBase64 } = job

  // Download the existing PDF
  const { blob, name } = await getFileBlob(stundenzettelId)
  const pdfBuffer = await blob.arrayBuffer()

  // Add customer signature to PDF
  const [newPdfBytes] = await addCustomerSignatureToPDF(pdfBuffer, signatureBase64)

  // Replace the file in place, keeping ID and name
  await replaceFile(stundenzettelId, new File([newPdfBytes], name, { type: 'application/pdf' }))

  // Update the document in the database
  await databases.updateDocument('wartungssystem', 'stundenzettel', documentId, {
    unterschrieben_kunde: true,
  })
}

export async function executeDeleteStundenzettelJob(job) {
  const { stundenzettelId, documentId } = job

  try {
    await deleteFile(stundenzettelId)
  } catch (err) {
    // Already gone, e.g. a previous attempt failed after deleting the file.
    if (!(err instanceof AppwriteException && err.code === 404)) throw err
  }
  await databases.deleteDocument('wartungssystem', 'stundenzettel', documentId)
}
