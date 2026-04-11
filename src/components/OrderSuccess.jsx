import React from "react";
import { useLocation, Link } from "react-router-dom";

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
      <p className="text-gray-400 text-xl mb-4">Không có đơn hàng để hiển thị.</p>
      <Link
        to="/products"
        className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-200 transition font-semibold"
      >
        Quay lại cửa hàng
      </Link>
    </div>
  );

  return (
    <div className="bg-black text-white min-h-screen px-6 md:px-16 py-20">
      <h1 className="text-4xl font-bold mb-6 text-center">Cảm ơn bạn đã mua hàng!</h1>
      <p className="text-center text-gray-300 mb-10">Đơn hàng của bạn đã được ghi nhận:</p>

      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        {order.items.map(item => (
          <div
            key={item.id}
            className="flex justify-between items-center bg-neutral-900 p-4 rounded-xl border border-gray-700"
          >
            <p>{item.name} x {item.quantity}</p>
            <p>{(item.price * item.quantity).toLocaleString()} ₫</p>
          </div>
        ))}
        <div className="flex justify-between items-center mt-6 p-4 bg-neutral-950 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold">Tổng tiền:</h3>
          <p className="text-2xl font-bold">{order.total.toLocaleString()} ₫</p>
        </div>

        <Link
          to="/products"
          className="mt-6 bg-white text-black px-6 py-3 rounded-full hover:bg-gray-200 transition font-semibold text-center"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
