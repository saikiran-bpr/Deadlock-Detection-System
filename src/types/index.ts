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
