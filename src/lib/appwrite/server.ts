import { Client, Account, Databases, Users, Storage } from 'node-appwrite';
import { appwriteConfig } from './config';

/**
 * Creates an admin Appwrite client instance for use strictly on the server 
 * (API Routes, Server Actions, Server Components).
 * Uses the secret API Key to bypass client limitations.
 */
export async function createAdminClient() {
  if (!process.env.APPWRITE_API_KEY) {
    throw new Error('APPWRITE_API_KEY environment variable is missing.');
  }

  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get users() {
      return new Users(client);
    },
    get storage() {
      return new Storage(client);
    }
  };
}
