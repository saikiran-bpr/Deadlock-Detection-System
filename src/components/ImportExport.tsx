"use client";

import { SystemState } from "@/types";

interface ImportExportProps {
    state: SystemState | null;
    onImport: (state: SystemState) => void;
    showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function ImportExport({ state, onImport, showToast }: ImportExportProps) {
    const handleExport = () => {
        if (!state) {
            showToast("No state to export. Generate tables first.", "error");
            return;
        }

        const json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "deadlock_state.json";
        a.click();

        URL.revokeObjectURL(url);
        showToast("State exported successfully!", "success");
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target?.result as string);

                    // validate structure
                    if (
                        typeof data.numProcesses !== "number" ||
                        typeof data.numResources !== "number" ||
                        !Array.isArray(data.available) ||
                        !Array.isArray(data.allocation) ||
                        !Array.isArray(data.request)
                    ) {
                        throw new Error("Missing required fields");
                    }

                    if (data.numProcesses < 1 || data.numResources < 1) {
                        throw new Error("Processes and resources must be ≥ 1");
                    }

                    if (data.available.length !== data.numResources) {
                        throw new Error("Available array length doesn't match numResources");
                    }

                    if (data.allocation.length !== data.numProcesses || data.request.length !== data.numProcesses) {
                        throw new Error("Matrix row count doesn't match numProcesses");
                    }

                    for (let i = 0; i < data.numProcesses; i++) {
                        if (data.allocation[i].length !== data.numResources || data.request[i].length !== data.numResources) {
                            throw new Error(`Row ${i} column count doesn't match numResources`);
                        }
                        for (let j = 0; j < data.numResources; j++) {
                            if (data.allocation[i][j] < 0 || data.request[i][j] < 0) {
                                throw new Error("Matrix values must be non-negative");
                            }
                        }
                    }

                    for (let j = 0; j < data.numResources; j++) {
                        if (data.available[j] < 0) {
                            throw new Error("Available values must be non-negative");
                        }
                    }

                    onImport(data as SystemState);
                    showToast("State imported successfully!", "success");
                } catch (err) {
                    showToast(`Invalid file: ${(err as Error).message}`, "error");
                }
            };

            reader.readAsText(file);
        };

        input.click();
    };

    return (
        <div className="flex flex-wrap gap-3">
            <button
                onClick={handleExport}
                className="px-4 py-2 rounded-lg bg-surface border border-surface-border text-foreground/80 hover:text-foreground
                    font-medium text-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export State
            </button>
            <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-surface border border-surface-border text-foreground/80 hover:text-foreground
                    font-medium text-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Import State
            </button>
        </div>
    );
}
