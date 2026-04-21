"use client";

import { useMemo } from "react";
import { SystemState } from "@/types";
import { buildWaitForGraphData } from "@/lib/analytics";

interface WaitForGraphProps {
    state: SystemState;
}

export default function WaitForGraph({ state }: WaitForGraphProps) {
    const wfgData = useMemo(() => buildWaitForGraphData(state), [state]);

    const nodePositions = useMemo(() => {
        const n = state.numProcesses;
        const cx = 200;
        const cy = 200;
        const radius = 140;
        const positions: { x: number; y: number }[] = [];

        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            positions.push({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle),
            });
        }
        return positions;
    }, [state.numProcesses]);

    const cycleNodes = useMemo(() => {
        const set = new Set<number>();
        wfgData.cycles.forEach((cycle) => cycle.forEach((n) => set.add(n)));
        return set;
    }, [wfgData.cycles]);

    const buildCurvedPath = (fromIdx: number, toIdx: number) => {
        const from = nodePositions[fromIdx];
        const to = nodePositions[toIdx];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const nodeR = 28;
        const startRatio = nodeR / dist;
        const endRatio = nodeR / dist;

        const x1 = from.x + dx * startRatio;
        const y1 = from.y + dy * startRatio;
        const x2 = from.x + dx * (1 - endRatio);
        const y2 = from.y + dy * (1 - endRatio);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const perpX = -(y2 - y1) / dist;
        const perpY = (x2 - x1) / dist;
        const curveAmount = 30;

        const cpX = midX + perpX * curveAmount;
        const cpY = midY + perpY * curveAmount;

        return `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Wait-For Graph</h2>
                <div className="flex items-center gap-2">
                    {wfgData.cycles.length > 0 ? (
                        <span className="px-3 py-1 bg-error/20 text-error rounded-full text-xs font-semibold border border-error/30 animate-pulse">
                            {wfgData.cycles.length} Cycle{wfgData.cycles.length > 1 ? "s" : ""} Detected
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-semibold border border-success/30">
                            No Cycles
                        </span>
                    )}
                </div>
            </div>

            <p className="text-sm text-foreground/50">
                Directed graph showing process dependencies. An edge P<sub>i</sub> → P<sub>j</sub> means P<sub>i</sub> waits for a resource held by P<sub>j</sub>.
            </p>

            <svg viewBox="0 0 400 400" className="w-full max-w-md mx-auto" style={{ maxHeight: "400px" }}>
                <defs>
                    <marker id="wfg-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
                    </marker>
                    <marker id="wfg-arrow-cycle" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                    </marker>
                    <filter id="wfg-glow-red">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {wfgData.edges.map((edge, idx) => (
                    <path
                        key={`edge-${idx}`}
                        d={buildCurvedPath(edge.from, edge.to)}
                        fill="none"
                        stroke={edge.inCycle ? "#ef4444" : "#64748b"}
                        strokeWidth={edge.inCycle ? 2.5 : 1.5}
                        strokeDasharray={edge.inCycle ? "none" : "6 3"}
                        markerEnd={edge.inCycle ? "url(#wfg-arrow-cycle)" : "url(#wfg-arrow)"}
                        opacity={edge.inCycle ? 1 : 0.6}
                        filter={edge.inCycle ? "url(#wfg-glow-red)" : undefined}
                        className={edge.inCycle ? "wfg-edge-cycle" : ""}
                    />
                ))}

                {nodePositions.map((pos, i) => {
                    const inCycle = cycleNodes.has(i);
                    return (
                        <g key={`node-${i}`} className={inCycle ? "wfg-node-deadlocked" : ""}>
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={28}
                                fill={inCycle ? "#450a0a" : "var(--color-surface)"}
                                stroke={inCycle ? "#ef4444" : "#38bdf8"}
                                strokeWidth={inCycle ? 3 : 2}
                            />
                            <text
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="var(--color-foreground)"
                                fontSize={13}
                                fontWeight={700}
                            >
                                P{i}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {wfgData.cycles.length > 0 && (
                <div className="bg-error/5 border border-error/20 rounded-lg p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-error">Detected Cycles:</h3>
                    {wfgData.cycles.map((cycle, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-sm font-mono">
                            {cycle.map((node, i) => (
                                <span key={i} className="flex items-center">
                                    <span className="px-2 py-0.5 bg-error/20 text-error rounded text-xs font-bold">
                                        P{node}
                                    </span>
                                    <span className="mx-1 text-error/60">→</span>
                                </span>
                            ))}
                            <span className="px-2 py-0.5 bg-error/20 text-error rounded text-xs font-bold">
                                P{cycle[0]}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/60 pt-3 border-t border-surface-border">
                <span className="flex items-center gap-2">
                    <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="var(--color-surface)" stroke="#38bdf8" strokeWidth="2" /></svg>
                    Process (Safe)
                </span>
                <span className="flex items-center gap-2">
                    <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#450a0a" stroke="#ef4444" strokeWidth="2" /></svg>
                    Process (In Cycle)
                </span>
                <span className="flex items-center gap-2">
                    <svg width="30" height="8">
                        <line x1="0" y1="4" x2="22" y2="4" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 2" />
                        <polygon points="22 1.5, 28 4, 22 6.5" fill="#64748b" />
                    </svg>
                    Waits-For
                </span>
                <span className="flex items-center gap-2">
                    <svg width="30" height="8">
                        <line x1="0" y1="4" x2="22" y2="4" stroke="#ef4444" strokeWidth="2.5" />
                        <polygon points="22 1.5, 28 4, 22 6.5" fill="#ef4444" />
                    </svg>
                    Cycle Edge
                </span>
            </div>
        </div>
    );
}
