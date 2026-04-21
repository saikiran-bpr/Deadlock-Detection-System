import { SystemState, PreventionResult, TimelineEvent } from "@/types";

const processTimestamps = new Map<number, number>();

export function initializeTimestamps(numProcesses: number) {
    processTimestamps.clear();
    for (let i = 0; i < numProcesses; i++) {
        processTimestamps.set(i, Date.now() - (numProcesses - i) * 1000);
    }
}

export function getProcessTimestamp(processId: number): number {
    if (!processTimestamps.has(processId)) {
        processTimestamps.set(processId, Date.now());
    }
    return processTimestamps.get(processId)!;
}

export function waitDie(
    requestingProcess: number,
    holdingProcess: number,
    resourceId: number
): PreventionResult {
    const tsReq = getProcessTimestamp(requestingProcess);
    const tsHold = getProcessTimestamp(holdingProcess);

    if (tsReq < tsHold) {
        return {
            strategy: "wait-die",
            decision: "wait",
            explanation: `P${requestingProcess} (older, ts=${tsReq}) WAITS for P${holdingProcess} (younger, ts=${tsHold}) to release R${resourceId}. Older processes wait for younger ones.`,
            timestamp: Date.now(),
            processId: requestingProcess,
            resourceId,
        };
    } else {
        return {
            strategy: "wait-die",
            decision: "die",
            explanation: `P${requestingProcess} (younger, ts=${tsReq}) DIES (rolls back) because P${holdingProcess} (older, ts=${tsHold}) holds R${resourceId}. Younger processes cannot wait for older ones.`,
            timestamp: Date.now(),
            processId: requestingProcess,
            resourceId,
        };
    }
}

export function woundWait(
    requestingProcess: number,
    holdingProcess: number,
    resourceId: number
): PreventionResult {
    const tsReq = getProcessTimestamp(requestingProcess);
    const tsHold = getProcessTimestamp(holdingProcess);

    if (tsReq < tsHold) {
        return {
            strategy: "wound-wait",
            decision: "wound",
            explanation: `P${requestingProcess} (older, ts=${tsReq}) WOUNDS P${holdingProcess} (younger, ts=${tsHold}), forcing it to release R${resourceId} and roll back. Older processes preempt younger ones.`,
            timestamp: Date.now(),
            processId: requestingProcess,
            resourceId,
        };
    } else {
        return {
            strategy: "wound-wait",
            decision: "wait",
            explanation: `P${requestingProcess} (younger, ts=${tsReq}) WAITS for P${holdingProcess} (older, ts=${tsHold}) to release R${resourceId}. Younger processes wait for older ones.`,
            timestamp: Date.now(),
            processId: requestingProcess,
            resourceId,
        };
    }
}

export function resourceOrdering(
    requestingProcess: number,
    resourceId: number,
    currentlyHeld: number[]
): PreventionResult {
    const maxHeld = currentlyHeld.length > 0 ? Math.max(...currentlyHeld) : -1;

    if (resourceId > maxHeld) {
        return {
            strategy: "resource-ordering",
            decision: "proceed",
            explanation: `P${requestingProcess} requests R${resourceId} (order ${resourceId}) which is higher than max held resource R${maxHeld} (order ${maxHeld}). Request follows ordering — ALLOWED.`,
            timestamp: Date.now(),
            processId: requestingProcess,
            resourceId,
        };
    } else {
        return {
            strategy: "resource-ordering",
            decision: "abort",
            explanation: `P${requestingProcess} requests R${resourceId} (order ${resourceId}) which is <= max held resource R${maxHeld} (order ${maxHeld}). Violates resource ordering — DENIED. Must release higher-order resources first.`,
            timestamp: Date.now(),
            processId: requestingProcess,
            resourceId,
        };
    }
}

export function generateTimeline(state: SystemState): TimelineEvent[] {
    const { numProcesses, numResources, allocation, request, available } = state;
    const events: TimelineEvent[] = [];
    let time = 0;

    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            if (allocation[i][j] > 0) {
                events.push({
                    processId: i,
                    resourceId: j,
                    type: "acquire",
                    timestamp: time,
                });
                time += 1;
            }
        }
    }

    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            if (request[i][j] > 0) {
                if (available[j] >= request[i][j]) {
                    events.push({
                        processId: i,
                        resourceId: j,
                        type: "request",
                        timestamp: time,
                    });
                } else {
                    events.push({
                        processId: i,
                        resourceId: j,
                        type: "blocked",
                        timestamp: time,
                    });
                }
                time += 1;
            }
        }
    }

    return events;
}
