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
    websiteSettings: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_SETTINGS || "website_settings",
    websiteTestimonials: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_TESTIMONIALS || "website_testimonials",
    websiteClients: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_CLIENTS || "website_clients",
    websiteSections: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_SECTIONS || "website_sections",
    websiteFaq: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_FAQ || "website_faq",
    websiteInquiries: process.env.NEXT_PUBLIC_COLLECTION_WEBSITE_INQUIRIES || "website_inquiries",
  }
};

// Validate config at runtime to catch missing variables early
export function validateAppwriteConfig() {
  const missingVars: string[] = [];

  if (!appwriteConfig.endpoint) missingVars.push('NEXT_PUBLIC_APPWRITE_ENDPOINT');
  if (!appwriteConfig.projectId) missingVars.push('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  if (!appwriteConfig.databaseId) missingVars.push('APPWRITE_DATABASE_ID or NEXT_PUBLIC_APPWRITE_DATABASE_ID');
  if (!appwriteConfig.bucketId) missingVars.push('NEXT_PUBLIC_APPWRITE_BUCKET_ID');
  if (!appwriteConfig.collections.customers) missingVars.push('NEXT_PUBLIC_COLLECTION_CUSTOMERS');
  if (!appwriteConfig.collections.inventoryItems) missingVars.push('NEXT_PUBLIC_COLLECTION_INVENTORY_ITEMS');
  if (!appwriteConfig.collections.products) missingVars.push('NEXT_PUBLIC_COLLECTION_PRODUCTS');
  if (!appwriteConfig.collections.productMaterials) missingVars.push('NEXT_PUBLIC_COLLECTION_PRODUCT_MATERIALS');
  if (!appwriteConfig.collections.orders) missingVars.push('NEXT_PUBLIC_COLLECTION_ORDERS');
  if (!appwriteConfig.collections.invoices) missingVars.push('NEXT_PUBLIC_COLLECTION_INVOICES');
  if (!appwriteConfig.collections.payments) missingVars.push('NEXT_PUBLIC_COLLECTION_PAYMENTS');
  if (!appwriteConfig.collections.quotations) missingVars.push('NEXT_PUBLIC_COLLECTION_QUOTATIONS');
  if (!appwriteConfig.collections.expenses) missingVars.push('NEXT_PUBLIC_COLLECTION_EXPENSES');
  if (!appwriteConfig.collections.jobTasks) missingVars.push('NEXT_PUBLIC_COLLECTION_JOB_TASKS');
  
  if (missingVars.length > 0) {
    console.error(`Missing required Appwrite environment variables: ${missingVars.join(', ')}`);
  }
}
