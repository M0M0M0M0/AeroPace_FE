import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from '../context/AuthContext';

export const usePreferences = () => {
     const { user, token } = useAuth(); // Lấy token từ AuthContext của bạn
  //const token = localStorage.getItem("token"); // Hoặc lấy trực tiếp nếu bạn đang lưu ở đây

  const [compareList, setCompareList] = useState([]);

  // 1. LOAD DỮ LIỆU BAN ĐẦU
  useEffect(() => {
  
    // --- Xử lý Compare (Luôn lưu Local vì tính chất tạm thời) ---
    const savedCompare = JSON.parse(localStorage.getItem("compareList")) || [];
    setCompareList(savedCompare);
  }, [token]);


  // 3. TOGGLE SO SÁNH (GIỮ NGUYÊN LOCAL STORAGE)
  const toggleCompare = (product, e) => {
    e.stopPropagation();
    let updatedList;
    if (compareList.some((item) => item.id === product.id)) {
      updatedList = compareList.filter((item) => item.id !== product.id);
    } else {
      if (compareList.length >= 3) {
        toast.error("You can only compare up to 3 products");
        return;
      }
      updatedList = [...compareList, product];
      toast.success("Product added to comparison list");
    }
    setCompareList(updatedList);
    localStorage.setItem("compareList", JSON.stringify(updatedList));
  };

  const removeCompare = (productId) => {
    const updatedList = compareList.filter((item) => item.id !== productId);
    setCompareList(updatedList);
    localStorage.setItem("compareList", JSON.stringify(updatedList));
  };

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem("compareList");
  };

  return {  compareList, toggleCompare, removeCompare, clearCompare };
};