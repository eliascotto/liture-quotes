import React, { createContext, useContext, useState } from "react";
import Toast from "@components/Toast";

const ToastContext = createContext<{
  addToast: (message: string, type?: string) => void;
  removeToast: (id: string) => void;
}>({
  addToast: () => {},
  removeToast: () => {},
});

type ToastProviderProps = {
  children: React.ReactNode;
  timeout?: number;
};

type Toast = {
  id: string;
  message: string;
  messageType: string;
  key?: string;
  onClose?: () => void;
};

export const ToastProvider = ({
  children,
  timeout = 3000,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev: Toast[]) => [...prev, { id, message, messageType: type, key: id, onClose: () => removeToast(id) }]);
    setTimeout(() => removeToast(id), timeout);
  };

  const removeToast = (id: string) => {
    setToasts((prev: Toast[]) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-16 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            onClose={() => removeToast(toast.id)}
            {...toast} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
