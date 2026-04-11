import React from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <motion.div
      layout
      className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-950 p-4 rounded-2xl border border-gray-800 mb-4"
    >
      <img src={item.image} alt={item.name} className="w-32 h-32 object-cover rounded-2xl" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-gray-400">{item.category}</p>
        <p className="font-bold mt-1">{(item.price * item.quantity).toLocaleString()} ₫</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition"
          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
        >
          -
        </button>
        <span>{item.quantity}</span>
        <button
          className="px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
        >
          +
        </button>
        <button
          className="ml-4 text-red-500 hover:text-red-400 transition"
          onClick={() => removeFromCart(item.id)}
        >
          <Trash2 />
        </button>
      </div>
    </motion.div>
  );
};

export default CartItem;
