import React, { createContext, useContext, useState, useEffect } from "react";


const ThemeContext = createContext();


export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    document.documentElement.classList.add("theme-transitioning");
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 350);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


export const useTheme = () => {
  return useContext(ThemeContext);
};