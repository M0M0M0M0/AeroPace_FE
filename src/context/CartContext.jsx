import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const { user } = useAuth();

  // =========================
  // FETCH CART
  // =========================
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const sessionId = localStorage.getItem("sessionId");

      const res = await fetch(
        `http://localhost:8080/api/v1/cart?sessionId=${sessionId || ""}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(sessionId && { "X-Session-Id": sessionId }),
          },
        },
      );
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Re-fetch
  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      setCart(null);
      return;
    }
    fetchCart();
  }, [user]);

  // =========================
  // ADD TO CART
  // =========================
  const addToCart = async (product, quantity = 1) => {
    try {
      const token = localStorage.getItem("token");
      const sessionId = localStorage.getItem("sessionId");
      const payload = {
        productId: product.id,
        productVariantId: product.variantId,
        quantity,
        sessionId: sessionId || null,
      };
      const res = await fetch("http://localhost:8080/api/v1/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(sessionId && { "X-Session-Id": sessionId }),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const newSessionId = res.headers.get("X-Session-Id");
      if (newSessionId) {
        localStorage.setItem("sessionId", newSessionId);
      }
      setCart(data);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // UPDATE ITEM
  // =========================
  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/api/v1/cart/items/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ quantity }),
        },
      );
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // REMOVE ITEM
  // =========================
  const removeFromCart = async (cartItemId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/api/v1/cart/items/${cartItemId}`,
        {
          method: "DELETE",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = () => setCart(null);

  return (
    <CartContext.Provider
      value={{
        cart,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
