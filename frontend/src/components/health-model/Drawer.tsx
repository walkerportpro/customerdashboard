import React, { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Drawer({ open, onClose, title, subtitle, children, footer }: DrawerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Mount first, then animate in
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open && !visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-dark-950/60 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[560px] bg-dark-900 border-l border-dark-700/50 z-50 flex flex-col transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-dark-700/50 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            {subtitle && (
              <p className="text-sm text-dark-400 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-dark-400 hover:text-gray-300 hover:bg-dark-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-dark-700/50">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
