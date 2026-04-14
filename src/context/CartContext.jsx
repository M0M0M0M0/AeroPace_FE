import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const LOCAL_CART_KEY = "guest_cart";

const getLocalCart = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CART_KEY)) || [];
  } catch {
    return [];
  }
};

const saveLocalCart = (items) => {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
};

const buildLocalCartResponse = (items) => ({
  userId: null,
  totalItems: items.reduce((s, i) => s + i.quantity, 0),
  totalAmount: items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
  items: items.map((i) => ({ ...i })),
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const { user } = useAuth();

  const getToken = () => localStorage.getItem("token");

  const fetchCart = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8080/api/v1/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
    }
  };

  const enrichLocalCart = async (localItems) => {
    if (localItems.length === 0) return buildLocalCartResponse([]);

    const productIds = [...new Set(localItems.map((i) => i.productId))];
    const query = productIds.map((id) => `ids=${id}`).join("&");
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/products/by-ids?${query}`,
      );
      const products = await res.json();

      const enriched = localItems.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const variant = product?.variants?.find(
          (v) => v.id === item.productVariantId,
        );
        return {
          ...item,
          productName: product?.name || "",
          price: variant?.price || 0,
          image: product?.images?.[0]?.imageUrl || null,
          option1Value: variant?.option1Value || null,
          option2Value: variant?.option2Value || null,
          option3Value: variant?.option3Value || null,
          stock: variant?.stock || 0,
        };
      });

      return buildLocalCartResponse(enriched);
    } catch (err) {
      console.error(err);
      return buildLocalCartResponse(localItems);
    }
  };

  const mergeLocalCartOnLogin = async () => {
    const localItems = getLocalCart();
    const token = getToken();
    if (!token) return;

    if (localItems.length > 0) {
      try {
        const payload = localItems.map((i) => ({
          productId: i.productId,
          productVariantId: i.productVariantId || null,
          quantity: i.quantity,
        }));

        const res = await fetch("http://localhost:8080/api/v1/cart/merge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setCart(data);
        localStorage.removeItem(LOCAL_CART_KEY);
      } catch (err) {
        console.error(err);
        await fetchCart();
      }
    } else {
      await fetchCart();
    }
  };

  useEffect(() => {
    if (user === undefined) return;

    if (user === null) {
      const localItems = getLocalCart();
      if (localItems.length > 0) {
        enrichLocalCart(localItems).then(setCart);
      } else {
        setCart(null);
      }
      return;
    }

    mergeLocalCartOnLogin();
  }, [user]);

  useEffect(() => {
    if (getToken()) return;
    const localItems = getLocalCart();
    if (localItems.length > 0) {
      enrichLocalCart(localItems).then(setCart);
    }
  }, []);

  const addToCart = async (product, quantity = 1) => {
    const token = getToken();

    if (token) {
      const res = await fetch("http://localhost:8080/api/v1/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          productVariantId: product.variantId || null,
          quantity,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Thêm vào giỏ thất bại");
      }
      const data = await res.json();
      setCart(data);
    } else {
      const localItems = getLocalCart();
      const existingIndex = localItems.findIndex(
        (i) =>
          i.productId === product.id &&
          i.productVariantId === (product.variantId || null),
      );

      if (existingIndex >= 0) {
        localItems[existingIndex].quantity += quantity;
      } else {
        localItems.push({
          cartItemId: `local_${Date.now()}`,
          productId: product.id,
          productVariantId: product.variantId || null,
          productName: product.name || "",
          option1Value: product.option1Value || null,
          price: product.price || 0,
          image: product.image || null,
          quantity,
        });
      }

      saveLocalCart(localItems);
      enrichLocalCart(localItems).then(setCart);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const token = getToken();

    if (token) {
      const res = await fetch(
        `http://localhost:8080/api/v1/cart/items/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Cập nhật thất bại");
      }
      const data = await res.json();
      setCart(data);
    } else {
      const localItems = getLocalCart().map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i,
      );
      const cartItem = cart?.items?.find((i) => i.cartItemId === cartItemId);
      if (cartItem && quantity > cartItem.stock) {
        toast.warning("Số lượng vượt quá tồn kho!");
        return;
      }
      saveLocalCart(localItems);
      enrichLocalCart(localItems).then(setCart);
    }
  };

  const removeFromCart = async (cartItemId) => {
    const token = getToken();

    if (token) {
      const res = await fetch(
        `http://localhost:8080/api/v1/cart/items/${cartItemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setCart(data);
    } else {
      const localItems = getLocalCart().filter(
        (i) => i.cartItemId !== cartItemId,
      );
      saveLocalCart(localItems);
      if (localItems.length > 0) {
        enrichLocalCart(localItems).then(setCart);
      } else {
        setCart(null);
      }
    }
  };

  const clearCart = async () => {
    const token = getToken();

    if (token) {
      await fetch("http://localhost:8080/api/v1/cart/clear", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem(LOCAL_CART_KEY);
    setCart(null);
  };

  const isOutOfStock = (item) => {
    const variants = item.variants;
    if (!variants || variants.length === 0) return true;
    return variants.every((v) => !v.stock || v.stock <= 0);
  };

  const getCartQuantity = (productId, variantId) => {
    if (!cart?.items) return 0;
    return cart.items
      .filter(
        (i) =>
          i.productId === productId &&
          (i.productVariantId ?? null) === (variantId ?? null),
      )
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const isMaxedOut = (item) => {
    if (isOutOfStock(item)) return true;
    return item.variants
      ?.filter((v) => v.stock && v.stock > 0)
      .every((v) => getCartQuantity(item.id, v.id) >= v.stock);
  };

  const getFirstAvailableVariant = (item) => {
    return (
      item.variants?.find((v) => {
        if (!v.stock || v.stock <= 0) return false;
        const inCart = getCartQuantity(item.id, v.id);
        return inCart < v.stock;
      }) || null
    );
  };

  const addItemToCart = async (item, navigate) => {
    const availableVariant = getFirstAvailableVariant(item);
    try {
      await addToCart(
        { id: item.id, variantId: availableVariant?.id || null },
        1,
      );
      toast.success(`Đã thêm ${item.name} vào giỏ hàng!`, {
        id: `add-to-cart`,
        description: availableVariant?.option1Value
          ? `Phân loại: ${availableVariant.option1Value}`
          : undefined,
        action: { label: "Xem giỏ hàng", onClick: () => navigate("/cart") },
      });
    } catch (err) {
      console.error(err);
      toast.error("Thêm vào giỏ hàng thất bại", {
        id: `add-to-cart-error-${item.id}`,
      });
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isOutOfStock,
        isMaxedOut,
        getFirstAvailableVariant,
        addItemToCart,
        getCartQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);