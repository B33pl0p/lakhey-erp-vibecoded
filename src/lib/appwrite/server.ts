import { Client, Account, Databases, Users, Storage } from 'node-appwrite';
import { cookies } from 'next/headers';
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

/**
 * Creates an Appwrite client scoped to the current user's session cookie.
 * Use this in Server Components / Server Actions that act on behalf of the logged-in user.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  const session = cookieStore.get('appwrite-session');

  if (!session?.value) {
    throw new Error('No active session');
  }

  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}
