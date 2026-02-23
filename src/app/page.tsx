"use client";

import { useState, useCallback } from "react";
import { SystemState, DetectionResult, StepInfo, ResolveResult } from "@/types";
import { detectDeadlock, detectMultiInstanceStepByStep } from "@/lib/deadlockDetector";
import ConfigForm from "@/components/ConfigForm";
import ResultDisplay from "@/components/ResultDisplay";
import RAGGraph, { StepState } from "@/components/RAGGraph";
import SummaryTable from "@/components/SummaryTable";
import StepByStep from "@/components/StepByStep";
import SampleLoader from "@/components/SampleLoader";
import ResolvePanel from "@/components/ResolvePanel";
import ImportExport from "@/components/ImportExport";
import SimulateRequest from "@/components/SimulateRequest";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

export default function Home() {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [steps, setSteps] = useState<StepInfo[] | null>(null);
  const [stepState, setStepState] = useState<StepState | null>(null);

  const [externalState, setExternalState] = useState<SystemState | null>(null);
  const { toasts, showToast, dismissToast } = useToast();

  /* ── Detection ────────────────────────────────────────── */

  const handleDetect = (state: SystemState) => {
    setSystemState(state);
    const result = detectDeadlock(state);
    setDetectionResult(result);
    setSteps(detectMultiInstanceStepByStep(state));
    setStepState(null);
  };

  /* ── Reset ────────────────────────────────────────────── */

  const handleReset = () => {
    setSystemState(null);
    setDetectionResult(null);
    setSteps(null);
    setStepState(null);
    setExternalState(null);
  };

  /* ── Step-by-step callback ────────────────────────────── */

  const handleStepChange = useCallback(
    (currentProcess: number | null, finishedProcesses: boolean[]) => {
      setStepState({ currentProcess, finishedProcesses });
    },
    []
  );

  /* ── Sample scenario loading ──────────────────────────── */

  const handleLoadScenario = (state: SystemState) => {
    // Push into ConfigForm via external state
    setExternalState(state);
    // Clear previous results
    setSystemState(null);
    setDetectionResult(null);
    setSteps(null);
    setStepState(null);
  };

  /* ── Deadlock resolution ──────────────────────────────── */

  const handleResolved = (resolve: ResolveResult) => {
    // Update everything with the new (post-resolution) state
    setSystemState(resolve.newState);
    setDetectionResult(resolve.newResult);
    setSteps(detectMultiInstanceStepByStep(resolve.newState));
    setStepState(null);
    // Also push the new state into ConfigForm so the tables update
    setExternalState(resolve.newState);
  };

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

      {/* ── Sample scenarios ────────────────────────────────── */}
      <div className="px-4 max-w-5xl mx-auto mb-8">
        <SampleLoader onLoad={handleLoadScenario} />
      </div>

      {/* ── Config form (top) ───────────────────────────────── */}
      <div className="px-4">
        <ConfigForm
          onDetect={handleDetect}
          onReset={handleReset}
          hasResult={detectionResult !== null}
          externalState={externalState}
          showToast={showToast}
        />
      </div>

      {/* ── Import / Export ─────────────────────────────────── */}
      <div className="px-4 max-w-5xl mx-auto mt-4">
        <ImportExport
          state={systemState}
          onImport={handleLoadScenario}
          showToast={showToast}
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

          {/* Resolve panel (only shown on deadlock) */}
          {detectionResult.isDeadlocked && (
            <ResolvePanel
              state={systemState}
              result={detectionResult}
              onResolved={handleResolved}
            />
          )}

          {/* Simulate Request Section */}
          <div className="pt-4">
            <SimulateRequest state={systemState} />
          </div>

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

      {/* ── Toast overlay ───────────────────────────────────── */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
