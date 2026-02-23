"use client";

import { ToastItem } from "@/hooks/useToast";

interface ToastProps {
    toasts: ToastItem[];
    onDismiss: (id: number) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
    if (toasts.length === 0) return null;

    const colorMap = {
        success: "bg-success/20 border-success/50 text-success",
        error: "bg-error/20 border-error/50 text-error",
        info: "bg-accent/20 border-accent/50 text-accent",
    };

    const iconMap = {
        success: "✓",
        error: "✗",
        info: "ℹ",
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg
                        animate-[slideInRight_0.3s_ease-out] ${colorMap[toast.type]}`}
                    onClick={() => onDismiss(toast.id)}
                    role="alert"
                >
                    <span className="text-lg font-bold">{iconMap[toast.type]}</span>
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
