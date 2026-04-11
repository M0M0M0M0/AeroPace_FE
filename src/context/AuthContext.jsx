import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    else setUser(null);
  }, []);

  const login = async (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    const sessionId = localStorage.getItem("sessionId");

    if (sessionId && userData?.id) {
      try {
        const res = await fetch("http://localhost:8080/api/v1/cart/merge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: sessionId,
            userId: userData.id,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          console.error(" MERGE FAILED");
          return;
        }

        console.log("MERGE SUCCESS → REMOVE SESSION");
        localStorage.removeItem("sessionId");
      } catch (err) {
        console.error(" MERGE ERROR:", err);
      }
    } else {
      console.warn(" NO SESSION OR USER ID");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
