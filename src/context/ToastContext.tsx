import { useCallback, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { ToastContext, type ToastKind } from "./toastContextValue";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}
const appearance: Record<ToastKind, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "border-theme-success bg-theme-success-tint text-theme-success" },
  error: { icon: CircleAlert, className: "border-theme-danger bg-theme-danger-tint text-theme-danger" },
  info: { icon: Info, className: "border-theme-accent bg-theme-accent-tint text-theme-text" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-3), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[1100] flex max-w-md flex-col gap-2 sm:left-auto sm:right-5 sm:bottom-5">
      {toasts.map((toast) => {
        const Icon = appearance[toast.kind].icon;
        return <div key={toast.id} role={toast.kind === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-card)] border p-3 shadow-lg transition-opacity motion-reduce:transition-none ${appearance[toast.kind].className}`}>
          <Icon size={19} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
          <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="rounded p-0.5 hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
            <X size={16} aria-hidden="true" />
          </button>
        </div>;
      })}
    </div>
  </ToastContext.Provider>;
}

