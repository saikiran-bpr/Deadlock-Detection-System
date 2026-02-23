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
    weight: number;
}

/**
 * Build nodes and edges for the Resource Allocation Graph.
 *
 * Layout: bipartite — processes on the left, resources on the right,
 * with generous vertical spacing.
 */
export function buildRAGData(state: SystemState): {
    nodes: GraphNode[];
    edges: GraphEdge[];
    svgWidth: number;
    svgHeight: number;
} {
    const { numProcesses, numResources, allocation, request } = state;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const verticalGap = 100; // space between nodes vertically
    const leftX = 100;
    const rightX = 500;
    const maxRows = Math.max(numProcesses, numResources);
    const svgHeight = maxRows * verticalGap + 80;
    const svgWidth = 600;

    // Center each column vertically
    const processOffsetY = (svgHeight - (numProcesses - 1) * verticalGap) / 2;
    const resourceOffsetY = (svgHeight - (numResources - 1) * verticalGap) / 2;

    for (let i = 0; i < numProcesses; i++) {
        nodes.push({
            id: `P${i}`,
            label: `P${i}`,
            type: "process",
            x: leftX,
            y: processOffsetY + i * verticalGap,
        });
    }

    for (let j = 0; j < numResources; j++) {
        nodes.push({
            id: `R${j}`,
            label: `R${j}`,
            type: "resource",
            x: rightX,
            y: resourceOffsetY + j * verticalGap,
        });
    }

    // Allocation edges: resource → process
    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            if (allocation[i][j] > 0) {
                edges.push({ from: `R${j}`, to: `P${i}`, type: "allocation", weight: allocation[i][j] });
            }
        }
    }

    // Request edges: process → resource
    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            if (request[i][j] > 0) {
                edges.push({ from: `P${i}`, to: `R${j}`, type: "request", weight: request[i][j] });
            }
        }
    }

    return { nodes, edges, svgWidth, svgHeight };
}
