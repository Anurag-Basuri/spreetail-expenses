import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  // Handle Escape key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={cn(
            "bg-surface rounded-2xl shadow-xl border border-border w-full max-w-lg pointer-events-auto flex flex-col max-h-[90vh]",
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 text-ink-400 hover:text-ink-600 hover:bg-canvas rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
