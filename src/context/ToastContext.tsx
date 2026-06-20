"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (msg: string, duration?: number) => void;
    error: (msg: string, duration?: number) => void;
    info: (msg: string, duration?: number) => void;
    warning: (msg: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastHelpers = {
    success: (msg: string, dur?: number) => addToast(msg, "success", dur),
    error: (msg: string, dur?: number) => addToast(msg, "error", dur),
    info: (msg: string, dur?: number) => addToast(msg, "info", dur),
    warning: (msg: string, dur?: number) => addToast(msg, "warning", dur),
  };

  return (
    <ToastContext.Provider value={{ toast: toastHelpers }}>
      {children}
      
      {/* Toast Portal Container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
          maxWidth: "350px",
          width: "100%",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ item: ToastMessage; onClose: () => void }> = ({ item, onClose }) => {
  const getIcon = () => {
    switch (item.type) {
      case "success":
        return "✨";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const getBorderColor = () => {
    switch (item.type) {
      case "success":
        return "var(--color-gold, #d4af37)";
      case "error":
        return "var(--color-error, #dc2626)";
      case "warning":
        return "#f59e0b";
      case "info":
      default:
        return "#3b82f6";
    }
  };

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "14px 18px",
        backgroundColor: "rgba(20, 20, 20, 0.95)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${getBorderColor()}`,
        borderRadius: "4px",
        color: "#ffffff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        fontFamily: "var(--font-montserrat), sans-serif",
        fontSize: "13px",
        animation: "toast-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dynamic Entrance Keyframe animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes toast-fade-in {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes toast-progress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "16px" }}>{getIcon()}</span>
        <span style={{ lineHeight: "1.4" }}>{item.message}</span>
      </div>

      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          fontSize: "14px",
          padding: "2px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        ✕
      </button>

      {/* Progress countdown bar at the bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "2px",
          backgroundColor: getBorderColor(),
          animation: `toast-progress ${item.duration || 4000}ms linear forwards`,
        }}
      />
    </div>
  );
};
