"use server";

import { createAdminClient } from '../appwrite/server';
import { appwriteConfig } from '../appwrite/config';
import { revalidatePath } from 'next/cache';

// Singleton document — always stored with this fixed ID
const CONFIG_DOC_ID = "main";

export interface BusinessConfig {
  // Business identity
  company_name: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo_id?: string;
  // Nepal-specific
  pan_number?: string;
  vat_number?: string;
  company_reg_number?: string;
  // VAT settings
  vat_enabled: boolean;
  vat_rate: number; // default 13 (%)
  // Invoice defaults
  invoice_prefix: string; // default "INV"
  invoice_default_notes?: string;
  invoice_payment_terms?: string;
  // Operational defaults
  low_stock_threshold: number; // default 5
  default_order_deadline_days: number; // default 7
  // Fiscal year
  fiscal_year_type: 'calendar' | 'nepali'; // default 'calendar'
}

const DEFAULT_CONFIG: BusinessConfig = {
  company_name: "PrintFlow Studio",
  tagline: "3D Printing Services",
  vat_enabled: false,
  vat_rate: 13,
  invoice_prefix: "INV",
  low_stock_threshold: 5,
  default_order_deadline_days: 7,
  fiscal_year_type: 'calendar',
};

export async function getBusinessConfig(): Promise<BusinessConfig> {
  const { databases } = await createAdminClient();
  try {
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.businessConfig,
      CONFIG_DOC_ID
    );
    return JSON.parse(JSON.stringify(doc)) as BusinessConfig;
  } catch {
    // Document doesn't exist yet — return defaults
    return DEFAULT_CONFIG;
  }
}

export async function saveBusinessConfig(data: Partial<BusinessConfig>): Promise<BusinessConfig> {
  const { databases } = await createAdminClient();

  // Build payload — only include defined fields
  const payload: Record<string, unknown> = {};
  const fields: (keyof BusinessConfig)[] = [
    "company_name", "tagline", "email", "phone", "address", "website", "logo_id",
    "pan_number", "vat_number", "company_reg_number",
    "vat_enabled", "vat_rate",
    "invoice_prefix", "invoice_default_notes", "invoice_payment_terms",
    "low_stock_threshold", "default_order_deadline_days", "fiscal_year_type",
  ];
  for (const key of fields) {
    if (data[key] !== undefined) {
      payload[key] = data[key] ?? null;
    }
  }

  // Try to update (upsert pattern)
  try {
    await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.businessConfig,
      CONFIG_DOC_ID
    );
    // Exists — update
    const doc = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.businessConfig,
      CONFIG_DOC_ID,
      payload
    );
    revalidatePath('/settings');
    return JSON.parse(JSON.stringify(doc)) as BusinessConfig;
  } catch {
    // Doesn't exist — create with fixed ID
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.businessConfig,
      CONFIG_DOC_ID,
      payload
    );
    revalidatePath('/settings');
    return JSON.parse(JSON.stringify(doc)) as BusinessConfig;
  }
}
