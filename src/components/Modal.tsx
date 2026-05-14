"use client";

import { useEffect, useState } from "react";
import { LuCircleAlert, LuCircleCheck, LuInfo, LuTriangleAlert, LuX } from "react-icons/lu";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: "error" | "success" | "warning" | "info" | "confirm";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export default function Modal({
  open,
  onClose,
  title,
  message,
  variant = "info",
  confirmLabel = "OK",
  cancelLabel,
  onConfirm,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  if (!mounted || !open) return null;

  const Icon = {
    error: LuCircleAlert,
    success: LuCircleCheck,
    warning: LuTriangleAlert,
    info: LuInfo,
    confirm: LuCircleCheck,
  }[variant];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box fade-up" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          style={{ position: "absolute", right: "1.25rem", top: "1.25rem", background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: "1.1rem" }}
        >
          <LuX />
        </button>

        <div className={`modal-icon modal-icon-${variant}`}>
          <Icon />
        </div>

        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--t1)", marginBottom: "0.5rem" }}>
          {title}
        </h3>
        
        <p style={{ fontSize: "0.875rem", color: "var(--t2)", lineHeight: 1.6 }}>
          {message}
        </p>

        <div className="modal-actions">
          {cancelLabel && (
            <button className="btn btn-ghost" onClick={onClose}>
              {cancelLabel}
            </button>
          )}
          <button 
            className="btn btn-accent" 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
