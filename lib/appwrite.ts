import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client };

// Database and Collection IDs - You'll need to create these in Appwrite
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const UPLOADS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_UPLOADS_COLLECTION_ID || '';
export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '';