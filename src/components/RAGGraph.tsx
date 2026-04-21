"use client";

import { useMemo, useState } from "react";
import { SystemState, DetectionResult } from "@/types";
import { buildRAGData, GraphNode, GraphEdge } from "@/lib/graphBuilder";

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
    const { nodes, edges, svgWidth, svgHeight } = useMemo(() => buildRAGData(state), [state]);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const totalInstances = useMemo(() => {
        const totals: number[] = [];
        for (let j = 0; j < state.numResources; j++) {
            let sum = state.available[j];
            for (let i = 0; i < state.numProcesses; i++) {
                sum += state.allocation[i][j];
            }
            totals.push(sum);
        }
        return totals;
    }, [state]);

    const nodeMap = useMemo(() => {
        const m = new Map<string, GraphNode>();
        nodes.forEach((n) => m.set(n.id, n));
        return m;
    }, [nodes]);

    const deadlockedSet = new Set(
        detectionResult?.isDeadlocked
            ? detectionResult.deadlockedProcesses.map((p) => `P${p}`)
            : []
    );

    const edgeOffsets = useMemo(() => {
        const pairCount = new Map<string, number>();
        const offsets = new Map<number, number>();

        edges.forEach((edge, idx) => {
            const a = edge.from < edge.to ? edge.from : edge.to;
            const b = edge.from < edge.to ? edge.to : edge.from;
            const key = `${a}-${b}`;
            const count = pairCount.get(key) || 0;
            offsets.set(idx, count);
            pairCount.set(key, count + 1);
        });
        return offsets;
    }, [edges]);

    const connectedToHovered = useMemo(() => {
        if (!hoveredNode) return new Set<string>();
        const connected = new Set<string>();
        connected.add(hoveredNode);
        edges.forEach((edge) => {
            if (edge.from === hoveredNode) connected.add(edge.to);
            if (edge.to === hoveredNode) connected.add(edge.from);
        });
        return connected;
    }, [hoveredNode, edges]);

    const getProcessStyle = (id: string) => {
        const idx = parseInt(id.slice(1));

        if (stepState) {
            if (stepState.currentProcess === idx) {
                return { fill: "var(--color-surface)", stroke: "#22d3ee", strokeWidth: 3, glow: "rag-node-current" };
            }
            if (stepState.finishedProcesses[idx]) {
                return { fill: "var(--color-surface)", stroke: "var(--color-surface-border)", strokeWidth: 1.5, glow: "rag-node-finished" };
            }
        }

        if (deadlockedSet.has(id)) {
            return { fill: "#450a0a", stroke: "#ef4444", strokeWidth: 3, glow: "rag-node-deadlocked" };
        }

        if (hoveredNode && !connectedToHovered.has(id)) {
            return { fill: "var(--color-surface)", stroke: "#38bdf8", strokeWidth: 2.5, glow: "rag-node-dimmed" };
        }

        return { fill: "var(--color-surface)", stroke: "#38bdf8", strokeWidth: 2.5, glow: "" };
    };

    const getNodeOpacity = (id: string) => {
        if (hoveredNode && !connectedToHovered.has(id)) return 0.25;
        if (!stepState) return 1;
        const idx = parseInt(id.slice(1));
        if (id.startsWith("P") && stepState.finishedProcesses[idx]) return 0.3;
        return 1;
    };

    const isDeadlockEdge = (edge: GraphEdge) => {
        if (!detectionResult?.isDeadlocked) return false;
        const processEnd = edge.from.startsWith("P") ? edge.from : edge.to;
        return deadlockedSet.has(processEnd);
    };

    const getEdgeOpacity = (edge: GraphEdge) => {
        if (!hoveredNode) return 0.8;
        if (connectedToHovered.has(edge.from) && connectedToHovered.has(edge.to)) return 1;
        return 0.1;
    };

    const buildEdgePath = (from: GraphNode, to: GraphNode, offset: number) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const perpX = -dy / dist;
        const perpY = dx / dist;

        const spreadAmount = offset * 12;

        const fromR = from.type === "process" ? 28 : 30;
        const toR = to.type === "process" ? 32 : 36;

        const startRatio = fromR / dist;
        const endRatio = toR / dist;

        const x1 = from.x + dx * startRatio + perpX * spreadAmount;
        const y1 = from.y + dy * startRatio + perpY * spreadAmount;
        const x2 = from.x + dx * (1 - endRatio) + perpX * spreadAmount;
        const y2 = from.y + dy * (1 - endRatio) + perpY * spreadAmount;

        const midX = (x1 + x2) / 2 + perpX * 14;
        const midY = (y1 + y2) / 2 + perpY * 14;

        return { x1, y1, x2, y2, midX, midY };
    };

    const processR = 28;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">
                    Resource Allocation Graph
                </h2>
                <span className="text-xs text-foreground/40 font-mono">
                    {nodes.length} nodes | {edges.length} edges
                </span>
            </div>

            <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full mx-auto"
                style={{ maxHeight: "600px" }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <marker id="arrow-alloc" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                        <polygon points="0 0, 10 4, 0 8" fill="#38bdf8" />
                    </marker>
                    <marker id="arrow-req" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                        <polygon points="0 0, 10 4, 0 8" fill="#fb923c" />
                    </marker>
                    <marker id="arrow-deadlock" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                        <polygon points="0 0, 10 4, 0 8" fill="#ef4444" />
                    </marker>
                    <filter id="glow-blue">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-red">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <text x={100} y={24} textAnchor="middle" fill="var(--color-foreground)" fontSize={14} fontWeight={600} opacity={0.5}>PROCESSES</text>
                <text x={500} y={24} textAnchor="middle" fill="var(--color-foreground)" fontSize={14} fontWeight={600} opacity={0.5}>RESOURCES</text>

                {edges.map((edge, idx) => {
                    const from = nodeMap.get(edge.from);
                    const to = nodeMap.get(edge.to);
                    if (!from || !to) return null;

                    const isAlloc = edge.type === "allocation";
                    const inCycle = isDeadlockEdge(edge);
                    const offset = edgeOffsets.get(idx) || 0;
                    const { x1, y1, x2, y2 } = buildEdgePath(from, to, offset);

                    const color = inCycle ? "#ef4444" : isAlloc ? "#38bdf8" : "#fb923c";
                    const markerId = inCycle ? "arrow-deadlock" : isAlloc ? "arrow-alloc" : "arrow-req";

                    return (
                        <g key={`edge-${idx}`}>
                            <line
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke={color}
                                strokeWidth={inCycle ? 3 : 2}
                                strokeDasharray={isAlloc ? "none" : "8 4"}
                                markerEnd={`url(#${markerId})`}
                                opacity={getEdgeOpacity(edge)}
                                filter={inCycle ? "url(#glow-red)" : undefined}
                                className="transition-opacity duration-200"
                            />
                            {inCycle && (
                                <circle r="4" fill="#ef4444" className="rag-flow-particle">
                                    <animateMotion
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                        path={`M ${x1} ${y1} L ${x2} ${y2}`}
                                    />
                                </circle>
                            )}
                            {!inCycle && isAlloc && (
                                <circle r="3" fill="#38bdf8" opacity="0.6" className="rag-flow-particle">
                                    <animateMotion
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                        path={`M ${x1} ${y1} L ${x2} ${y2}`}
                                    />
                                </circle>
                            )}
                        </g>
                    );
                })}

                {nodes.map((node) => {
                    const opacity = getNodeOpacity(node.id);

                    if (node.type === "process") {
                        const style = getProcessStyle(node.id);
                        return (
                            <g
                                key={node.id}
                                opacity={opacity}
                                className={`${style.glow} cursor-pointer transition-opacity duration-200`}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                <circle cx={node.x} cy={node.y} r={processR}
                                    fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth}
                                    filter={hoveredNode === node.id ? "url(#glow-blue)" : undefined}
                                />
                                <text x={node.x} y={node.y}
                                    textAnchor="middle" dominantBaseline="central"
                                    fill="var(--color-foreground)" fontSize={14} fontWeight={700}>
                                    {node.label}
                                </text>
                            </g>
                        );
                    }

                    const rIdx = parseInt(node.id.slice(1));
                    const count = Math.max(1, totalInstances[rIdx] || 1);
                    const resW = Math.max(56, count * 20);
                    const resH = 40;
                    const cellW = resW / count;
                    const startX = node.x - 28;
                    const startY = node.y - resH / 2;

                    return (
                        <g
                            key={node.id}
                            opacity={opacity}
                            className="cursor-pointer transition-opacity duration-200"
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            <rect
                                x={startX} y={startY}
                                width={resW} height={resH} rx={4}
                                fill="var(--color-surface)" stroke="#facc15" strokeWidth={2.5}
                                filter={hoveredNode === node.id ? "url(#glow-blue)" : undefined}
                            />
                            {count > 1 && Array.from({ length: count - 1 }).map((_, i) => (
                                <line
                                    key={`part-${i}`}
                                    x1={startX + (i + 1) * cellW} y1={startY}
                                    x2={startX + (i + 1) * cellW} y2={startY + resH}
                                    stroke="#facc15" strokeWidth={1.5} strokeDasharray="3 3"
                                    opacity={0.6}
                                />
                            ))}
                            {Array.from({ length: count }).map((_, i) => {
                                const allocated = state.allocation.reduce((sum, row) => sum + (i < row[rIdx] ? 1 : 0), 0);
                                return (
                                    <circle
                                        key={`dot-${i}`}
                                        cx={startX + i * cellW + cellW / 2}
                                        cy={node.y}
                                        r={5}
                                        fill={allocated > 0 ? "#ef4444" : "#10b981"}
                                        opacity={0.8}
                                    />
                                );
                            })}
                            <text x={node.x} y={node.y - resH / 2 - 14}
                                textAnchor="middle" dominantBaseline="central"
                                fill="var(--color-foreground)" fontSize={14} fontWeight={700}>
                                {node.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground/70 pt-3 border-t border-surface-border">
                <span className="flex items-center gap-2">
                    <svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="var(--color-surface)" stroke="#38bdf8" strokeWidth="2" /></svg>
                    Process
                </span>
                <span className="flex items-center gap-2">
                    <svg width="18" height="18"><rect x="1" y="3" width="16" height="12" rx="4" fill="var(--color-surface)" stroke="#facc15" strokeWidth="2" /></svg>
                    Resource
                </span>
                <span className="flex items-center gap-2">
                    <svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="#450a0a" stroke="#ef4444" strokeWidth="2" /></svg>
                    Deadlocked
                </span>
                <span className="flex items-center gap-2">
                    <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="#10b981" /></svg>
                    Available
                </span>
                <span className="flex items-center gap-2">
                    <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="#ef4444" /></svg>
                    Allocated
                </span>
                <span className="flex items-center gap-2">
                    <svg width="36" height="10">
                        <line x1="0" y1="5" x2="28" y2="5" stroke="#38bdf8" strokeWidth="2" />
                        <polygon points="28 2, 34 5, 28 8" fill="#38bdf8" />
                    </svg>
                    Allocation
                </span>
                <span className="flex items-center gap-2">
                    <svg width="36" height="10">
                        <line x1="0" y1="5" x2="28" y2="5" stroke="#fb923c" strokeWidth="2" strokeDasharray="6 3" />
                        <polygon points="28 2, 34 5, 28 8" fill="#fb923c" />
                    </svg>
                    Request
                </span>
            </div>
        </div>
    );
}
