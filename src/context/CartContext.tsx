"use client";

import React, { createContext, useContext, useEffect, useReducer } from "react";
import { Cart, CartItem, Product, ProductVariant } from "@/types";

interface CartContextType {
  cart: Cart;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (product: Product, variant: ProductVariant | null, quantity?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: "INIT_CART"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: { product: Product; variant: ProductVariant | null; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId: string | null } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; variantId: string | null; quantity: number } }
  | { type: "CLEAR_CART" };

const SHIPPING_FLAT_RATE = 250; // PKR flat rate shipping
const FREE_SHIPPING_THRESHOLD = 5000; // PKR threshold

function calculateCartTotals(items: CartItem[]): Pick<Cart, "subtotal" | "shipping" | "total"> {
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT_RATE;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "INIT_CART":
      return action.payload;

    case "ADD_ITEM": {
      const { product, variant, quantity } = action.payload;
      const variantId = variant?.id || null;
      
      const existingItemIndex = state.findIndex(
        (item) => item.product_id === product.id && item.variant_id === variantId
      );

      if (existingItemIndex > -1) {
        const newState = [...state];
        const newQty = newState[existingItemIndex].quantity + quantity;
        
        // Stock validation check if variant/product stock is available
        const maxStock = variant ? variant.stock_quantity : 99;
        newState[existingItemIndex].quantity = Math.min(newQty, maxStock);
        return newState;
      }

      return [...state, {
        product_id: product.id,
        variant_id: variantId,
        quantity,
        product,
        variant: variant || undefined,
      }];
    }

    case "REMOVE_ITEM": {
      const { productId, variantId } = action.payload;
      return state.filter(
        (item) => !(item.product_id === productId && item.variant_id === variantId)
      );
    }

    case "UPDATE_QUANTITY": {
      const { productId, variantId, quantity } = action.payload;
      return state.map((item) => {
        if (item.product_id === productId && item.variant_id === variantId) {
          const maxStock = item.variant ? item.variant.stock_quantity : 99;
          return {
            ...item,
            quantity: Math.max(1, Math.min(quantity, maxStock)),
          };
        }
        return item;
      });
    }

    case "CLEAR_CART":
      return [];

    default:
      return state;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isCartOpen, setCartOpen] = React.useState(false);

  // Load cart on mount to avoid SSR hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem("ayra_cart");
    if (stored) {
      try {
        dispatch({ type: "INIT_CART", payload: JSON.parse(stored) });
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to local storage when items change
  useEffect(() => {
    localStorage.setItem("ayra_cart", JSON.stringify(items));
  }, [items]);

  const { subtotal, shipping, total } = calculateCartTotals(items);

  const addItem = (product: Product, variant: ProductVariant | null, quantity = 1) => {
    dispatch({ type: "ADD_ITEM", payload: { product, variant, quantity } });
    setCartOpen(true); // Automatically open cart drawer when item is added!
  };

  const removeItem = (productId: string, variantId: string | null) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } });
  };

  const updateQuantity = (productId: string, variantId: string | null, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, variantId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  return (
    <CartContext.Provider
      value={{
        cart: { items, subtotal, shipping, total },
        isCartOpen,
        setCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
