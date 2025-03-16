import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { DialogProvider } from "./context/DialogContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </React.StrictMode>
);
