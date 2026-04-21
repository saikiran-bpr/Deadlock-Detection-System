"use client";

import { useMemo } from "react";
import { SystemState } from "@/types";
import { computeAnalytics } from "@/lib/analytics";

interface AnalyticsDashboardProps {
    state: SystemState;
}

function GaugeRing({ value, label, color, size = 80 }: { value: number; label: string; color: string; size?: number }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - value);
    const percentage = Math.round(value * 100);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="var(--color-surface-border)"
                        strokeWidth={6}
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={6}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color }}>{percentage}%</span>
                </div>
            </div>
            <span className="text-xs text-foreground/60 font-medium text-center">{label}</span>
        </div>
    );
}

function MetricCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
    return (
        <div className="bg-background/50 border border-surface-border rounded-xl p-4 space-y-1">
            <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-foreground/40">{subtitle}</p>
        </div>
    );
}

function BarChart({ data, labels, color, title }: { data: number[]; labels: string[]; color: string; title: string }) {
    const max = Math.max(...data, 0.01);

    return (
        <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">{title}</h4>
            <div className="flex items-end gap-2 h-24">
                {data.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-surface-border/50 rounded-t-sm relative overflow-hidden" style={{ height: "100%" }}>
                            <div
                                className="absolute bottom-0 w-full rounded-t-sm transition-all duration-700 ease-out"
                                style={{
                                    height: `${(val / max) * 100}%`,
                                    backgroundColor: color,
                                    opacity: 0.8,
                                }}
                            />
                        </div>
                        <span className="text-[10px] text-foreground/50 font-mono">{labels[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AnalyticsDashboard({ state }: AnalyticsDashboardProps) {
    const analytics = useMemo(() => computeAnalytics(state), [state]);

    const utilizationLabels = Array.from({ length: state.numResources }, (_, i) => `R${i}`);
    const contentionLabels = Array.from({ length: state.numResources }, (_, i) => `R${i}`);
    const waitDepthLabels = Array.from({ length: state.numProcesses }, (_, i) => `P${i}`);

    const riskLevel = analytics.deadlockProbability > 0.5 ? "HIGH" : analytics.deadlockProbability > 0 ? "MEDIUM" : "LOW";
    const riskColor = analytics.deadlockProbability > 0.5 ? "#ef4444" : analytics.deadlockProbability > 0 ? "#f59e0b" : "#10b981";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">System Analytics</h2>
                <span
                    className="px-3 py-1 rounded-full text-xs font-bold border"
                    style={{ color: riskColor, borderColor: riskColor, backgroundColor: `${riskColor}15` }}
                >
                    Risk: {riskLevel}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="System Load"
                    value={`${Math.round(analytics.systemLoad * 100)}%`}
                    subtitle="Resources allocated"
                    color="#3b82f6"
                />
                <MetricCard
                    title="Safety Margin"
                    value={`${Math.round(analytics.safetyMargin * 100)}%`}
                    subtitle="Processes completable"
                    color="#10b981"
                />
                <MetricCard
                    title="Bottleneck"
                    value={`R${analytics.resourceBottleneck}`}
                    subtitle="Highest contention"
                    color="#f59e0b"
                />
                <MetricCard
                    title="Deadlock Risk"
                    value={`${Math.round(analytics.deadlockProbability * 100)}%`}
                    subtitle="Blocked processes"
                    color={riskColor}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center py-4">
                <GaugeRing value={analytics.averageUtilization} label="Avg Utilization" color="#3b82f6" />
                <GaugeRing value={analytics.safetyMargin} label="Safety Margin" color="#10b981" />
                <GaugeRing value={analytics.systemLoad} label="System Load" color="#8b5cf6" />
                <GaugeRing value={1 - analytics.deadlockProbability} label="Health Score" color={riskColor} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BarChart
                    data={analytics.resourceUtilization}
                    labels={utilizationLabels}
                    color="#3b82f6"
                    title="Resource Utilization"
                />
                <BarChart
                    data={analytics.contentionIndex}
                    labels={contentionLabels}
                    color="#f59e0b"
                    title="Contention Index"
                />
                <BarChart
                    data={analytics.processWaitDepth}
                    labels={waitDepthLabels}
                    color="#ef4444"
                    title="Process Wait Depth"
                />
            </div>
        </div>
    );
}
