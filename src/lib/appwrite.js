import { Client, Account, Functions, Storage, Databases, Teams } from 'appwrite'

export const client = new Client()
export const functions = new Functions(client)
export const storage = new Storage(client)
export const databases = new Databases(client)
export const teams = new Teams(client)

client.setEndpoint('https://fra.cloud.appwrite.io/v1').setProject('wpk')
client.setDevKey(
  'ff9e56f3d94926205324c43388bd07d127f8115b8347e3f7c5c8d7f1e3df57477c9d6ead1b2b00e0c77f375d9ac9d0dd2f2d4dca26484e0b8299c509a316b0316171c9e4d0c2bae2b26a36da712be27ffc17f085f98ee3d9c6bebf7fa65575977ac4dbd56bfbc4a66f1d53e809aa75b98cff776d560d1ca7e79ea95bdaa06e3a',
)

export const account = new Account(client)
export { ID } from 'appwrite'
