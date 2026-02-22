import { SystemState, DetectionResult } from "@/types";

/**
 * Build a wait-for graph for single-instance resources.
 * Returns an adjacency list: process i waits for process j
 * if i requests a resource currently held by j.
 */
export function buildWaitForGraph(state: SystemState): Map<number, number[]> {
    const { numProcesses, numResources, allocation, request } = state;
    const graph = new Map<number, number[]>();

    for (let i = 0; i < numProcesses; i++) {
        graph.set(i, []);
    }

    for (let i = 0; i < numProcesses; i++) {
        for (let r = 0; r < numResources; r++) {
            if (request[i][r] > 0) {
                // find who holds resource r
                for (let j = 0; j < numProcesses; j++) {
                    if (j !== i && allocation[j][r] > 0) {
                        graph.get(i)!.push(j);
                    }
                }
            }
        }
    }

    return graph;
}

/**
 * Detect deadlock for single-instance resources using DFS cycle detection
 * on the wait-for graph.
 */
export function detectSingleInstance(state: SystemState): DetectionResult {
    const graph = buildWaitForGraph(state);
    const n = state.numProcesses;

    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Array(n).fill(WHITE);
    const inCycle = new Set<number>();

    function dfs(u: number, stack: number[]): boolean {
        color[u] = GRAY;
        stack.push(u);

        for (const v of graph.get(u) || []) {
            if (color[v] === GRAY) {
                // cycle found — mark all nodes in the cycle
                const cycleStart = stack.indexOf(v);
                for (let k = cycleStart; k < stack.length; k++) {
                    inCycle.add(stack[k]);
                }
                return true;
            }
            if (color[v] === WHITE) {
                if (dfs(v, stack)) return true;
            }
        }

        stack.pop();
        color[u] = BLACK;
        return false;
    }

    for (let i = 0; i < n; i++) {
        if (color[i] === WHITE) {
            dfs(i, []);
        }
    }

    const deadlocked = Array.from(inCycle).sort((a, b) => a - b);

    if (deadlocked.length > 0) {
        return {
            isDeadlocked: true,
            deadlockedProcesses: deadlocked,
            safeSequence: [],
            message: `Deadlock detected! Processes ${deadlocked.map((p) => `P${p}`).join(", ")} are in a cycle.`,
        };
    }

    return {
        isDeadlocked: false,
        deadlockedProcesses: [],
        safeSequence: Array.from({ length: n }, (_, i) => i),
        message: "No deadlock detected. System is safe.",
    };
}

/**
 * Element-wise comparison: returns true if every a[i] <= b[i].
 */
export function isLessOrEqual(a: number[], b: number[]): boolean {
    for (let i = 0; i < a.length; i++) {
        if (a[i] > b[i]) return false;
    }
    return true;
}

/**
 * Detect deadlock for multi-instance resources using Banker's safety algorithm.
 * Work = copy of available; Finish = all false.
 * Repeatedly find Pi where Finish[i]=false and Request[i] <= Work,
 * then Work += Allocation[i], Finish[i] = true, push to safe sequence.
 * Unfinished processes are deadlocked.
 */
export function detectMultiInstance(state: SystemState): DetectionResult {
    const { numProcesses, numResources, available, allocation, request } = state;

    const work = [...available];
    const finish = new Array(numProcesses).fill(false);
    const safeSequence: number[] = [];

    let found = true;
    while (found) {
        found = false;
        for (let i = 0; i < numProcesses; i++) {
            if (!finish[i] && isLessOrEqual(request[i], work)) {
                // grant resources and release allocation
                for (let j = 0; j < numResources; j++) {
                    work[j] += allocation[i][j];
                }
                finish[i] = true;
                safeSequence.push(i);
                found = true;
            }
        }
    }

    const deadlocked = finish
        .map((f, i) => (!f ? i : -1))
        .filter((i) => i !== -1);

    if (deadlocked.length > 0) {
        return {
            isDeadlocked: true,
            deadlockedProcesses: deadlocked,
            safeSequence: [],
            message: `Deadlock detected! Processes ${deadlocked.map((p) => `P${p}`).join(", ")} cannot proceed.`,
        };
    }

    return {
        isDeadlocked: false,
        deadlockedProcesses: [],
        safeSequence,
        message: `System is safe. Safe sequence: ${safeSequence.map((p) => `P${p}`).join(" → ")}`,
    };
}

/**
 * Unified detection: auto-selects single-instance or multi-instance
 * algorithm based on whether any resource has total instances > 1.
 */
export function detectDeadlock(state: SystemState): DetectionResult {
    const { numProcesses, numResources, available, allocation } = state;

    // compute total instances per resource = available + sum of allocation column
    let allSingle = true;
    for (let j = 0; j < numResources; j++) {
        let total = available[j];
        for (let i = 0; i < numProcesses; i++) {
            total += allocation[i][j];
        }
        if (total > 1) {
            allSingle = false;
            break;
        }
    }

    if (allSingle) {
        return detectSingleInstance(state);
    }
    return detectMultiInstance(state);
}
