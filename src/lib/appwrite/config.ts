export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
  
  collections: {
    customers: process.env.NEXT_PUBLIC_COLLECTION_CUSTOMERS!,
    inventoryItems: process.env.NEXT_PUBLIC_COLLECTION_INVENTORY_ITEMS!,
    products: process.env.NEXT_PUBLIC_COLLECTION_PRODUCTS!,
    productMaterials: process.env.NEXT_PUBLIC_COLLECTION_PRODUCT_MATERIALS!,
    orders: process.env.NEXT_PUBLIC_COLLECTION_ORDERS!,
    invoices: process.env.NEXT_PUBLIC_COLLECTION_INVOICES!,
    payments: process.env.NEXT_PUBLIC_COLLECTION_PAYMENTS!,
    quotations: process.env.NEXT_PUBLIC_COLLECTION_QUOTATIONS!,
    businessConfig: process.env.NEXT_PUBLIC_COLLECTION_BUSINESS_CONFIG || "business_config",
    expenses: process.env.NEXT_PUBLIC_COLLECTION_EXPENSES!,
    jobTasks: process.env.NEXT_PUBLIC_COLLECTION_JOB_TASKS!,
  }
};

// Validate config at runtime to catch missing variables early
export function validateAppwriteConfig() {
  const missingVars = [];
  if (!appwriteConfig.endpoint) missingVars.push('NEXT_PUBLIC_APPWRITE_ENDPOINT');
  if (!appwriteConfig.projectId) missingVars.push('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  
  if (missingVars.length > 0) {
    console.error(`Missing required Appwrite environment variables: ${missingVars.join(', ')}`);
  }
}
