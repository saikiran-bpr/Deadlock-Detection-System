import { SystemState } from "@/types";

export interface GraphNode {
    id: string;
    label: string;
    type: "process" | "resource";
    x: number;
    y: number;
}

export interface GraphEdge {
    from: string;
    to: string;
    type: "allocation" | "request";
}

/**
 * Build nodes and edges for the Resource Allocation Graph.
 * Processes on the left, resources on the right.
 */
export function buildRAGData(state: SystemState): {
    nodes: GraphNode[];
    edges: GraphEdge[];
} {
    const { numProcesses, numResources, allocation, request } = state;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const svgW = 600;
    const svgH = Math.max(numProcesses, numResources) * 80 + 80;

    // process nodes — left column
    for (let i = 0; i < numProcesses; i++) {
        const spacing = svgH / (numProcesses + 1);
        nodes.push({
            id: `P${i}`,
            label: `P${i}`,
            type: "process",
            x: 150,
            y: spacing * (i + 1),
        });
    }

    // resource nodes — right column
    for (let j = 0; j < numResources; j++) {
        const spacing = svgH / (numResources + 1);
        nodes.push({
            id: `R${j}`,
            label: `R${j}`,
            type: "resource",
            x: 450,
            y: spacing * (j + 1),
        });
    }

    // allocation edges: resource → process
    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            if (allocation[i][j] > 0) {
                edges.push({ from: `R${j}`, to: `P${i}`, type: "allocation" });
            }
        }
    }

    // request edges: process → resource
    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            if (request[i][j] > 0) {
                edges.push({ from: `P${i}`, to: `R${j}`, type: "request" });
            }
        }
    }

    return { nodes, edges };
}
