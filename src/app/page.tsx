import { createAdminClient } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";
import styles from "./page.module.css";

// Force dynamic to test the real-time fetch on dev
export const dynamic = "force-dynamic";

export default async function Home() {
  let inventoryCount = 0;
  let productsCount = 0;
  let connectionStatus = "Checking...";

  try {
    const { databases } = await createAdminClient();
    
    // Fetch a single document just to verify connection / length
    const inventoryRes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.inventoryItems
    );
    inventoryCount = inventoryRes.total;

    const productsRes = await databases.listDocuments(
         appwriteConfig.databaseId,
         appwriteConfig.collections.products
    );
    productsCount = productsRes.total;

    connectionStatus = "Connected to Appwrite Frontend";
  } catch (error) {
    console.error("Appwrite connection error:", error);
    connectionStatus = "Error Connecting to Appwrite";
  }

  return (
    <div className={styles.container}>
      <main className={styles.hero}>
        <div style={{ marginBottom: '2rem', display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--surface)', borderRadius: '99px', border: '1px solid var(--border)' }}>
          <span style={{ color: connectionStatus.includes('Error') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>●</span> {connectionStatus}
        </div>
        <h1 className={styles.title}>
          PrintFlow ERP
        </h1>
        <p className={styles.description}>
          The next-generation enterprise resource planning platform engineered specifically for modern 3D printing farms. Manage fleet, filaments, and fulfillment with unprecedented clarity.
        </p>
        
        <a href="#dashboard" className={styles.cta}>
          Enter Dashboard
        </a>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Fleet Monitoring 🖨️</h2>
            <p>Real-time telemetry and video feeds for your entire printer array. Predict failures before they ruin a print.</p>
          </div>
          
          <div className={styles.card}>
            <h2>Inventory Tracking 🧵</h2>
            <p>Currently tracking <strong>{inventoryCount}</strong> inventory items in Appwrite. Never run out of materials mid-print.</p>
          </div>
          
          <div className={styles.card}>
            <h2>Order Fulfillment 📦</h2>
            <p>Managing <strong>{productsCount}</strong> products on demand. A seamless pipeline for manufacturing.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
