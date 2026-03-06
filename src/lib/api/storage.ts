"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

/**
 * Uploads a file to the configured Appwrite Storage bucket
 * Returns the $id of the newly created file
 */
export async function uploadFile(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  const { storage } = await createAdminClient();
  
  // Convert standard web File to node-appwrite InputFile
  const buffer = await file.arrayBuffer();
  const inputFile = InputFile.fromBuffer(Buffer.from(buffer), file.name);
  
  const response = await storage.createFile(
    appwriteConfig.bucketId,
    ID.unique(),
    inputFile
  );

  return response.$id;
}

/**
 * Deletes a file from the Appwrite Storage bucket
 */
export async function deleteFile(fileId: string): Promise<void> {
  const { storage } = await createAdminClient();
  
  await storage.deleteFile(
    appwriteConfig.bucketId,
    fileId
  );
}

/**
 * Generates the preview URL for a give file ID.
 * Optionally set dimensions.
 */
export async function getFilePreviewUrl(fileId: string, width?: number, height?: number): Promise<string> {
  if (!fileId) return "";
  
  const url = new URL(
    `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${fileId}/preview`
  );
  
  url.searchParams.append('project', appwriteConfig.projectId);
  if (width) url.searchParams.append('width', width.toString());
  if (height) url.searchParams.append('height', height.toString());
  
  return url.toString();
}
