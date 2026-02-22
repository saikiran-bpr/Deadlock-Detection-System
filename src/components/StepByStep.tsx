"use client";

import { useState, useEffect } from "react";
import { StepInfo } from "@/types";

interface StepByStepProps {
    steps: StepInfo[];
    onStepChange?: (currentProcess: number | null, finishedProcesses: boolean[]) => void;
}

export default function StepByStep({ steps, onStepChange }: StepByStepProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // emit step state to parent whenever step changes
    useEffect(() => {
        if (steps && steps.length > 0) {
            const step = steps[currentIndex];
            onStepChange?.(step.selectedProcess, step.finish);
        }
    }, [currentIndex, steps, onStepChange]);

    if (!steps || steps.length === 0) return null;

    const currentStep = steps[currentIndex];
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
        <div className="bg-surface/80 backdrop-blur-md border border-surface-border rounded-xl shadow-xl overflow-hidden p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Step-by-Step Visualization</h2>
                <span className="px-3 py-1 bg-surface-border/50 rounded-full text-sm font-medium text-foreground/80">
                    Step {currentIndex + 1} of {steps.length}
                </span>
            </div>

            <div className="w-full bg-surface-border rounded-full h-2.5 overflow-hidden">
                <div
                    className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="bg-background/80 border border-surface-border p-5 rounded-lg">
                <p className="text-lg font-medium text-foreground/90">{currentStep.explanation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">Work Vector (Available)</h3>
                    <div className="font-mono bg-background/50 border border-surface-border p-3 rounded-lg text-center text-lg shadow-inner">
                        [{currentStep.work.join(", ")}]
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">Finish Array</h3>
                    <div className="font-mono bg-background/50 border border-surface-border p-3 rounded-lg flex items-center justify-center gap-1.5 shadow-inner flex-wrap">
                        {currentStep.finish.map((f, i) => (
                            <span
                                key={i}
                                className={`flex items-center justify-center w-8 h-8 rounded text-sm ${f
                                    ? "bg-success/20 text-success border border-success/30"
                                    : "bg-error/20 text-error border border-error/30"
                                    }`}
                            >
                                {f ? 'T' : 'F'}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {currentStep.safeSequenceSoFar.length > 0 && (
                <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">Safe Sequence So Far</h3>
                    <div className="flex flex-wrap gap-2 items-center bg-background/50 border border-surface-border p-3 rounded-lg">
                        {currentStep.safeSequenceSoFar.map((p, i) => (
                            <div key={i} className="flex items-center">
                                <span className="px-3 py-1 bg-success/20 text-success rounded-md text-sm font-semibold border border-success/30 shadow-sm">
                                    P{p}
                                </span>
                                {i < currentStep.safeSequenceSoFar.length - 1 && (
                                    <span className="mx-2 text-success/60 font-bold">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-3 justify-between pt-6 border-t border-surface-border">
                <button
                    onClick={() => setCurrentIndex(0)}
                    className="px-5 py-2.5 text-sm font-medium hover:bg-surface-border rounded-lg transition-colors border border-surface-border"
                    disabled={currentIndex === 0}
                >
                    Reset
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => setCurrentIndex(0)}
                        className="px-5 py-2.5 text-sm font-medium hover:bg-surface-border rounded-lg transition-colors border border-surface-border"
                        disabled={currentIndex === 0}
                    >
                        Start
                    </button>
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        className="px-5 py-2.5 text-sm font-medium bg-surface-border/50 hover:bg-surface-border rounded-lg transition-colors disabled:opacity-50"
                        disabled={currentIndex === 0}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(steps.length - 1, prev + 1))}
                        className="px-5 py-2.5 text-sm font-medium bg-accent hover:bg-accent-hover text-foreground rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-accent"
                        disabled={currentIndex === steps.length - 1}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
