"use client";

import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

let nextId = 0;

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = nextId++;
        setToasts((prev) => [...prev, { id, message, type }]);

        // auto-dismiss after 3s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, showToast, dismissToast };
}
