"use client";

import { useMemo } from "react";
import { SystemState } from "@/types";
import { generateTimeline } from "@/lib/prevention";

interface ProcessTimelineProps {
    state: SystemState;
}

const eventColors: Record<string, string> = {
    acquire: "#10b981",
    release: "#6366f1",
    request: "#3b82f6",
    blocked: "#ef4444",
    deadlocked: "#dc2626",
};

const eventLabels: Record<string, string> = {
    acquire: "Acquired",
    release: "Released",
    request: "Requesting",
    blocked: "Blocked",
    deadlocked: "Deadlocked",
};

export default function ProcessTimeline({ state }: ProcessTimelineProps) {
    const events = useMemo(() => generateTimeline(state), [state]);

    const maxTime = events.length > 0 ? Math.max(...events.map((e) => e.timestamp)) + 1 : 1;
    const laneHeight = 48;
    const headerHeight = 30;
    const leftPad = 50;
    const rightPad = 20;
    const chartWidth = 700;
    const barWidth = chartWidth - leftPad - rightPad;
    const svgHeight = headerHeight + state.numProcesses * laneHeight + 20;

    const timeToX = (t: number) => leftPad + (t / maxTime) * barWidth;

    const eventsByProcess = useMemo(() => {
        const map = new Map<number, typeof events>();
        for (let i = 0; i < state.numProcesses; i++) {
            map.set(i, []);
        }
        events.forEach((e) => {
            map.get(e.processId)!.push(e);
        });
        return map;
    }, [events, state.numProcesses]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Process Timeline</h2>
                <span className="text-xs text-foreground/50 font-mono">{events.length} events</span>
            </div>

            <p className="text-sm text-foreground/50">
                Gantt-style visualization showing resource acquisition and blocking events over time.
            </p>

            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${svgHeight}`} className="w-full min-w-[500px]">
                    {Array.from({ length: Math.min(maxTime + 1, 20) }, (_, t) => (
                        <g key={`grid-${t}`}>
                            <line
                                x1={timeToX(t)}
                                y1={headerHeight}
                                x2={timeToX(t)}
                                y2={svgHeight - 10}
                                stroke="var(--color-surface-border)"
                                strokeWidth={0.5}
                                strokeDasharray="4 4"
                                opacity={0.5}
                            />
                            <text
                                x={timeToX(t)}
                                y={headerHeight - 8}
                                textAnchor="middle"
                                fill="var(--color-foreground)"
                                fontSize={9}
                                opacity={0.4}
                            >
                                t{t}
                            </text>
                        </g>
                    ))}

                    {Array.from({ length: state.numProcesses }, (_, i) => {
                        const y = headerHeight + i * laneHeight;
                        const processEvents = eventsByProcess.get(i) || [];

                        return (
                            <g key={`lane-${i}`}>
                                <rect
                                    x={leftPad}
                                    y={y + 4}
                                    width={barWidth}
                                    height={laneHeight - 8}
                                    rx={4}
                                    fill="var(--color-surface)"
                                    opacity={0.3}
                                />
                                <text
                                    x={leftPad - 10}
                                    y={y + laneHeight / 2}
                                    textAnchor="end"
                                    dominantBaseline="central"
                                    fill="var(--color-foreground)"
                                    fontSize={11}
                                    fontWeight={600}
                                >
                                    P{i}
                                </text>

                                {processEvents.map((event, eIdx) => {
                                    const x = timeToX(event.timestamp);
                                    const color = eventColors[event.type];
                                    const blockWidth = barWidth / maxTime * 0.8;

                                    return (
                                        <g key={`event-${i}-${eIdx}`}>
                                            <rect
                                                x={x}
                                                y={y + 10}
                                                width={Math.max(blockWidth, 16)}
                                                height={laneHeight - 20}
                                                rx={4}
                                                fill={color}
                                                opacity={0.7}
                                                className="timeline-block"
                                            />
                                            <text
                                                x={x + Math.max(blockWidth, 16) / 2}
                                                y={y + laneHeight / 2}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                fill="white"
                                                fontSize={8}
                                                fontWeight={600}
                                            >
                                                R{event.resourceId}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/60 pt-3 border-t border-surface-border">
                {Object.entries(eventColors).filter(([key]) => key !== "release" && key !== "deadlocked").map(([key, color]) => (
                    <span key={key} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.8 }} />
                        {eventLabels[key]}
                    </span>
                ))}
            </div>
        </div>
    );
}
