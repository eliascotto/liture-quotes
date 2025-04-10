import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/base.css";
import { DialogProvider } from "./context/DialogContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { attachConsole } from "@tauri-apps/plugin-log";

// Attach the backend logs to the webview console
// Call detach() to detach the console
const detach = await attachConsole();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DialogProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DialogProvider>
  </React.StrictMode>
);
