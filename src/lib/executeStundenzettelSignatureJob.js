import { storage, databases, account } from './appwrite'
import { addCustomerSignatureToPDF, addControlSignatureToPDF } from './pdf-lib'

export async function executeCustomerSignatureJob(job) {
  const { stundenzettelId, documentId, signatureBase64 } = job

  // Download the existing PDF
  const fileDownload = await storage.getFileDownload('storage', stundenzettelId)
  const fileData = await storage.getFile('storage', stundenzettelId)
  const jwtObject = await account.createJWT()
  const fileResponse = await fetch(
    `${fileDownload}${fileDownload.includes('?') ? '&' : '?'}_t=${Date.now()}`,
    {
      headers: { 'x-appwrite-jwt': jwtObject.jwt },
      cache: 'no-store',
    },
  )
  const blob = await fileResponse.blob()
  const pdfBuffer = await blob.arrayBuffer()

  // Add customer signature to PDF
  const [newPdfBytes] = await addCustomerSignatureToPDF(pdfBuffer, signatureBase64)

  // Delete old file and upload new one with same ID and same name
  await storage.deleteFile('storage', stundenzettelId)

  const newFile = new File([newPdfBytes], fileData.name, {
    type: 'application/pdf',
  })
  await storage.createFile('storage', stundenzettelId, newFile)

  // Update the document in the database
  await databases.updateDocument('wartungssystem', 'stundenzettel', documentId, {
    unterschrieben_kunde: true,
  })
}

export async function executeControlSignatureJob(job) {
  const { stundenzettelId, documentId, signatureBase64 } = job

  // Download the existing PDF
  const fileDownload = await storage.getFileDownload('storage', stundenzettelId)
  const fileData = await storage.getFile('storage', stundenzettelId)
  const jwtObject = await account.createJWT()
  const fileResponse = await fetch(
    `${fileDownload}${fileDownload.includes('?') ? '&' : '?'}_t=${Date.now()}`,
    {
      headers: { 'x-appwrite-jwt': jwtObject.jwt },
      cache: 'no-store',
    },
  )
  const blob = await fileResponse.blob()
  const pdfBuffer = await blob.arrayBuffer()

  // Add control signature to PDF
  const [newPdfBytes] = await addControlSignatureToPDF(pdfBuffer, signatureBase64)

  // Delete old file and upload new one with same ID and same name
  await storage.deleteFile('storage', stundenzettelId)

  const newFile = new File([newPdfBytes], fileData.name, {
    type: 'application/pdf',
  })
  await storage.createFile('storage', stundenzettelId, newFile)

  // Update the document in the database
  await databases.updateDocument('wartungssystem', 'stundenzettel', documentId, {
    ueberprueft: true,
  })
}

export async function executeDeleteStundenzettelJob(job) {
  const { stundenzettelId, documentId } = job

  await storage.deleteFile('storage', stundenzettelId)
  await databases.deleteDocument('wartungssystem', 'stundenzettel', documentId)
}
