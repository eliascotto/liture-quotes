import "./styles/base.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { applyTheme } from "./utils/theme";
import App from "./App.tsx";
import { DialogProvider } from "./context/DialogContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { attachConsole } from "@tauri-apps/plugin-log";

if (import.meta.env.DEV) {
  // Attach the backend logs to the webview console
  // Call detach() to detach the console
  const detach = await attachConsole();
}

applyTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DialogProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DialogProvider>
  </React.StrictMode>
);
