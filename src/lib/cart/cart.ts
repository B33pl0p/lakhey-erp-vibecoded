export type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string | null;
  quantity: number;
};

export type CartProductInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

const CART_KEY = "lakheylabs-cart";
export const CART_EVENT = "lakheylabs-cart-updated";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readCart(): CartItem[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        id: String(item?.id || ""),
        name: String(item?.name || ""),
        category: String(item?.category || ""),
        price: Number(item?.price || 0),
        description: String(item?.description || ""),
        imageUrl: item?.imageUrl ? String(item.imageUrl) : null,
        quantity: Math.max(1, Number(item?.quantity || 1)),
      }))
      .filter((item) => item.id && item.name);
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addCartItem(product: CartProductInput) {
  const items = readCart();
  const quantityToAdd = Math.max(1, Number(product.quantity || 1));
  const existingIndex = items.findIndex((item) => item.id === product.id);

  if (existingIndex >= 0) {
    const current = items[existingIndex];
    items[existingIndex] = {
      ...current,
      quantity: current.quantity + quantityToAdd,
      price: product.price,
      name: product.name,
      category: product.category,
      description: product.description,
      imageUrl: product.imageUrl,
    };
  } else {
    items.push({
      ...product,
      quantity: quantityToAdd,
    });
  }

  writeCart(items);
  return items;
}

export function updateCartItemQuantity(productId: string, quantity: number) {
  const nextQuantity = Math.max(1, Number(quantity || 1));
  const items = readCart().map((item) =>
    item.id === productId ? { ...item, quantity: nextQuantity } : item
  );
  writeCart(items);
  return items;
}

export function removeCartItem(productId: string) {
  const items = readCart().filter((item) => item.id !== productId);
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
