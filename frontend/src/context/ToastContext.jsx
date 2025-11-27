import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = (message) => addToast(message, "success");
  const error = (message) => addToast(message, "error");
  const info = (message) => addToast(message, "info");
  const warning = (message) => addToast(message, "warning");

  return (
    <ToastContext.Provider
      value={{ addToast, removeToast, success, error, info, warning }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center w-full max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 transform translate-x-0 ${
              toast.type === "success"
                ? "bg-white border-green-100 text-green-800"
                : toast.type === "error"
                ? "bg-white border-red-100 text-red-800"
                : toast.type === "warning"
                ? "bg-white border-yellow-100 text-yellow-800"
                : "bg-white border-blue-100 text-blue-800"
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === "success" && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              {toast.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="ml-3 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 text-gray-400 hover:text-gray-900 focus:ring-2 focus:ring-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
