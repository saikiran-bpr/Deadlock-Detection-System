import { SystemState, DetectionResult, StepInfo, ResolveResult, SimulateRequestResult } from "@/types";

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

/**
 * Step-by-step Banker's algorithm for visualization.
 */
export function detectMultiInstanceStepByStep(state: SystemState): StepInfo[] {
    const { numProcesses, numResources, available, allocation, request } = state;
    const steps: StepInfo[] = [];

    const work = [...available];
    const finish = new Array(numProcesses).fill(false);
    const safeSequence: number[] = [];
    let stepNumber = 1;

    // Initial state
    steps.push({
        stepNumber: stepNumber++,
        selectedProcess: null,
        work: [...work],
        finish: [...finish],
        safeSequenceSoFar: [...safeSequence],
        explanation: `Initial state. Work (Available) = [${work.join(", ")}], Finish = [${finish.map(f => f ? "T" : "F").join(", ")}]`,
    });

    let found = true;
    while (found) {
        found = false;
        for (let i = 0; i < numProcesses; i++) {
            if (!finish[i]) {
                steps.push({
                    stepNumber: stepNumber++,
                    selectedProcess: i,
                    work: [...work],
                    finish: [...finish],
                    safeSequenceSoFar: [...safeSequence],
                    explanation: `Checking P${i}... Finish[${i}] is false. Need [${request[i].join(", ")}], Work is [${work.join(", ")}].`,
                });

                if (isLessOrEqual(request[i], work)) {
                    const prevWork = [...work];
                    for (let j = 0; j < numResources; j++) {
                        work[j] += allocation[i][j];
                    }
                    finish[i] = true;
                    safeSequence.push(i);
                    found = true;

                    steps.push({
                        stepNumber: stepNumber++,
                        selectedProcess: i,
                        work: [...work],
                        finish: [...finish],
                        safeSequenceSoFar: [...safeSequence],
                        explanation: `P${i} can finish! Request ≤ Work. Releasing allocated resources [${allocation[i].join(", ")}]. Work becomes [${prevWork.join(", ")}] + [${allocation[i].join(", ")}] = [${work.join(", ")}].`,
                    });
                    // In strict Banker's, some implementations break to rescan from start, but we continue checking next processes to save steps
                } else {
                    steps.push({
                        stepNumber: stepNumber++,
                        selectedProcess: i,
                        work: [...work],
                        finish: [...finish],
                        safeSequenceSoFar: [...safeSequence],
                        explanation: `P${i} cannot finish. Need [${request[i].join(", ")}] > Work [${work.join(", ")}]. Skipping P${i} for now.`,
                    });
                }
            }
        }
    }

    const deadlocked = finish.map((f, i) => (!f ? i : -1)).filter((i) => i !== -1);

    if (deadlocked.length > 0) {
        steps.push({
            stepNumber: stepNumber++,
            selectedProcess: null,
            work: [...work],
            finish: [...finish],
            safeSequenceSoFar: [...safeSequence],
            explanation: `Algorithm terminated. Deadlock detected! Processes ${deadlocked.map((p) => `P${p}`).join(", ")} cannot proceed.`,
        });
    } else {
        steps.push({
            stepNumber: stepNumber++,
            selectedProcess: null,
            work: [...work],
            finish: [...finish],
            safeSequenceSoFar: [...safeSequence],
            explanation: `Algorithm terminated. System is safe! Safe sequence: ${safeSequence.map(p => `P${p}`).join(" → ")}.`,
        });
    }

    return steps;
}

/**
 * Resolve a deadlock by terminating a victim process.
 *
 * If `victimIndex` is provided, that process is killed.
 * Otherwise, the deadlocked process with the smallest total allocation is chosen (min-cost heuristic).
 *
 * The victim's allocated resources are released (added back to available),
 * and its allocation & request rows are zeroed out.
 * Detection is then re-run on the modified state.
 */
export function resolveDeadlock(
    state: SystemState,
    deadlockedProcesses: number[],
    victimIndex?: number
): ResolveResult {
    // Pick victim
    let victim: number;
    if (victimIndex !== undefined && deadlockedProcesses.includes(victimIndex)) {
        victim = victimIndex;
    } else {
        // auto: pick the process with the smallest total allocation
        victim = deadlockedProcesses.reduce((best, p) => {
            const sumP = state.allocation[p].reduce((a, b) => a + b, 0);
            const sumBest = state.allocation[best].reduce((a, b) => a + b, 0);
            return sumP < sumBest ? p : best;
        }, deadlockedProcesses[0]);
    }

    // Deep copy state
    const newAvailable = [...state.available];
    const newAllocation = state.allocation.map((r) => [...r]);
    const newRequest = state.request.map((r) => [...r]);

    // Release victim's resources
    for (let j = 0; j < state.numResources; j++) {
        newAvailable[j] += newAllocation[victim][j];
        newAllocation[victim][j] = 0;
        newRequest[victim][j] = 0;
    }

    const newState: SystemState = {
        numProcesses: state.numProcesses,
        numResources: state.numResources,
        available: newAvailable,
        allocation: newAllocation,
        request: newRequest,
    };

    const newResult = detectDeadlock(newState);

    const releasedResources = state.allocation[victim];
    const message = `Terminated P${victim} (released [${releasedResources.join(", ")}]). ${newResult.message}`;

    return { newState, newResult, victimProcess: victim, message };
}

/**
 * Simulate a resource request to avoid deadlock (Banker's Resource-Request Algorithm).
 * Copies state, simulates granting the request, and checks if the resulting state is safe.
 * Does NOT modify the original state.
 */
export function simulateRequest(
    state: SystemState,
    processIdx: number,
    resourceIdx: number,
    amount: number
): SimulateRequestResult {
    // Basic validations
    if (amount <= 0) {
        return { granted: false, isSafe: false, message: "Request amount must be greater than 0." };
    }
    if (amount > state.request[processIdx][resourceIdx]) {
        return { granted: false, isSafe: false, message: `P${processIdx} has exceeded its maximum claim for R${resourceIdx}.` };
    }
    if (amount > state.available[resourceIdx]) {
        return { granted: false, isSafe: false, message: `Resources not available. P${processIdx} must wait.` };
    }

    // Deep copy state to simulate
    const newAvailable = [...state.available];
    const newAllocation = state.allocation.map((r) => [...r]);
    const newRequest = state.request.map((r) => [...r]);

    // Simulate granting
    newAvailable[resourceIdx] -= amount;
    newAllocation[processIdx][resourceIdx] += amount;
    newRequest[processIdx][resourceIdx] -= amount;

    const simulatedState: SystemState = {
        numProcesses: state.numProcesses,
        numResources: state.numResources,
        available: newAvailable,
        allocation: newAllocation,
        request: newRequest,
    };

    // Check safety
    const result = detectDeadlock(simulatedState);

    if (result.isDeadlocked) {
        return {
            granted: false,
            isSafe: false,
            message: `Request BLOCKED! Granting ${amount} instances of R${resourceIdx} to P${processIdx} would lead to an unsafe state.`,
        };
    }

    return {
        granted: true,
        isSafe: true,
        message: `Request GRANTED! State remains safe.`,
    };
}
