import { Client, Account, Databases, Storage } from 'appwrite';
import { appwriteConfig } from './config';

let client: Client | undefined;
let account: Account | undefined;
let databases: Databases | undefined;
let storage: Storage | undefined;

// Pattern: Singleton instantiation for the Client-Side SDK
export function getAppwriteClient() {
  if (!client) {
    client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);
  }

  if (!account) account = new Account(client);
  if (!databases) databases = new Databases(client);
  if (!storage) storage = new Storage(client);

  return {
    client,
    account,
    databases,
    storage
  };
}
