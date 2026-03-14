import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { getExpense } from "@/lib/api/expenses";
import { getInventoryItems } from "@/lib/api/inventory";
import { notFound } from "next/navigation";

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = await params;

  try {
    const [expense, inventoryItems] = await Promise.all([
      getExpense(id),
      getInventoryItems(),
    ]);
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        <ExpenseForm initialData={expense} inventoryItems={inventoryItems} />
      </div>
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
