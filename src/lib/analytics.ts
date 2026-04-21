import { SystemState, SystemAnalytics, WFGData, WFGEdge } from "@/types";

export function computeAnalytics(state: SystemState): SystemAnalytics {
    const { numProcesses, numResources, available, allocation, request } = state;

    const totalInstances: number[] = [];
    for (let j = 0; j < numResources; j++) {
        let sum = available[j];
        for (let i = 0; i < numProcesses; i++) {
            sum += allocation[i][j];
        }
        totalInstances.push(sum);
    }

    const resourceUtilization = totalInstances.map((total, j) => {
        if (total === 0) return 0;
        const used = total - available[j];
        return used / total;
    });

    const averageUtilization =
        resourceUtilization.length > 0
            ? resourceUtilization.reduce((a, b) => a + b, 0) / resourceUtilization.length
            : 0;

    const contentionIndex = Array.from({ length: numResources }, (_, j) => {
        let requesters = 0;
        for (let i = 0; i < numProcesses; i++) {
            if (request[i][j] > 0) requesters++;
        }
        return requesters / numProcesses;
    });

    const work = [...available];
    const finish = new Array(numProcesses).fill(false);
    let safeCount = 0;
    let found = true;
    while (found) {
        found = false;
        for (let i = 0; i < numProcesses; i++) {
            if (!finish[i]) {
                let canFinish = true;
                for (let j = 0; j < numResources; j++) {
                    if (request[i][j] > work[j]) {
                        canFinish = false;
                        break;
                    }
                }
                if (canFinish) {
                    for (let j = 0; j < numResources; j++) {
                        work[j] += allocation[i][j];
                    }
                    finish[i] = true;
                    safeCount++;
                    found = true;
                }
            }
        }
    }

    const safetyMargin = numProcesses > 0 ? safeCount / numProcesses : 1;

    const processWaitDepth = Array.from({ length: numProcesses }, (_, i) => {
        let depth = 0;
        for (let j = 0; j < numResources; j++) {
            if (request[i][j] > available[j]) depth++;
        }
        return depth;
    });

    const resourceBottleneck = contentionIndex.indexOf(Math.max(...contentionIndex));

    const totalAllocated = allocation.reduce(
        (sum, row) => sum + row.reduce((a, b) => a + b, 0),
        0
    );
    const totalCapacity = totalInstances.reduce((a, b) => a + b, 0);
    const systemLoad = totalCapacity > 0 ? totalAllocated / totalCapacity : 0;

    const unsafeProcesses = finish.filter((f) => !f).length;
    const deadlockProbability = numProcesses > 0 ? unsafeProcesses / numProcesses : 0;

    return {
        resourceUtilization,
        averageUtilization,
        contentionIndex,
        safetyMargin,
        processWaitDepth,
        resourceBottleneck,
        systemLoad,
        deadlockProbability,
    };
}

export function buildWaitForGraphData(state: SystemState): WFGData {
    const { numProcesses, numResources, allocation, request } = state;
    const edges: WFGEdge[] = [];
    const nodes: number[] = Array.from({ length: numProcesses }, (_, i) => i);

    for (let i = 0; i < numProcesses; i++) {
        for (let r = 0; r < numResources; r++) {
            if (request[i][r] > 0) {
                for (let j = 0; j < numProcesses; j++) {
                    if (j !== i && allocation[j][r] > 0) {
                        edges.push({ from: i, to: j, resource: r, inCycle: false });
                    }
                }
            }
        }
    }

    const cycles = findAllCycles(nodes, edges);

    const cycleNodes = new Set<number>();
    cycles.forEach((cycle) => cycle.forEach((n) => cycleNodes.add(n)));

    edges.forEach((edge) => {
        if (cycleNodes.has(edge.from) && cycleNodes.has(edge.to)) {
            for (const cycle of cycles) {
                const fromIdx = cycle.indexOf(edge.from);
                const toIdx = cycle.indexOf(edge.to);
                if (fromIdx !== -1 && toIdx !== -1) {
                    if ((fromIdx + 1) % cycle.length === toIdx) {
                        edge.inCycle = true;
                        break;
                    }
                }
            }
        }
    });

    return { edges, nodes, cycles };
}

function findAllCycles(nodes: number[], edges: WFGEdge[]): number[][] {
    const adj = new Map<number, number[]>();
    nodes.forEach((n) => adj.set(n, []));
    edges.forEach((e) => adj.get(e.from)!.push(e.to));

    const cycles: number[][] = [];
    const visited = new Set<number>();
    const stack: number[] = [];
    const onStack = new Set<number>();

    function dfs(node: number) {
        visited.add(node);
        stack.push(node);
        onStack.add(node);

        for (const neighbor of adj.get(node) || []) {
            if (onStack.has(neighbor)) {
                const cycleStart = stack.indexOf(neighbor);
                const cycle = stack.slice(cycleStart);
                if (cycle.length >= 2) {
                    cycles.push(cycle);
                }
            } else if (!visited.has(neighbor)) {
                dfs(neighbor);
            }
        }

        stack.pop();
        onStack.delete(node);
    }

    for (const node of nodes) {
        visited.clear();
        stack.length = 0;
        onStack.clear();
        dfs(node);
    }

    const unique = new Map<string, number[]>();
    cycles.forEach((cycle) => {
        const sorted = [...cycle].sort((a, b) => a - b);
        const key = sorted.join(",");
        if (!unique.has(key)) unique.set(key, cycle);
    });

    return Array.from(unique.values());
}
