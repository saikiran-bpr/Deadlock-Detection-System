"use client";

import { SystemState } from "@/types";
import { buildRAGData, GraphNode } from "@/lib/graphBuilder";

interface RAGGraphProps {
    state: SystemState;
}

export default function RAGGraph({ state }: RAGGraphProps) {
    const { nodes, edges } = buildRAGData(state);

    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const svgH = Math.max(state.numProcesses, state.numResources) * 80 + 80;

    return (
        <div className="bg-surface/60 backdrop-blur-md border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
                Resource Allocation Graph
            </h2>

            <svg
                viewBox={`0 0 600 ${svgH}`}
                className="w-full max-w-[600px] mx-auto"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* --- arrow markers --- */}
                <defs>
                    <marker
                        id="arrow-alloc"
                        markerWidth="10"
                        markerHeight="7"
                        refX="10"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
                    </marker>
                    <marker
                        id="arrow-req"
                        markerWidth="10"
                        markerHeight="7"
                        refX="10"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#f87171" />
                    </marker>
                </defs>

                {/* --- edges --- */}
                {edges.map((edge, idx) => {
                    const from = nodeMap.get(edge.from);
                    const to = nodeMap.get(edge.to);
                    if (!from || !to) return null;

                    const isAlloc = edge.type === "allocation";

                    // offset to avoid overlapping lines
                    const offsetY = idx * 0.5;

                    // shorten line so arrow doesn't overlap node
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
                            stroke={isAlloc ? "#38bdf8" : "#f87171"}
                            strokeWidth={2}
                            strokeDasharray={isAlloc ? "none" : "6 4"}
                            markerEnd={
                                isAlloc ? "url(#arrow-alloc)" : "url(#arrow-req)"
                            }
                        />
                    );
                })}

                {/* --- nodes --- */}
                {nodes.map((node) => {
                    if (node.type === "process") {
                        return (
                            <g key={node.id}>
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={24}
                                    fill="#1e293b"
                                    stroke="#38bdf8"
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
                    }

                    // resource = rectangle
                    const w = 48;
                    const h = 36;
                    return (
                        <g key={node.id}>
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
            <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/70 pt-2 border-t border-surface-border">
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
                    <svg width="30" height="10">
                        <line x1="0" y1="5" x2="30" y2="5" stroke="#38bdf8" strokeWidth="2" />
                    </svg>
                    Allocation (R→P)
                </span>
                <span className="flex items-center gap-2">
                    <svg width="30" height="10">
                        <line x1="0" y1="5" x2="30" y2="5" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" />
                    </svg>
                    Request (P→R)
                </span>
            </div>
        </div>
    );
}
