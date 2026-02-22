"use client";

import { useState, useCallback } from "react";
import { SystemState, DetectionResult, StepInfo } from "@/types";
import { detectDeadlock, detectMultiInstanceStepByStep } from "@/lib/deadlockDetector";
import ConfigForm from "@/components/ConfigForm";
import ResultDisplay from "@/components/ResultDisplay";
import RAGGraph, { StepState } from "@/components/RAGGraph";
import SummaryTable from "@/components/SummaryTable";
import StepByStep from "@/components/StepByStep";

export default function Home() {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [steps, setSteps] = useState<StepInfo[] | null>(null);
  const [stepState, setStepState] = useState<StepState | null>(null);

  const handleDetect = (state: SystemState) => {
    setSystemState(state);
    const result = detectDeadlock(state);
    setDetectionResult(result);
    setSteps(detectMultiInstanceStepByStep(state));
    setStepState(null);
  };

  const handleReset = () => {
    setSystemState(null);
    setDetectionResult(null);
    setSteps(null);
    setStepState(null);
  };

  const handleStepChange = useCallback(
    (currentProcess: number | null, finishedProcesses: boolean[]) => {
      setStepState({ currentProcess, finishedProcesses });
    },
    []
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Hero header ─────────────────────────────────────── */}
      <header className="pt-16 pb-10 text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-accent">
          Deadlock Detection System
        </h1>
        <p className="text-lg md:text-xl text-foreground/60 font-light">
          OS Mini Project — Resource Allocation Graph &amp; Deadlock Detection
        </p>
      </header>

      {/* ── Config form (top) ───────────────────────────────── */}
      <div className="px-4">
        <ConfigForm
          onDetect={handleDetect}
          onReset={handleReset}
          hasResult={detectionResult !== null}
        />
      </div>

      {/* ── Detection Results ───────────────────────────────── */}
      {detectionResult && systemState && (
        <div className="px-4 mt-12 max-w-5xl mx-auto space-y-10 animate-[fadeSlideIn_0.4s_ease-out]">
          {/* Section heading */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-surface-border" />
            <h2 className="text-lg font-semibold text-foreground/60 tracking-wide uppercase">
              Detection Results
            </h2>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          {/* Result banner */}
          <ResultDisplay result={detectionResult} />

          {/* Graph (left) + Summary Table (right) */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* RAG Graph */}
            <div className="flex-1 min-w-0">
              <RAGGraph
                state={systemState}
                detectionResult={detectionResult}
                stepState={stepState}
              />
            </div>

            {/* Summary Table */}
            <div className="flex-1 min-w-0">
              <div className="bg-surface/60 backdrop-blur-md border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  Process Summary
                </h2>
                <SummaryTable
                  state={systemState}
                  result={detectionResult}
                  stepState={stepState}
                />
              </div>
            </div>
          </div>

          {/* Step By Step Visualization */}
          {steps && steps.length > 0 && (
            <div className="mt-12 animate-[fadeSlideIn_0.4s_ease-out_0.2s] fill-mode-both">
              <StepByStep steps={steps} onStepChange={handleStepChange} />
            </div>
          )}
        </div>
      )}

      {/* ── Footer spacer ───────────────────────────────────── */}
      <div className="pb-20" />
    </main>
  );
}
