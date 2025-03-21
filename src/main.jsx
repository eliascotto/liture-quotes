import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { DialogProvider } from "./context/DialogContext";
import { attachConsole } from '@tauri-apps/plugin-log';

// Attach the backend logs to the webview console
// Call detach() to detach the console
const detach = await attachConsole();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </React.StrictMode>
);
