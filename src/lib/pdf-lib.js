import { PDFDocument, grayscale, rgb } from 'pdf-lib'
import motorpdf from '../assets/wartungsberichte/Wartungsbericht_Motor_Formular.pdf'
import muellpdf from '../assets/wartungsberichte/Wartungsbericht_Muellanlage_Formular.pdf'
import pumpepdf from '../assets/wartungsberichte/Wartungsbericht_Pumpe_Formular.pdf'
import wehrtorpdf from '../assets/wartungsberichte/Wartungsbericht_Wehrtore_Formular.pdf'
import luefterpdf from '../assets/wartungsberichte/Wartungsbericht_Luefter_Formular.pdf'
import schmutzwasserpdf from '../assets/wartungsberichte/Wartungsbericht_Schmutzwasser_Formular.pdf'
import waermetauscherpdf from '../assets/wartungsberichte/Wartungsbericht_Waermetauscher_Formular.pdf'
import enthaertungsanlagepdf from '../assets/wartungsberichte/Ueberpruefungsbericht_Enthaertungsanlage_Formular.pdf'
import stundenzettelpdf from '../assets/wartungsberichte/Stundenzettel_Formular.pdf'
import fieldDataMotor from '../assets/wartungsberichte/fillers/motor.json'
import fieldDataMuell from '../assets/wartungsberichte/fillers/muellanlage.json'
import fieldDataPumpe from '../assets/wartungsberichte/fillers/pumpe.json'
import fieldDataWehrtor from '../assets/wartungsberichte/fillers/wehrtor.json'
import fieldDataLuefter from '../assets/wartungsberichte/fillers/luefter.json'
import fieldDataSchmutzwasser from '../assets/wartungsberichte/fillers/schmutzwasser.json'
import fieldDataWaermetauscher from '../assets/wartungsberichte/fillers/waermetauscher.json'
import fieldDataEnthaertungsanlage from '../assets/wartungsberichte/fillers/enthaertungsanlage.json'
import fieldDataStundenzettel from '../assets/wartungsberichte/fillers/stundenzettel.json'
import { useInputStore } from '@/stores/inputStore'

