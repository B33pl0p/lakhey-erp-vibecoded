import { getCustomers } from "@/lib/api/customers";
import { getProducts } from "@/lib/api/products";
import { OrderForm } from "@/components/orders/OrderForm";

export default async function NewOrderPage() {
  const [customers, products] = await Promise.all([getCustomers(), getProducts()]);

  return <OrderForm customers={customers} products={products} />;
}
