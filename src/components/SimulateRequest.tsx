"use client";

import { useState } from "react";
import { SystemState, SimulateRequestResult } from "@/types";
import { simulateRequest } from "@/lib/deadlockDetector";

interface SimulateRequestProps {
    state: SystemState;
}

export default function SimulateRequest({ state }: SimulateRequestProps) {
    const [processIdx, setProcessIdx] = useState<number>(0);
    const [resourceIdx, setResourceIdx] = useState<number>(0);
    const [amount, setAmount] = useState<number>(1);
    const [simResult, setSimResult] = useState<SimulateRequestResult | null>(null);

    const handleSimulate = () => {
        const result = simulateRequest(state, processIdx, resourceIdx, amount);
        setSimResult(result);
    };

    const handleClose = () => {
        setSimResult(null);
    };

    return (
        <div className="bg-surface border border-surface-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight text-foreground/90 mb-4">
                Simulate Resource Request
            </h3>
            <p className="text-sm text-foreground/70 mb-5">
                Check if granting a request would leave the system in a safe state (Deadlock Avoidance).
                Simulated requests do not modify the actual system state.
            </p>

            <div className="flex flex-wrap items-end gap-4 mb-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Process</label>
                    <select
                        className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 outline-none transition-shadow"
                        value={processIdx}
                        onChange={(e) => setProcessIdx(Number(e.target.value))}
                    >
                        {Array.from({ length: state.numProcesses }).map((_, i) => (
                            <option key={i} value={i}>
                                P{i}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Resource</label>
                    <select
                        className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 outline-none transition-shadow"
                        value={resourceIdx}
                        onChange={(e) => setResourceIdx(Number(e.target.value))}
                    >
                        {Array.from({ length: state.numResources }).map((_, i) => (
                            <option key={i} value={i}>
                                R{i}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2 w-24">
                    <label className="text-sm font-medium text-foreground/80">Amount</label>
                    <input
                        type="number"
                        min={1}
                        className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 outline-none transition-shadow"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                    />
                </div>

                <button
                    onClick={handleSimulate}
                    className="px-6 py-2 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-foreground text-accent rounded-lg transition-colors font-medium shadow-sm"
                >
                    Simulate
                </button>
            </div>

            {simResult && (
                <div
                    className={`flex items-start gap-4 p-4 rounded-lg border animate-[fadeSlideIn_0.2s_ease-out] relative ${simResult.granted
                            ? "bg-success/10 border-success/30"
                            : "bg-error/10 border-error/30"
                        }`}
                >
                    <div className="flex-1">
                        <h4 className={`text-md font-semibold mb-1 ${simResult.granted ? "text-success" : "text-error"
                            }`}>
                            {simResult.granted ? "✓ Request GRANTED" : "✗ Request BLOCKED"}
                        </h4>
                        <p className="text-sm text-foreground/80">{simResult.message}</p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="text-foreground/40 hover:text-foreground/80 transition-colors p-1 rounded-md"
                        aria-label="Close message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
