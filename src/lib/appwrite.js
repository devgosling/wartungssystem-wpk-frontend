import { Client, Account, Functions, Storage, Databases, Teams } from 'appwrite'

export const client = new Client()
export const functions = new Functions(client)
export const storage = new Storage(client)
export const databases = new Databases(client)
export const teams = new Teams(client)

client.setEndpoint('https://fra.cloud.appwrite.io/v1').setProject('wswpk')
client.setDevKey(
  '1e1a17bafa0ad89f71a895a449cfb4fde93549fca032db3ae36217da762b9794c0023447dc8aeaa63f9fb430f948a84a8ad1976479924f327bd516655ce465688bd45389b74418de9832f344c3a17adef251f1038ff303233176b3ba032efc0519dda9d6355ca0a3a6e64734a7b0ca365298151b8e5fc628ee3ec818b5c0db19',
)

export const account = new Account(client)
export { ID } from 'appwrite'