export const fillMotorPDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(motorpdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form.getTextField(fieldDataMotor.textfields.employee).setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataMotor.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataMotor.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    // SET TEXT FIELDS
    if (fieldDataMotor.textfields[key]) {
      form.getTextField(fieldDataMotor.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataMotor.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataMotor.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataMotor.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataMotor.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataMotor.checkboxes[key]).uncheck()
      }
    }
  }

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillMüllanlagePDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(muellpdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form.getTextField(fieldDataMuell.textfields.employee).setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataMuell.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataMuell.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    // SET TEXT FIELDS
    if (fieldDataMuell.textfields[key]) {
      form.getTextField(fieldDataMuell.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataMuell.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataMuell.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataMuell.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataMuell.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataMuell.checkboxes[key]).uncheck()
      }
    }
  }

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[1]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillPumpePDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(pumpepdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form.getTextField(fieldDataPumpe.textfields.employee).setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataPumpe.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataPumpe.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    console.log(key, value)

    // SET TEXT FIELDS
    if (fieldDataPumpe.textfields[key]) {
      form.getTextField(fieldDataPumpe.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataPumpe.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataPumpe.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataPumpe.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataPumpe.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataPumpe.checkboxes[key]).uncheck()
      }
    }
  }

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillWehrtorePDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(wehrtorpdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form.getTextField(fieldDataWehrtor.textfields.employee).setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataWehrtor.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataWehrtor.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    // SET TEXT FIELDS
    if (fieldDataWehrtor.textfields[key]) {
      form.getTextField(fieldDataWehrtor.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataWehrtor.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataWehrtor.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataWehrtor.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataWehrtor.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataWehrtor.checkboxes[key]).uncheck()
      }
    }
  }

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillLüfterPDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(luefterpdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form.getTextField(fieldDataLuefter.textfields.employee).setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataLuefter.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataLuefter.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    // SET TEXT FIELDS
    if (fieldDataLuefter.textfields[key]) {
      form.getTextField(fieldDataLuefter.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataLuefter.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataLuefter.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataLuefter.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataLuefter.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataLuefter.checkboxes[key]).uncheck()
      }
    }
  }

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 30,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillSchmutzwasserPDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(schmutzwasserpdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form.getTextField(fieldDataSchmutzwasser.textfields.employee).setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataSchmutzwasser.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataSchmutzwasser.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    // SET TEXT FIELDS
    if (fieldDataSchmutzwasser.textfields[key]) {
      form.getTextField(fieldDataSchmutzwasser.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataSchmutzwasser.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataSchmutzwasser.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataSchmutzwasser.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataSchmutzwasser.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataSchmutzwasser.checkboxes[key]).uncheck()
      }
    }
  }

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillWärmetauscherPDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(waermetauscherpdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form.getTextField(fieldDataWaermetauscher.textfields.employee).setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataWaermetauscher.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataWaermetauscher.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    // SET TEXT FIELDS
    if (fieldDataWaermetauscher.textfields[key]) {
      form.getTextField(fieldDataWaermetauscher.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataWaermetauscher.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataWaermetauscher.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataWaermetauscher.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataWaermetauscher.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataWaermetauscher.checkboxes[key]).uncheck()
      }
    }
  }

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillEnthärtungsanlagePDF = async (inputValues, signatureBase64) => {
  const formPdfBytes = await fetch(enthaertungsanlagepdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)
  const inputData = await useInputStore().inputData

  const form = pdfDoc.getForm()

  // SET IMPORTANT DATA
  if (inputValues['identifier']) form.getTextField('Identifier').setText(inputValues['identifier'])
  form
    .getTextField(fieldDataEnthaertungsanlage.textfields.employee)
    .setText(`${inputValues.employee}`)
  form
    .getTextField(fieldDataEnthaertungsanlage.textfields.date)
    .setText(
      `${new Date(inputValues.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    )
  form
    .getTextField(fieldDataEnthaertungsanlage.textfields.customerdata)
    .setText(
      `${inputValues.customer.name}\n\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
    )

  // SET FIELDS
  for (const [key, value] of Object.entries(inputData)) {
    // SET TEXT FIELDS
    if (fieldDataEnthaertungsanlage.textfields[key]) {
      form.getTextField(fieldDataEnthaertungsanlage.textfields[key]).setText(value.toString())
    }

    // SET RADIO GROUPS
    if (fieldDataEnthaertungsanlage.radiogroups[key] && value) {
      form.getRadioGroup(fieldDataEnthaertungsanlage.radiogroups[key]).select('Auswahl' + value)
    }

    // SET CHECKBOXES
    if (fieldDataEnthaertungsanlage.checkboxes[key]) {
      if (value == true) {
        form.getCheckBox(fieldDataEnthaertungsanlage.checkboxes[key]).check()
      } else {
        form.getCheckBox(fieldDataEnthaertungsanlage.checkboxes[key]).uncheck()
      }
    }

    if (key.startsWith('group_') && value || value === 0) {
      form.getTextField(key).setText(value.toFixed(1).toString().replace('.', ','))
    }
  }

  // TODO: SET GROUP FIELDS

  // SET SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDims = (await signatureImage).scale(scaleToWidth / signatureImage.width)

  firstPage.drawImage(signatureImage, {
    x: 453,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]

  /*var blob = new Blob([pdfBytes], { type: 'application/pdf' })
  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'Motor_Form_' + Math.round(Math.random() * 10000) + '.pdf'
  link.click()*/
}

export const fillStundenzettelPDF = async (
  inputValues,
  stundenData,
  signatureBase64Monteur,
  signatureBase64Kunde,
) => {
  const formPdfBytes = await fetch(stundenzettelpdf).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(formPdfBytes)
  const signatureImageMonteur = await pdfDoc.embedPng(signatureBase64Monteur)
  const signatureImageKunde = signatureBase64Kunde
    ? await pdfDoc.embedPng(signatureBase64Kunde)
    : null

  const form = pdfDoc.getForm()

  // SET HEADER DATA
  if (fieldDataStundenzettel.textfields.monteur && inputValues.employee) {
    form.getTextField(fieldDataStundenzettel.textfields.monteur).setText(inputValues.employee)
  }
  if (fieldDataStundenzettel.textfields.kunde && inputValues.customer) {
    form
      .getTextField(fieldDataStundenzettel.textfields.kunde)
      .setText(
        `${inputValues.customer.name}\n${inputValues.customer['address.street']}\n${inputValues.customer['address.zipcode']} ${inputValues.customer['address.city']}`,
      )
  }
  if (fieldDataStundenzettel.textfields.objekt && inputValues.objekt) {
    form.getTextField(fieldDataStundenzettel.textfields.objekt).setText(inputValues.objekt)
  }
  if (fieldDataStundenzettel.textfields.bestellNr && inputValues.bestellNr) {
    form.getTextField(fieldDataStundenzettel.textfields.bestellNr).setText(inputValues.bestellNr)
  }
  if (fieldDataStundenzettel.textfields.auftragsNr && inputValues.auftragsNr) {
    form.getTextField(fieldDataStundenzettel.textfields.auftragsNr).setText(inputValues.auftragsNr)
  }
  if (
    fieldDataStundenzettel.textfields.employees &&
    inputValues.employees &&
    inputValues.employees.length > 0
  ) {
    form
      .getTextField(fieldDataStundenzettel.textfields.employees)
      .setText(inputValues.employees.join(', '))
  }

  // SET TABLE ROWS
  for (let i = 0; i < stundenData.rows.length; i++) {
    const row = stundenData.rows[i]
    const rowPrefix = `rows.${i}.`

    // Format date if it exists
    if (row.datum && fieldDataStundenzettel.textfields[rowPrefix + 'datum']) {
      const dateStr = new Date(row.datum).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      form.getTextField(fieldDataStundenzettel.textfields[rowPrefix + 'datum']).setText(dateStr)
    }

    // Set other row fields
    const rowFields = [
      'anfahrt1',
      'anfahrt2',
      'anfahrtStd',
      'anfahrtKm',
      'arbeitszeit1',
      'arbeitszeit2',
      'pause',
      'pauseStd',
      'abfahrt1',
      'abfahrt2',
      'abfahrtStd',
      'abfahrtKm',
      'totalStd',
      'totalKm',
    ]
    for (const field of rowFields) {
      const fieldKey = rowPrefix + field
      if (row[field] && fieldDataStundenzettel.textfields[fieldKey]) {
        form
          .getTextField(fieldDataStundenzettel.textfields[fieldKey])
          .setText(row[field].toString())
      }
    }
  }

  // SET TOTALS
  if (stundenData.totalPause && fieldDataStundenzettel.textfields.totalPause) {
    form
      .getTextField(fieldDataStundenzettel.textfields.totalPause)
      .setText(stundenData.totalPause.toString())
  }
  if (stundenData.totalAbfahrt && fieldDataStundenzettel.textfields.totalAbfahrt) {
    form
      .getTextField(fieldDataStundenzettel.textfields.totalAbfahrt)
      .setText(stundenData.totalAbfahrt.toString())
  }
  if (stundenData.totalAnfahrt && fieldDataStundenzettel.textfields.totalAnfahrt) {
    form
      .getTextField(fieldDataStundenzettel.textfields.totalAnfahrt)
      .setText(stundenData.totalAnfahrt.toString())
  }
  if (stundenData.totalKm && fieldDataStundenzettel.textfields.totalKm) {
    form
      .getTextField(fieldDataStundenzettel.textfields.totalKm)
      .setText(stundenData.totalKm.toString())
  }
  if (stundenData.totalStd && fieldDataStundenzettel.textfields.totalStd) {
    form
      .getTextField(fieldDataStundenzettel.textfields.totalStd)
      .setText(stundenData.totalStd.toString())
  }

  // SET TEXTAREAS
  if (stundenData.ausgefuehrteArbeiten && fieldDataStundenzettel.textfields.ausgefuehrteArbeiten) {
    form
      .getTextField(fieldDataStundenzettel.textfields.ausgefuehrteArbeiten)
      .setText(stundenData.ausgefuehrteArbeiten)
  }
  if (stundenData.material && fieldDataStundenzettel.textfields.material) {
    form.getTextField(fieldDataStundenzettel.textfields.material).setText(stundenData.material)
  }

  // SET CHECKBOXES (Besonderheiten)
  if (stundenData.notdienst && fieldDataStundenzettel.checkboxes.notdienst) {
    form.getCheckBox(fieldDataStundenzettel.checkboxes.notdienst).check()
  }
  if (stundenData.kundendienst && fieldDataStundenzettel.checkboxes.kundendienst) {
    form.getCheckBox(fieldDataStundenzettel.checkboxes.kundendienst).check()
  }
  if (stundenData.wartung && fieldDataStundenzettel.checkboxes.wartung) {
    form.getCheckBox(fieldDataStundenzettel.checkboxes.wartung).check()
  }

  // SET MONTEUR SIGNATURE
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  let scaleToWidth = 110.4
  const pngDimsMonteur = (await signatureImageMonteur).scale(
    scaleToWidth / signatureImageMonteur.width,
  )

  firstPage.drawImage(signatureImageMonteur, {
    x: 90,
    y: 41,
    width: pngDimsMonteur.width,
    height: pngDimsMonteur.height,
  })

  // SET KUNDE SIGNATURE (only if customer signed)
  if (signatureImageKunde) {
    const pngDimsKunde = (await signatureImageKunde).scale(scaleToWidth / signatureImageKunde.width)

    firstPage.drawImage(signatureImageKunde, {
      x: 455,
      y: 41,
      width: pngDimsKunde.width,
      height: pngDimsKunde.height,
    })
  }

  // SAVE PDF
  const pdfBytes = await pdfDoc.save()
  const pdfBase64 = await pdfDoc.saveAsBase64()

  return [pdfBytes, pdfBase64]
}

export const getAmountOfPagesInPDF = async (pdfBytes) => {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  return pdfDoc.getPageCount()
}

/**
 * Add a customer signature to an existing Stundenzettel PDF
 * @param {ArrayBuffer} pdfBytes - The existing PDF bytes
 * @param {string} signatureBase64 - The signature as base64 PNG
 * @returns {Promise<[Uint8Array, string]>} - [pdfBytes, pdfBase64]
 */
export const addCustomerSignatureToPDF = async (pdfBytes, signatureBase64) => {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const signatureImage = await pdfDoc.embedPng(signatureBase64)

  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const scaleToWidth = 110.4
  const pngDims = signatureImage.scale(scaleToWidth / signatureImage.width)

  // Customer signature position (x: 400, y: 41) - same as in fillStundenzettelPDF
  firstPage.drawImage(signatureImage, {
    x: 455,
    y: 41,
    width: pngDims.width,
    height: pngDims.height,
  })

  const newPdfBytes = await pdfDoc.save()
  const newPdfBase64 = await pdfDoc.saveAsBase64()

  return [newPdfBytes, newPdfBase64]
}
