import { SystemState } from "@/types";

export const safeScenario: SystemState = {
    numProcesses: 5,
    numResources: 3,
    available: [3, 3, 2],
    allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
    ],
    request: [
        [7, 4, 3],
        [1, 2, 2],
        [6, 0, 0],
        [0, 1, 1],
        [4, 3, 1],
    ],
};

export const deadlockScenario: SystemState = {
    numProcesses: 4,
    numResources: 3,
    available: [0, 0, 0],
    allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
    ],
    request: [
        [2, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0],
    ],
};

export const singleInstanceDeadlock: SystemState = {
    numProcesses: 3,
    numResources: 3,
    available: [0, 0, 0],
    allocation: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
    ],
    request: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
    ],
};

export const highContentionScenario: SystemState = {
    numProcesses: 6,
    numResources: 4,
    available: [1, 0, 1, 0],
    allocation: [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [1, 0, 0, 1],
        [0, 1, 0, 0],
        [1, 0, 0, 1],
    ],
    request: [
        [0, 0, 1, 1],
        [1, 0, 0, 1],
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [1, 0, 1, 1],
        [0, 1, 1, 0],
    ],
};

export const diningPhilosophers: SystemState = {
    numProcesses: 5,
    numResources: 5,
    available: [0, 0, 0, 0, 0],
    allocation: [
        [1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1],
    ],
    request: [
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0],
    ],
};

export const nearDeadlockScenario: SystemState = {
    numProcesses: 4,
    numResources: 3,
    available: [1, 0, 1],
    allocation: [
        [2, 0, 1],
        [0, 1, 0],
        [1, 1, 0],
        [0, 0, 1],
    ],
    request: [
        [0, 1, 0],
        [1, 0, 1],
        [0, 0, 1],
        [1, 1, 0],
    ],
};

export interface ScenarioInfo {
    id: string;
    name: string;
    description: string;
    state: SystemState;
}

export const scenarios: ScenarioInfo[] = [
    {
        id: "safe",
        name: "Safe System",
        description: "5 processes, 3 resources — has a safe sequence",
        state: safeScenario,
    },
    {
        id: "deadlock-multi",
        name: "Multi-Instance Deadlock",
        description: "4 processes, 3 resources — circular wait, no available",
        state: deadlockScenario,
    },
    {
        id: "deadlock-single",
        name: "Single-Instance Deadlock",
        description: "3 processes, 3 resources — 1 instance each, perfect cycle",
        state: singleInstanceDeadlock,
    },
    {
        id: "deadlock-philosophers",
        name: "Dining Philosophers",
        description: "5 processes, 5 resources — classic circular wait problem",
        state: diningPhilosophers,
    },
    {
        id: "high-contention",
        name: "High Contention",
        description: "6 processes, 4 resources — heavy resource competition",
        state: highContentionScenario,
    },
    {
        id: "near-deadlock",
        name: "Near-Deadlock (Safe)",
        description: "4 processes, 3 resources — tight margins but resolvable",
        state: nearDeadlockScenario,
    },
];
