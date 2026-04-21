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
import WaitForGraph from "@/components/WaitForGraph";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ProcessTimeline from "@/components/ProcessTimeline";
import DeadlockPrevention from "@/components/DeadlockPrevention";
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
    setExternalState(null);
  };

  const handleStepChange = useCallback(
    (currentProcess: number | null, finishedProcesses: boolean[]) => {
      setStepState({ currentProcess, finishedProcesses });
    },
    []
  );

  const handleLoadScenario = (state: SystemState) => {
    setExternalState(state);
    setSystemState(null);
    setDetectionResult(null);
    setSteps(null);
    setStepState(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <FadeInSection>
        <section id="home" className="pt-16 pb-12 max-w-7xl mx-auto space-y-10">
          <header className="text-center space-y-3 px-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-accent animate-fade-in-up">
              Deadlock Detection System
            </h1>
            <p className="text-lg md:text-xl text-foreground/60 font-light animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Interactive Resource Allocation Graph Visualization, Detection, Prevention &amp; Analysis
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium border border-accent/20">
                Banker&apos;s Algorithm
              </span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-medium border border-purple-500/20">
                Wait-For Graph
              </span>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-medium border border-amber-500/20">
                DFS Cycle Detection
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                Prevention Strategies
              </span>
              <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-xs font-medium border border-rose-500/20">
                Real-time Analytics
              </span>
            </div>
          </header>

          <div className="px-4 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <SampleLoader onLoad={handleLoadScenario} />
          </div>
        </section>
      </FadeInSection>

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

          <div className="max-w-5xl mx-auto">
            <ImportExport
              state={systemState}
              onImport={handleLoadScenario}
              showToast={showToast}
            />
          </div>
        </section>
      </FadeInSection>

      {detectionResult && systemState && (
        <>
          <FadeInSection>
            <section id="detection" className="py-12 px-4 max-w-7xl mx-auto space-y-10">
              <div className="flex items-center gap-3 w-full max-w-5xl mx-auto">
                <div className="h-px flex-1 bg-surface-border" />
                <h2 className="text-lg font-semibold text-foreground/60 tracking-wide uppercase">
                  Detection Results
                </h2>
                <div className="h-px flex-1 bg-surface-border" />
              </div>

              <ResultDisplay result={detectionResult} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 shadow-xl">
                  <RAGGraph
                    state={systemState}
                    detectionResult={detectionResult}
                    stepState={stepState}
                  />
                </div>

                <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 shadow-xl">
                  <WaitForGraph state={systemState} />
                </div>
              </div>

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
            </section>
          </FadeInSection>

          <FadeInSection delay="50ms">
            <section id="analytics" className="py-12 px-4 max-w-7xl mx-auto space-y-10">
              <div className="flex items-center gap-3 w-full max-w-5xl mx-auto">
                <div className="h-px flex-1 bg-surface-border" />
                <h2 className="text-lg font-semibold text-foreground/60 tracking-wide uppercase">
                  System Analytics
                </h2>
                <div className="h-px flex-1 bg-surface-border" />
              </div>

              <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 md:p-8 shadow-xl">
                <AnalyticsDashboard state={systemState} />
              </div>

              <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 md:p-8 shadow-xl">
                <ProcessTimeline state={systemState} />
              </div>
            </section>
          </FadeInSection>

          <FadeInSection delay="100ms">
            <section id="prevention" className="py-12 px-4 max-w-7xl mx-auto space-y-10">
              <div className="flex items-center gap-3 w-full max-w-5xl mx-auto">
                <div className="h-px flex-1 bg-surface-border" />
                <h2 className="text-lg font-semibold text-foreground/60 tracking-wide uppercase">
                  Deadlock Prevention
                </h2>
                <div className="h-px flex-1 bg-surface-border" />
              </div>

              <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 md:p-8 shadow-xl">
                <DeadlockPrevention state={systemState} />
              </div>
            </section>
          </FadeInSection>

          {steps && steps.length > 0 && (
            <FadeInSection delay="100ms">
              <section id="step-by-step" className="py-12 px-4 max-w-7xl mx-auto">
                <div className="bg-surface/30 backdrop-blur-sm border border-surface-border rounded-2xl p-6 md:p-8 shadow-xl">
                  <StepByStep steps={steps} onStepChange={handleStepChange} />
                </div>
              </section>
            </FadeInSection>
          )}
        </>
      )}

      <div className="pb-20" />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
