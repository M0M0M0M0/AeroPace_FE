import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 2500,
        style: { background: "#000", color: "#e5e4e4", borderRadius: "12px" },
      }}
      offset={"4rem"}
      gap={8}
      visibleToasts={5}
      expand={true}
    />
  </React.StrictMode>
);
