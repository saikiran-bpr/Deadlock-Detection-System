"use client";

import { useState, useCallback } from "react";
import { SystemState, DetectionResult, StepInfo } from "@/types";
import { detectDeadlock, detectMultiInstanceStepByStep } from "@/lib/deadlockDetector";
import ConfigForm from "@/components/ConfigForm";
import ResultDisplay from "@/components/ResultDisplay";
import RAGGraph, { StepState } from "@/components/RAGGraph";
import SummaryTable from "@/components/SummaryTable";
import StepByStep from "@/components/StepByStep";
import SampleLoader from "@/components/SampleLoader";

import ImportExport from "@/components/ImportExport";

import Toast from "@/components/Toast";
import Navbar from "@/components/Navbar";
import FadeInSection from "@/components/FadeInSection";
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



  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Hero header & Scenarios ─────────────────────────── */}
      <FadeInSection>
        <section id="home" className="pt-16 pb-12 max-w-7xl mx-auto space-y-10">
          <header className="text-center space-y-3 px-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-accent animate-fade-in-up">
              Deadlock Detection System
            </h1>
            <p className="text-lg md:text-xl text-foreground/60 font-light animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              OS Mini Project — Resource Allocation Graph &amp; Deadlock Detection
            </p>
          </header>

          <div className="px-4 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <SampleLoader onLoad={handleLoadScenario} />
          </div>
        </section>
      </FadeInSection>

      {/* ── Config form (top) ───────────────────────────────── */}
      <FadeInSection delay="100ms">
        <section id="config" className="py-12 px-4 max-w-7xl mx-auto space-y-8">
          <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 md:p-8 shadow-xl">
            <ConfigForm
              onDetect={handleDetect}
              onReset={handleReset}
              hasResult={detectionResult !== null}
              externalState={externalState}
              showToast={showToast}
            />
          </div>

          {/* ── Import / Export ─────────────────────────────────── */}
          <div className="max-w-5xl mx-auto">
            <ImportExport
              state={systemState}
              onImport={handleLoadScenario}
              showToast={showToast}
            />
          </div>
        </section>
      </FadeInSection>

      {/* ── Detection Results ───────────────────────────────── */}
      {detectionResult && systemState && (
        <FadeInSection>
          <section id="detection" className="py-12 px-4 max-w-7xl mx-auto space-y-10">
            {/* Section heading */}
            <div className="flex items-center gap-3 w-full max-w-5xl mx-auto">
              <div className="h-px flex-1 bg-surface-border" />
              <h2 className="text-lg font-semibold text-foreground/60 tracking-wide uppercase">
                Detection Results
              </h2>
              <div className="h-px flex-1 bg-surface-border" />
            </div>

            {/* Result banner */}
            <ResultDisplay result={detectionResult} />



            {/* RAG Graph — full width */}
            <div className="w-full bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 shadow-xl">
              <RAGGraph
                state={systemState}
                detectionResult={detectionResult}
                stepState={stepState}
              />
            </div>

            {/* Summary Table — full width below */}
            <div className="w-full bg-surface/60 backdrop-blur-md border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Process Summary
              </h2>
              <SummaryTable
                state={systemState}
                result={detectionResult}
                stepState={stepState}
              />
            </div>

            {/* Step By Step Visualization */}
            {steps && steps.length > 0 && (
              <FadeInSection delay="100ms">
                <section id="step-by-step" className="pt-16 pb-12">
                  <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 md:p-8 shadow-xl">
                    <StepByStep steps={steps} onStepChange={handleStepChange} />
                  </div>
                </section>
              </FadeInSection>
            )}
          </section>
        </FadeInSection>
      )}

      {/* ── Footer spacer ───────────────────────────────────── */}
      <div className="pb-20" />

      {/* ── Toast overlay ───────────────────────────────────── */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
