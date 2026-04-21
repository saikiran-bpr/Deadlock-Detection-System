"use client";

import { useState, useMemo } from "react";
import { SystemState, PreventionResult } from "@/types";
import { waitDie, woundWait, resourceOrdering, initializeTimestamps } from "@/lib/prevention";

interface DeadlockPreventionProps {
    state: SystemState;
}

export default function DeadlockPrevention({ state }: DeadlockPreventionProps) {
    const [requestingProcess, setRequestingProcess] = useState(0);
    const [targetResource, setTargetResource] = useState(0);
    const [results, setResults] = useState<PreventionResult[]>([]);

    useMemo(() => {
        initializeTimestamps(state.numProcesses);
    }, [state.numProcesses]);

    const holdingProcess = useMemo(() => {
        for (let i = 0; i < state.numProcesses; i++) {
            if (i !== requestingProcess && state.allocation[i][targetResource] > 0) {
                return i;
            }
        }
        return null;
    }, [state, requestingProcess, targetResource]);

    const currentlyHeldByRequester = useMemo(() => {
        const held: number[] = [];
        for (let j = 0; j < state.numResources; j++) {
            if (state.allocation[requestingProcess][j] > 0) {
                held.push(j);
            }
        }
        return held;
    }, [state, requestingProcess]);

    const handleSimulate = () => {
        const newResults: PreventionResult[] = [];

        if (holdingProcess !== null) {
            newResults.push(waitDie(requestingProcess, holdingProcess, targetResource));
            newResults.push(woundWait(requestingProcess, holdingProcess, targetResource));
        }

        newResults.push(resourceOrdering(requestingProcess, targetResource, currentlyHeldByRequester));
        setResults(newResults);
    };

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case "wait": return "#f59e0b";
            case "die": return "#ef4444";
            case "wound": return "#8b5cf6";
            case "proceed": return "#10b981";
            case "abort": return "#ef4444";
            default: return "#64748b";
        }
    };

    const getDecisionIcon = (decision: string) => {
        switch (decision) {
            case "wait": return "⏳";
            case "die": return "💀";
            case "wound": return "⚔️";
            case "proceed": return "✓";
            case "abort": return "✗";
            default: return "?";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Deadlock Prevention</h2>
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold border border-accent/20">
                    3 Strategies
                </span>
            </div>

            <p className="text-sm text-foreground/50">
                Compare how different prevention strategies handle resource conflicts.
                Select a process requesting a resource and see how Wait-Die, Wound-Wait, and Resource Ordering respond.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background/50 border border-surface-border rounded-xl p-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                        Requesting Process
                    </label>
                    <select
                        value={requestingProcess}
                        onChange={(e) => setRequestingProcess(Number(e.target.value))}
                        className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                        {Array.from({ length: state.numProcesses }, (_, i) => (
                            <option key={i} value={i}>P{i}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                        Target Resource
                    </label>
                    <select
                        value={targetResource}
                        onChange={(e) => setTargetResource(Number(e.target.value))}
                        className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                        {Array.from({ length: state.numResources }, (_, i) => (
                            <option key={i} value={i}>R{i}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleSimulate}
                        className="w-full px-5 py-2 bg-accent hover:bg-accent-hover text-foreground rounded-lg font-medium text-sm transition-all active:scale-95 shadow-sm"
                    >
                        Compare Strategies
                    </button>
                </div>
            </div>

            {holdingProcess !== null && (
                <div className="text-sm text-foreground/60 bg-surface/50 border border-surface-border rounded-lg px-4 py-3">
                    R{targetResource} is currently held by <span className="font-bold text-foreground">P{holdingProcess}</span>
                    {currentlyHeldByRequester.length > 0 && (
                        <span> | P{requestingProcess} currently holds: [{currentlyHeldByRequester.map(r => `R${r}`).join(", ")}]</span>
                    )}
                </div>
            )}

            {holdingProcess === null && (
                <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-4 py-3">
                    R{targetResource} is not held by any other process — request can be granted directly.
                </div>
            )}

            {results.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    {results.map((result, idx) => {
                        const color = getDecisionColor(result.decision);
                        return (
                            <div
                                key={idx}
                                className="bg-surface/60 border rounded-xl p-5 space-y-3 animate-[fadeSlideIn_0.3s_ease-out]"
                                style={{ borderColor: `${color}40` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{getDecisionIcon(result.decision)}</span>
                                        <div>
                                            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color }}>
                                                {result.strategy.replace("-", " ")}
                                            </h4>
                                            <span className="text-xs text-foreground/50">Prevention Strategy</span>
                                        </div>
                                    </div>
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold uppercase border"
                                        style={{ color, borderColor: color, backgroundColor: `${color}15` }}
                                    >
                                        {result.decision}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/70 leading-relaxed">
                                    {result.explanation}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="bg-background/50 border border-surface-border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/60">Strategy Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-2">
                        <h4 className="font-bold text-amber-400">Wait-Die (Non-preemptive)</h4>
                        <p className="text-foreground/50 leading-relaxed">
                            Older processes wait for younger ones. Younger processes roll back (die) if they request a resource held by an older process.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-purple-400">Wound-Wait (Preemptive)</h4>
                        <p className="text-foreground/50 leading-relaxed">
                            Older processes preempt (wound) younger ones holding needed resources. Younger processes must wait for older ones.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-emerald-400">Resource Ordering</h4>
                        <p className="text-foreground/50 leading-relaxed">
                            Resources are assigned a total order. Processes can only request resources with a higher order than any they currently hold.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
