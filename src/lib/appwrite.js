import { Client, Account, Functions, Storage, Databases, Teams } from 'appwrite'

export const client = new Client()
export const functions = new Functions(client)
export const storage = new Storage(client)
export const databases = new Databases(client)
export const teams = new Teams(client)

client.setEndpoint('https://fra.cloud.appwrite.io/v1').setProject('wswpk')

export const account = new Account(client)
export { ID } from 'appwrite'
