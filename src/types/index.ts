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
