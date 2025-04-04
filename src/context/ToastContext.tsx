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

export const ToastProvider = ({
  children,
  timeout = 3000,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

  const addToast = (message: string, type = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev: { id: string; message: string; type: string }[]) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), timeout);
  };

  const removeToast = (id: string) => {
    setToasts((prev: { id: string; message: string; type: string }[]) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
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
