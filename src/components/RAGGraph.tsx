"use client";

import { SystemState, DetectionResult } from "@/types";
import { buildRAGData, GraphNode } from "@/lib/graphBuilder";

export interface StepState {
    currentProcess: number | null;
    finishedProcesses: boolean[];
}

interface RAGGraphProps {
    state: SystemState;
    detectionResult?: DetectionResult | null;
    stepState?: StepState | null;
}

export default function RAGGraph({ state, detectionResult, stepState }: RAGGraphProps) {
    const { nodes, edges } = buildRAGData(state);

    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const svgH = Math.max(state.numProcesses, state.numResources) * 80 + 80;

    const deadlockedSet = new Set(
        detectionResult?.isDeadlocked
            ? detectionResult.deadlockedProcesses.map((p) => `P${p}`)
            : []
    );

    /** Check if an edge is part of the deadlock cycle */
    const isDeadlockEdge = (from: string, to: string) => {
        if (!detectionResult?.isDeadlocked) return false;
        // an edge is in the cycle if both its process endpoint is deadlocked
        const processEnd = from.startsWith("P") ? from : to;
        return deadlockedSet.has(processEnd);
    };

    /** Determine stroke & fill for a process node */
    const getProcessStyle = (id: string) => {
        const idx = parseInt(id.slice(1));

        // step-by-step mode takes priority for current process
        if (stepState) {
            if (stepState.currentProcess === idx) {
                return { fill: "#164e63", stroke: "#22d3ee", strokeWidth: 3, className: "rag-node-current" };
            }
            if (stepState.finishedProcesses[idx]) {
                return { fill: "#1e293b", stroke: "#475569", strokeWidth: 2, className: "rag-node-finished" };
            }
        }

        // deadlock highlighting
        if (deadlockedSet.has(id)) {
            return { fill: "#450a0a", stroke: "#ef4444", strokeWidth: 3, className: "rag-node-deadlocked" };
        }

        return { fill: "#1e293b", stroke: "#38bdf8", strokeWidth: 2, className: "" };
    };

    /** Opacity for finished nodes in step mode */
    const getNodeOpacity = (id: string) => {
        if (!stepState) return 1;
        const idx = parseInt(id.slice(1));
        if (id.startsWith("P") && stepState.finishedProcesses[idx]) return 0.4;
        return 1;
    };

    return (
        <div className="bg-surface/60 backdrop-blur-md border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
                Resource Allocation Graph
            </h2>

            {/* pulse animation for deadlocked nodes */}
            <style>{`
                @keyframes pulse-red {
                    0%, 100% { filter: drop-shadow(0 0 4px #ef4444); }
                    50% { filter: drop-shadow(0 0 12px #ef4444); }
                }
                .rag-node-deadlocked { animation: pulse-red 1.5s ease-in-out infinite; }
                @keyframes glow-cyan {
                    0%, 100% { filter: drop-shadow(0 0 4px #22d3ee); }
                    50% { filter: drop-shadow(0 0 10px #22d3ee); }
                }
                .rag-node-current { animation: glow-cyan 1.2s ease-in-out infinite; }
            `}</style>

            <svg
                viewBox={`0 0 600 ${svgH}`}
                className="w-full max-w-[600px] mx-auto"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* --- arrow markers --- */}
                <defs>
                    <marker id="arrow-alloc" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
                    </marker>
                    <marker id="arrow-req" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#f87171" />
                    </marker>
                    <marker id="arrow-deadlock" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                    </marker>
                </defs>

                {/* --- edges --- */}
                {edges.map((edge, idx) => {
                    const from = nodeMap.get(edge.from);
                    const to = nodeMap.get(edge.to);
                    if (!from || !to) return null;

                    const isAlloc = edge.type === "allocation";
                    const inCycle = isDeadlockEdge(edge.from, edge.to);

                    const offsetY = idx * 0.5;
                    const dx = to.x - from.x;
                    const dy = to.y - from.y + offsetY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const radius = to.type === "process" ? 24 : 20;
                    const ratio = (dist - radius) / dist;

                    const x2 = from.x + dx * ratio;
                    const y2 = from.y + dy * ratio;

                    return (
                        <line
                            key={`edge-${idx}`}
                            x1={from.x}
                            y1={from.y}
                            x2={x2}
                            y2={y2}
                            stroke={inCycle ? "#ef4444" : isAlloc ? "#38bdf8" : "#f87171"}
                            strokeWidth={inCycle ? 3.5 : 2}
                            strokeDasharray={isAlloc ? "none" : "6 4"}
                            markerEnd={
                                inCycle
                                    ? "url(#arrow-deadlock)"
                                    : isAlloc
                                        ? "url(#arrow-alloc)"
                                        : "url(#arrow-req)"
                            }
                        />
                    );
                })}

                {/* --- nodes --- */}
                {nodes.map((node) => {
                    const opacity = getNodeOpacity(node.id);

                    if (node.type === "process") {
                        const style = getProcessStyle(node.id);
                        return (
                            <g key={node.id} opacity={opacity} className={style.className}>
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={24}
                                    fill={style.fill}
                                    stroke={style.stroke}
                                    strokeWidth={style.strokeWidth}
                                />
                                <text
                                    x={node.x}
                                    y={node.y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill="#e2e8f0"
                                    fontSize={13}
                                    fontWeight={600}
                                >
                                    {node.label}
                                </text>
                            </g>
                        );
                    }

                    // resource = rectangle
                    const w = 48;
                    const h = 36;
                    return (
                        <g key={node.id} opacity={opacity}>
                            <rect
                                x={node.x - w / 2}
                                y={node.y - h / 2}
                                width={w}
                                height={h}
                                rx={6}
                                fill="#1e293b"
                                stroke="#facc15"
                                strokeWidth={2}
                            />
                            <text
                                x={node.x}
                                y={node.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#e2e8f0"
                                fontSize={13}
                                fontWeight={600}
                            >
                                {node.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* --- legend --- */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-foreground/70 pt-2 border-t border-surface-border">
                <span className="flex items-center gap-2">
                    <svg width="20" height="20">
                        <circle cx="10" cy="10" r="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                    </svg>
                    Process
                </span>
                <span className="flex items-center gap-2">
                    <svg width="20" height="20">
                        <rect x="2" y="4" width="16" height="12" rx="3" fill="#1e293b" stroke="#facc15" strokeWidth="2" />
                    </svg>
                    Resource
                </span>
                <span className="flex items-center gap-2">
                    <svg width="20" height="20">
                        <circle cx="10" cy="10" r="8" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                    </svg>
                    Deadlocked
                </span>
                <span className="flex items-center gap-2">
                    <svg width="30" height="10">
                        <line x1="0" y1="5" x2="30" y2="5" stroke="#38bdf8" strokeWidth="2" />
                    </svg>
                    Allocation
                </span>
                <span className="flex items-center gap-2">
                    <svg width="30" height="10">
                        <line x1="0" y1="5" x2="30" y2="5" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" />
                    </svg>
                    Request
                </span>
            </div>
        </div>
    );
}
