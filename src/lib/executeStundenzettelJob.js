import { storage, databases, ID } from './appwrite'

export async function executeStundenzettelJob(job) {
  const { pdfBase64, inputValues } = job

  const blob = await (await fetch('data:application/pdf;base64,' + pdfBase64)).blob()
  const fileID = ID.unique()

  const filename =
    `Stundennachweis_` +
    `${new Date().toLocaleDateString('de-DE').replaceAll('.', '-')}_` +
    `${inputValues.customer?.name?.replaceAll(' ', '_') || 'Unbekannt'}_` +
    `${inputValues.employee.replaceAll(' ', '_')}.pdf`

  const file = new File([blob], filename, { type: 'application/pdf' })

  // Upload PDF
  await storage.createFile('storage', fileID, file)

  console.log(inputValues)

  // Create document in stundenzettel collection
  await databases.createDocument('wartungssystem', 'stundenzettel', ID.unique(), {
    mitarbeiter: inputValues.employee,
    erstellungsdatum: new Date(),
    input: JSON.stringify(inputValues),
    kunde: JSON.stringify(inputValues.customer),
    stundenzettelId: fileID,
    objekt: inputValues.objekt || '',
    bestellNr: inputValues.bestellNr || '',
    auftragsNr: inputValues.auftragsNr || '',
    unterschrieben_kunde: inputValues.unterschriebenKunde || false,
    ueberprueft: false,
  })
}
