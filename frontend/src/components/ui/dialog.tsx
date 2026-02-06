// src/components/ui/dialog.tsx
import { type ReactNode, useState } from 'react';  // ✅ FIX: type ReactNode
import { X } from 'lucide-react';
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Dialog({ isOpen, onClose, children, title, className = "" }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 transform transition-all animate-in fade-in-50 slide-in-from-top-5 duration-300 ${className}`}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            {title && (
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-900" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            {children && (children as any).type?.name === 'DialogFooter' ? 
              children : 
              null
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// 🔹 Hook para controlar el dialog
export function useDialog() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  return { isOpen, open, close };
}

// 🔹 Footer del dialog
interface DialogFooterProps {
  children: ReactNode;
}

export function DialogFooter({ children }: DialogFooterProps) {
  return <div className="flex flex-col sm:flex-row gap-3 pt-2">{children}</div>;
}

// 🔹 Botón Trigger
interface DialogTriggerProps {
  children: ReactNode;
  onClick?: () => void;
}

export function DialogTrigger({ children, onClick }: DialogTriggerProps) {
  return (
    <button onClick={onClick} className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      {children}
    </button>
  );
}
