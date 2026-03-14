import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { getInventoryItems } from "@/lib/api/inventory";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const inventoryItems = await getInventoryItems();

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
      <ExpenseForm inventoryItems={inventoryItems} />
    </div>
  );
}
