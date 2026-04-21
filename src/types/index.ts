/** State of the resource allocation system */
export interface SystemState {
    numProcesses: number;
    numResources: number;
    available: number[];
    allocation: number[][];
    request: number[][];
}

/** Result returned by any deadlock detection algorithm */
export interface DetectionResult {
    isDeadlocked: boolean;
    deadlockedProcesses: number[];
    safeSequence: number[];
    message: string;
}

/** Info for each step in Banker's algorithm */
export interface StepInfo {
    stepNumber: number;
    selectedProcess: number | null;
    work: number[];
    finish: boolean[];
    safeSequenceSoFar: number[];
    explanation: string;
}

/** Result returned by deadlock resolution */
export interface ResolveResult {
    newState: SystemState;
    newResult: DetectionResult;
    victimProcess: number;
    message: string;
}

/** Result returned by simulating a request */
export interface SimulateRequestResult {
    granted: boolean;
    isSafe: boolean;
    message: string;
}

/** Analytics data for the system */
export interface SystemAnalytics {
    resourceUtilization: number[];
    averageUtilization: number;
    contentionIndex: number[];
    safetyMargin: number;
    processWaitDepth: number[];
    resourceBottleneck: number;
    systemLoad: number;
    deadlockProbability: number;
}

/** Wait-For Graph edge */
export interface WFGEdge {
    from: number;
    to: number;
    resource: number;
    inCycle: boolean;
}

/** Wait-For Graph data */
export interface WFGData {
    edges: WFGEdge[];
    nodes: number[];
    cycles: number[][];
}

/** Deadlock prevention strategy result */
export interface PreventionResult {
    strategy: "wait-die" | "wound-wait" | "resource-ordering";
    decision: "wait" | "die" | "wound" | "proceed" | "abort";
    explanation: string;
    timestamp: number;
    processId: number;
    resourceId: number;
}

/** Process timeline event */
export interface TimelineEvent {
    processId: number;
    resourceId: number;
    type: "acquire" | "release" | "request" | "blocked" | "deadlocked";
    timestamp: number;
}
